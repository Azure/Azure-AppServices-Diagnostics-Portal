using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface IBingSearchService : IDisposable
    {
        Task<HttpResponseMessage> RunBingSearch(string query, int resultCount);
    }

    public class BingSearchServiceDisabled: IBingSearchService
    {
        public async Task<HttpResponseMessage> RunBingSearch(string query, int resultCount) { return new HttpResponseMessage() { StatusCode = HttpStatusCode.NotFound, Content = new StringContent("Bing search is disabled") }; }
        public void Dispose() { return; }
    }

    public class BingSearchService : IBingSearchService
    {
        private string BingSearchUrl = "https://api.cognitive.microsoft.com/bing/v7.0/search";
        private string BingApiKey;
        private ILogger<BingSearchService> _logger;
        private static HttpClient _httpClient;
        IConfiguration _configuration;
        
        public BingSearchService(IConfiguration Configuration, ILogger<BingSearchService> logger)
        {
            _logger = logger;
            _configuration = Configuration;
            BingApiKey = _configuration["ContentSearch:Ocp-Apim-Subscription-Key"];
            if (BingApiKey != null)
            {
                BingApiKey = BingApiKey.ToString();
            }
            if (string.IsNullOrWhiteSpace(BingApiKey))
            {
                _logger.LogError("Invalid configuration for parameter - ContentSearch:Ocp-Apim-Subscription-Key");
            }
            else
            {
                InitializeHttpClient();
            }
        }


        public async Task<HttpResponseMessage> RunBingSearch(string query, int resultCount)
        {
            if (string.IsNullOrWhiteSpace(BingApiKey))
            {
                return new HttpResponseMessage()
                {
                    StatusCode = HttpStatusCode.NotFound,
                    Content = new StringContent("Bing Search feature is not enabled")
                };
            }
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, $"{BingSearchUrl}?q='{query}'&count={resultCount}");
            return await _httpClient.SendAsync(request);
        }

        private void InitializeHttpClient()
        {
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", BingApiKey);
            _httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
        }

        public void Dispose()
        {
            if (_httpClient != null)
            {
                _httpClient.Dispose();
            }
        }
    }
}
