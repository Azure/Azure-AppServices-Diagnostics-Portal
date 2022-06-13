using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using Newtonsoft.Json;
using System.Net;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Extensions.Configuration;

namespace AppLensV3
{
    public class ObserverResponse
    {
        public HttpStatusCode StatusCode;

        public dynamic Content;
    }

    /// <summary>
    /// Client for Support Observer API communication
    /// </summary>
    public sealed class SupportObserverClientService : IObserverClientService
    {
        private static AuthenticationContext _authContext;
        private static ClientCredential _aadCredentials;
        private static string _supportObserverResourceUri;
        private static object lockObject = new object();
        private string _endpoint;
        private const string APP_SETTING_AAD_AUTHORITY = "Observer:authority";
        private const string APP_SETTING_OBSERVER_ENDPOINT = "Observer:endpoint";
        private const string APP_SETTING_OBSERVER_AAD_CLIENTID = "Observer:clientId";
        private const string APP_SETTING_OBSERVER_AAD_CLIENT_SECRET = "Observer:clientSecret";
        private const string APP_SETTING_OBSERVER_AAD_RESOURCEID = "Observer:resourceId";
        private const string DEFAULT_PUBLIC_AZURE_AAD_AUTHORITY = "https://login.microsoftonline.com/microsoft.onmicrosoft.com";

        private IConfiguration _configuration;

        public SupportObserverClientService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Support API Endpoint
        /// </summary>
        private string SupportObserverApiEndpoint
        {
            get
            {
                if (string.IsNullOrWhiteSpace(_endpoint))
                {
                    _endpoint = _configuration.GetValue<string>(APP_SETTING_OBSERVER_ENDPOINT, null);
                }

                return _endpoint;
            }
        }

        private AuthenticationContext AuthContext
        {
            get
            {
                if (_authContext == null)
                {
                    _authContext = new AuthenticationContext(_configuration.GetValue(APP_SETTING_AAD_AUTHORITY, DEFAULT_PUBLIC_AZURE_AAD_AUTHORITY), TokenCache.DefaultShared);
                }

                return _authContext;
            }
        }

        private ClientCredential AADCredentials
        {
            get
            {
                if (_aadCredentials == null)
                {
                    var clientId = _configuration[APP_SETTING_OBSERVER_AAD_CLIENTID];
                    var clientSecret = _configuration[APP_SETTING_OBSERVER_AAD_CLIENT_SECRET];

                    _aadCredentials = new ClientCredential(clientId, clientSecret);
                }
                return _aadCredentials;
            }
        }

        /// <summary>
        /// http client
        /// </summary>
        private static readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
            {
                var client = new HttpClient();
                client.DefaultRequestHeaders.Accept.Clear();
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                client.Timeout = TimeSpan.FromSeconds(30);

                return client;
            }
        );

        /// <summary>
        /// http client
        /// </summary>
        private static HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        public async Task<ObserverResponse> GetSite(string siteName)
        {
            return await GetSiteInternal(SupportObserverApiEndpoint + "sites/" + siteName + "/adminsites");
        }

        public async Task<ObserverResponse> GetSiteSku(string stamp,string siteName)
        {
            return await GetAppInternal($"{SupportObserverApiEndpoint}stamps/{stamp}/sites/{siteName}/sku", "GetSiteSku");
        }

        /// <summary>
        /// Get container app details for containerAppName
        /// </summary>
        /// <param name="containerAppName">Container App Name</param>
        public async Task<ObserverResponse> GetContainerApp(string containerAppName)
        {
            return await GetContainerAppInternal(SupportObserverApiEndpoint + "partner/containerapp/" + containerAppName);
        }

        /// <summary>
        /// Get static web app details by static web App default host name or app name
        /// </summary>
        /// <param name="defaultHostNameOrAppName">Host Name of Static Web App</param>
        public async Task<ObserverResponse> GetStaticWebApp(string defaultHostNameOrAppName)
        {
            return await GetStaticWebAppInternal(SupportObserverApiEndpoint + "partner/jamstack/" + defaultHostNameOrAppName);
        }

        /// <summary>
        /// Get site details for siteName
        /// </summary>
        /// <param name="stamp">Stamp</param>
        /// <param name="siteName">Site Name</param>
        /// <param name="details">True if additional properties are requested</param>
        public async Task<ObserverResponse> GetSite(string stamp, string siteName, bool details = false)
        {
            return await GetSiteInternal(SupportObserverApiEndpoint + "stamps/" + stamp + "/sites/" + siteName + (details ? "/details" : "/adminsites"));
        }

        private Task<ObserverResponse> GetSiteInternal(string endpoint)
        {
            return GetAppInternal(endpoint, "GetAdminSite");
        }

        private Task<ObserverResponse> GetContainerAppInternal(string endpoint)
        {
            return GetAppInternal(endpoint, "GetContainerApp");
        }

        private Task<ObserverResponse> GetStaticWebAppInternal(string endpoint)
        {
            return GetAppInternal(endpoint, "GetStaticWebApp");
        }

        private async Task<ObserverResponse> GetAppInternal(string endpoint, string apiName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(endpoint),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, apiName);
            return res;
        }



        /// <summary>
        /// Get resource group for site
        /// </summary>
        /// <param name="site">Site</param>
        /// <returns>Resource Group</returns>
        public async Task<ObserverResponse> GetResourceGroup(string site)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + site + "/resourcegroupname"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", site } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetResourceGroup(2.0)");
            return res;
        }

        /// <summary>
        /// Get Stamp for siteName
        /// </summary>
        /// <param name="siteName">Site Name</param>
        /// <returns>Stamp</returns>
        public async Task<ObserverResponse> GetStamp(string siteName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "sites/" + siteName + "/stamp"),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "site", siteName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetStamp");
            return res;
        }

        public async Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(SupportObserverApiEndpoint + "hostingEnvironments/" + hostingEnvironmentName),
                Method = HttpMethod.Get
            };

            var serializedParameters = JsonConvert.SerializeObject(new Dictionary<string, string>() { { "hostingEnvironment", hostingEnvironmentName } });
            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostingEnvironmentDetails(2.0)");
            return res;
        }

        public async Task<ObserverResponse> GetSitePostBody(string stamp, string site)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{SupportObserverApiEndpoint}stamps/{stamp}/sites/{site}/postbody"),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetSitePostBody");
            return res;
        }

        public async Task<ObserverResponse> GetHostingEnvironmentPostBody(string name)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri($"{SupportObserverApiEndpoint}hostingEnvironments/{name}/postbody"),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetHostingEnvironmentPostBody");
            return res;
        }

        public async Task<ObserverResponse> GetStampBody(string stampName)
        {
            return await GetStampInternal(SupportObserverApiEndpoint + "stamps/" + stampName);
        }

        private async Task<ObserverResponse> GetStampInternal(string endpoint)
        {
            var request = new HttpRequestMessage()
            {
                RequestUri = new Uri(endpoint),
                Method = HttpMethod.Get
            };

            request.Headers.Add("Authorization", await GetSupportObserverAccessToken());
            var response = await _httpClient.SendAsync(request);

            ObserverResponse res = await CreateObserverResponse(response, "GetStampBody");
            return res;
        }

        private async Task<ObserverResponse> CreateObserverResponse(HttpResponseMessage response, string apiName = "")
        {
            var observerResponse = new ObserverResponse();

            if (response == null)
            {
                observerResponse.StatusCode = HttpStatusCode.InternalServerError;
                observerResponse.Content = "Unable to fetch data from Observer API : " + apiName;
            }

            observerResponse.StatusCode = response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                var responseString = await response.Content.ReadAsStringAsync();
                observerResponse.Content = JsonConvert.DeserializeObject(responseString);
            }
            else if (response.StatusCode == HttpStatusCode.NotFound)
            {
                observerResponse.Content = "Resource Not Found. API : " + apiName;
            }
            else
            {
                observerResponse.Content = "Unable to fetch data from Observer API : " + apiName;
            }

            return observerResponse;
        }

        private async Task<string> GetSupportObserverAccessToken()
        {
            var authResult = await AuthContext.AcquireTokenAsync(_configuration[APP_SETTING_OBSERVER_AAD_RESOURCEID], AADCredentials);
            return "Bearer " + authResult.AccessToken;
        }
    }
}