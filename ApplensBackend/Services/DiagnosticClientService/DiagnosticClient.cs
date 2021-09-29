using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services.DiagnosticClientService
{
    public class DiagnosticClient : IDiagnosticClientService
    {
        private IConfiguration _configuration;
        private HttpClient _client { get; set; }

        public string DiagnosticServiceEndpoint
        {
            get
            {
                return _configuration["DiagnosticRole:AppServiceEndpoint"];
            }
        }

        public DiagnosticClient(IConfiguration configuration)
        {
            _configuration = configuration;
            _client = InitializeClient();     
        }

        private HttpClient InitializeClient()
        {
            var handler = new HttpClientHandler();
            var client = new HttpClient(handler)
            {
                BaseAddress = new Uri(DiagnosticServiceEndpoint),
                Timeout = TimeSpan.FromSeconds(5 * 60),
                MaxResponseContentBufferSize = int.MaxValue
            };

            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add("User-Agent", "AppLens");

            return client;
        }

        public async Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalClient = true, bool internalView = true, HttpRequestHeaders additionalHeaders = null)
        {
            HttpResponseMessage response;

            // If running locally or using App Service for Runtimehost, we can send requests directly.
            path = path.TrimStart('/');
            if (new Regex("^v[0-9]+/").Matches(path).Any())
            {
                path = path.Substring(path.IndexOf('/'));
            }

            var requestMessage = new HttpRequestMessage(method.Trim().ToUpper() == "POST" ? HttpMethod.Post : HttpMethod.Get, path)
            {
                Content = new StringContent(body ?? string.Empty, Encoding.UTF8, "application/json")
            };

            requestMessage.Headers.Add(HeaderConstants.InternalClientHeader, internalClient.ToString());
            requestMessage.Headers.Add(HeaderConstants.InternalViewHeader, internalView.ToString());

            if (additionalHeaders != null)
            {
                AddAdditionalHeaders(additionalHeaders, ref requestMessage);
            }

            var authToken = await DiagnosticClientToken.Instance.GetAuthorizationTokenAsync();
            requestMessage.Headers.Add("Authorization", authToken);
            response = await _client.SendAsync(requestMessage);
            return response;
        }
        private void AddAdditionalHeaders(HttpRequestHeaders additionalHeaders, ref HttpRequestMessage request)
        {
            foreach (var header in additionalHeaders)
            {
                if (!request.Headers.Contains(header.Key))
                {
                    request.Headers.Add(header.Key, header.Value);
                }
            }
        }
    }
}
