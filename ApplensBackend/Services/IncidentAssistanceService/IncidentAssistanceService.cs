using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Net;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Http;
using System.Data;

namespace AppLensV3.Services
{
    public class IncidentInfo
    {
        public string IncidentId {get; set; }

        public string Title { get; set; }
    }

    public interface IIncidentAssistanceService
    {
        /// <summary>
        /// Flag for whether incident assistance service is enabled.
        /// </summary>
        /// <returns>A boolean.</returns>
        Task<bool> IsEnabled();

        /// <summary>
        /// Get incident validation details from ICM Automation.
        /// </summary>
        /// <param name="incidentId">IncidentId.</param>
        /// <returns>Json Object containing validation details.</returns>
        Task<HttpResponseMessage> GetIncidentInfo(string incidentId);

        /// <summary>
        /// Validate the information that user provides in AppLens Incident Assistance page.
        /// </summary>
        /// <param name="incidentId">IncidentId.</param>
        /// <param name="payload">Payload.</param>
        /// <param name="update">Update Flag.</param>
        /// <returns>Json Object containing validation result.</returns>
        Task<HttpResponseMessage> ValidateAndUpdateIncident(string incidentId, object payload, string update);

        Task<HttpResponseMessage> GetOnboardedTeams(string userId);

        Task<HttpResponseMessage> GetTeamTemplate(string teamId, string incidentType, string userId);

        Task<HttpResponseMessage> UpdateTeamTemplate(string teamId, string incidentType, object payload, string userId);

        Task<HttpResponseMessage> GetTeamTemplateAuthors(string teamId, string incidentType, string userId);

        Task<HttpResponseMessage> UpdateTeamTemplateAuthors(string teamId, string incidentType, object payload, string userId);

        Task<HttpResponseMessage> GetAvailableValidations(string teamId, string incidentType, string userId);

        Task<List<IncidentInfo>> GetTopIncidentsForTeam(string teamId, string incidentType, int num = 5);

        Task<HttpResponseMessage> TestTemplateWithIncident(object payload, string userId);
    }

    public class IncidentAssistanceService : IIncidentAssistanceService
    {
        private bool isEnabled;
        private string IncidentAssistEndpoint;
        private string ApiKey;
        private readonly IKustoQueryService _kustoQueryService;
        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        private void ValidateTeamIdentifiers(string teamId, string incidentType) {
            if (string.IsNullOrWhiteSpace(teamId))
            {
                throw new ArgumentException("teamId");
            }
            if (string.IsNullOrWhiteSpace(incidentType))
            {
                throw new ArgumentException("incidentType");
            }
        }

        private HttpRequestMessage AddFunctionAuthHeaders(HttpRequestMessage request)
        {
            request.Headers.Add("x-functions-key", ApiKey);
            return request;
        }

        public IncidentAssistanceService(IConfiguration configuration, IKustoQueryService kustoQueryService)
        {
            _kustoQueryService = kustoQueryService;
            if (!bool.TryParse(configuration["IncidentAssistance:IsEnabled"].ToString(), out isEnabled))
            {
                isEnabled = false;
            }
            if (isEnabled)
            {
                IncidentAssistEndpoint = configuration["IncidentAssistance:IncidentAssistEndpoint"].ToString();
                ApiKey = configuration["IncidentAssistance:ApiKey"].ToString();
            }
        }

        public async Task<bool> IsEnabled()
        {
            return isEnabled;
        }

        public async Task<HttpResponseMessage> GetIncidentInfo(string incidentId)
        {
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                throw new ArgumentException("incidentId");
            }
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{IncidentAssistEndpoint}/api/GetIncidentInfo/{incidentId}");
            request = AddFunctionAuthHeaders(request);
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> ValidateAndUpdateIncident(string incidentId, object payload, string update)
        {
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                throw new ArgumentException("incidentId");
            }

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, $"{IncidentAssistEndpoint}/api/ValidateAndUpdateICM?update={update}");
            request = AddFunctionAuthHeaders(request);
            request.Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> GetOnboardedTeams(string userId)
        {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{IncidentAssistEndpoint}/api/GetOnboardedTeams?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> GetTeamTemplate(string teamId, string incidentType, string userId)
        {
            ValidateTeamIdentifiers(teamId, incidentType);
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{IncidentAssistEndpoint}/api/GetTeamTemplate/{teamId}/{incidentType}?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> UpdateTeamTemplate(string teamId, string incidentType, object payload, string userId)
        {
            ValidateTeamIdentifiers(teamId, incidentType);
            var getTemplateResponse = await GetTeamTemplate(teamId, incidentType, userId);
            if (getTemplateResponse.StatusCode == HttpStatusCode.Unauthorized)
            {
                return getTemplateResponse;
            }
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, $"{IncidentAssistEndpoint}/api/UpdateTeamTemplate/{teamId}/{incidentType}?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            request.Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> GetTeamTemplateAuthors(string teamId, string incidentType, string userId)
        {
            ValidateTeamIdentifiers(teamId, incidentType);
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{IncidentAssistEndpoint}/api/GetTeamTemplateAuthors/{teamId}/{incidentType}?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> UpdateTeamTemplateAuthors(string teamId, string incidentType, object payload, string userId)
        {
            ValidateTeamIdentifiers(teamId, incidentType);
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, $"{IncidentAssistEndpoint}/api/UpdateTeamTemplateAuthors/{teamId}/{incidentType}?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            request.Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            return await _httpClient.SendAsync(request);
        }

        public async Task<HttpResponseMessage> GetAvailableValidations(string teamId, string incidentType, string userId)
        {
            ValidateTeamIdentifiers(teamId, incidentType);
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{IncidentAssistEndpoint}/api/GetAvailableValidations/{teamId}/{incidentType}?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            return await _httpClient.SendAsync(request);
        }

        public async Task<List<IncidentInfo>> GetTopIncidentsForTeam(string teamId, string incidentType, int num = 5)
        {
            var incidentList = new List<IncidentInfo>();
            string kustoQuery = $@"Incidents
                | where OwningTeamId == '{teamId}' and IncidentType == '{incidentType}'
                | distinct IncidentId, SourceCreateDate, Title
                | top {num} by SourceCreateDate desc";
            try
            {
                var results = await _kustoQueryService.ExecuteQueryAsync("icmcluster", "IcmDataWarehouse", kustoQuery, "ICMAutomation-FetchIcmIncidentsForTeam");
                if (results != null && results.Rows.Count > 0)
                {
                    foreach (DataRow row in results.Rows)
                    {
                        incidentList.Add(new IncidentInfo() { IncidentId = row["IncidentId"].ToString(), Title = row["Title"].ToString() });
                    }
                }
            }
            catch { };
            return incidentList;
        }

        public async Task<HttpResponseMessage> TestTemplateWithIncident(object payload, string userId) {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, $"{IncidentAssistEndpoint}/api/TestTemplateWithIncident?userId={userId}");
            request = AddFunctionAuthHeaders(request);
            request.Content = new StringContent(JsonConvert.SerializeObject(payload), Encoding.UTF8, "application/json");
            return await _httpClient.SendAsync(request);
        }
    }
}