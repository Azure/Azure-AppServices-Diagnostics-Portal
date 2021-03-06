﻿using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class AppInsightsService : IAppInsightsService
    {
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


        public async Task<bool> Validate(string appInsightsAppId, string encryptedKey)
        {

            var query = WebUtility.UrlEncode("requests|take 1");
            HttpRequestMessage request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri($"https://api.applicationinsights.io/v1/apps/{appInsightsAppId}/query?timespan=1H&query={query}")
            };

            var apiKey = _encryptionService.DecryptString(encryptedKey);
            request.Headers.Add("x-api-key", apiKey ?? string.Empty);

            var response = await this._httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();

            return true;

        }
    }
}
