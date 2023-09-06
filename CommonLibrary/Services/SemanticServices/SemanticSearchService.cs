using CommonLibrary.Models;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;
using System.Web;
using System.Net.Http.Headers;
using Microsoft.Extensions.Logging;

namespace CommonLibrary.Services
{
    public interface ISemanticSearchService
    {
        Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, string azureServiceName, int numDocuments=3, double minScore = 0.5);
        Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5);
    }

    public class SemanticSearchServiceDisabled: ISemanticSearchService
    {
        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, string azureServiceName, int numDocuments = 3, double minScore = 0.5) { return null; }
        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5) { return null; }
    }

    public class SemanticSearchService : ISemanticSearchService
    {
        private static HttpClient httpClient;
        private readonly string semanticServiceEndpoint;
        private IConfiguration configuration;
        private readonly ILogger<SemanticSearchService> _logger;
        public SemanticSearchService(IConfiguration config, ILogger<SemanticSearchService> logger)
        {
            configuration = config;
            _logger = logger;
            semanticServiceEndpoint = config["SemanticService:Endpoint"];
            InitializeHttpClient();
        }
        public static string ToQueryString(Dictionary<string, string> parameters)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            foreach (var kvp in parameters)
            {
                query[kvp.Key] = kvp.Value;
            }
            return query.ToString();
        }


        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, string azureServiceName, int numDocuments = 3, double minScore = 0.5)
        {
            if (!string.IsNullOrWhiteSpace(azureServiceName))
            {
                indexName = $"{indexName}--{azureServiceName}";
            }
            return await SearchDocuments(query, indexName, numDocuments, minScore);
        }

        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5)
        {
            try
            {
                var jsonQueryParameters = new Dictionary<string, string>()
                {
                    {"text", query },
                    {"collectionName", indexName },
                    {"maxDocs", numDocuments.ToString() },
                    {"minScore", minScore.ToString() }
                };
                string queryString = ToQueryString(jsonQueryParameters);
                string requestUrl = $"{semanticServiceEndpoint}/DocumentIndexing/searchDocuments?{queryString}";
                string authorizationToken = await SemanticTokenService.Instance.GetAuthorizationTokenAsync();
                var requestMessage = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                requestMessage.Headers.Add("Authorization", authorizationToken);

                var response = await httpClient.SendAsync(requestMessage);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<List<SemanticSearchDocument>>(content);

                    return result;
                }
                else
                {
                    _logger.LogError($"SemanticSearchServiceFailedStatusCode: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"SemanticSearchServiceCallerError: {ex.GetType()}", ex);
            }
            return new List<SemanticSearchDocument>();
        }

        private void InitializeHttpClient()
        {
            httpClient = new HttpClient();
            httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
            httpClient.DefaultRequestHeaders.Accept.Clear();
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }
    }
}
