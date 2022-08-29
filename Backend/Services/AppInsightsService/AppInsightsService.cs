using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Services
{
    public class AppInsightsService : IAppInsightsService
    {
        private const string AppInsightsEndpointPublicAzure = "api.applicationinsights.io";
        private const string AppInsightsEndpointAzureGov = "api.applicationinsights.us";
        private const string AppInsightsEndpointAzureChina = "api.applicationinsights.azure.cn";

        private readonly IEncryptionService _encryptionService;

        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.Timeout = TimeSpan.FromSeconds(30);
            return client;
        }
        );

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        public AppInsightsService(IEncryptionService encryptionService)
        {
            _encryptionService = encryptionService;
        }


        public async Task<AppInsightsValidationResponse> Validate(string appInsightsAppId, string encryptedKey, string siteHostName)
        {
            var validationResponse = new AppInsightsValidationResponse();
            var query = WebUtility.UrlEncode("requests|take 1");
            string apiKey = string.Empty;

            HttpRequestMessage request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri($"https://{GetAppInsightsDefaultEndpoint(siteHostName)}/v1/apps/{appInsightsAppId}/query?timespan=1H&query={query}")
            };

            var decryptionResponse = _encryptionService.DecryptString(encryptedKey);
            if (!string.IsNullOrWhiteSpace(decryptionResponse.ApiKey))
            {
                apiKey = decryptionResponse.ApiKey;
                if (decryptionResponse.UsingExpiredKeyOrCertificate)
                {
                    validationResponse.UpdatedEncryptionBlob = _encryptionService.EncryptString(decryptionResponse.ApiKey);
                }
            }

            request.Headers.Add("x-api-key", apiKey ?? string.Empty);
            var response = await this._httpClient.SendAsync(request);
            if (response.StatusCode == HttpStatusCode.Forbidden)
            {
                throw new UnauthorizedAccessException();
            }

            response.EnsureSuccessStatusCode();
            validationResponse.IsValid = true;
            return validationResponse;
        }

        /// <summary>
        /// Gets the name of the correct AppInsights default endpoint based on the hostname where the UI project is hosted
        /// </summary>
        /// <param name="siteHostName"></param>
        /// <returns></returns>
        private string GetAppInsightsDefaultEndpoint(string siteHostName)
        {
            if (siteHostName.Contains(".azurewebsites.us", StringComparison.OrdinalIgnoreCase))
            {
                return AppInsightsEndpointAzureGov;
            }
            else if (siteHostName.Contains(".chinacloudsites.cn", StringComparison.OrdinalIgnoreCase))
            {
                return AppInsightsEndpointAzureChina;
            }

            return AppInsightsEndpointPublicAzure;
        }
    }
}
