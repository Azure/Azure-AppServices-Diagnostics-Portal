using CommonLibrary.Models;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;
using System.Web;
using System.Net.Http.Headers;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Data.Common;

namespace CommonLibrary.Services
{
    public interface ISemanticSearchService
    {
        Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, string azureServiceName, int numDocuments=3, double minScore = 0.5);
        Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5);
        Task<List<bool>> AddDocuments(List<SemanticSearchDocument> documents, string indexName);
        Task<List<bool>> RemoveDocuments(List<string> documentIds, string indexName);
    }

    public class SemanticSearchServiceDisabled: ISemanticSearchService
    {
        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, string azureServiceName, int numDocuments = 3, double minScore = 0.5) { return null; }
        public async Task<List<SemanticSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5) { return null; }
        public async Task<List<bool>> AddDocuments(List<SemanticSearchDocument> documents, string indexName) { return null; }
        public async Task<List<bool>> RemoveDocuments(List<string> documentIds, string indexName) { return null; }
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
        private static string ToQueryString(Dictionary<string, string> parameters)
        {
            var query = HttpUtility.ParseQueryString(string.Empty);
            foreach (var kvp in parameters)
            {
                query[kvp.Key] = kvp.Value;
            }
            return query.ToString();
        }

        private async Task<HttpResponseMessage?> ExecuteRequest(HttpRequestMessage request)
        {
            string authorizationToken = null;
            try
            {
                if (SemanticTokenService.Instance != null)
                {
                    authorizationToken = await SemanticTokenService.Instance.GetAuthorizationTokenAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error occurred in getting authorization token from SemanticTokenService, {ex}");
            }
            if (!string.IsNullOrWhiteSpace(authorizationToken))
            {
                request.Headers.Add("Authorization", authorizationToken);
            }
            return await httpClient.SendAsync(request);
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
                var requestMessage = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                var response = await ExecuteRequest(requestMessage);
                if (response != null & response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var result = JsonConvert.DeserializeObject<List<SemanticSearchDocument>>(content);

                    return result;
                }
                else
                {
                    _logger.LogError($"SemanticSearchServiceFailedStatusCode - Operation: SearchDocuments, StatusCode: {response?.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"SemanticSearchServiceCallerError: {ex.GetType()}", ex);
            }
            return new List<SemanticSearchDocument>();
        }

        public async Task<List<bool>> AddDocuments(List<SemanticSearchDocument> documents, string indexName) {
            var result = new List<bool>();
            foreach (var document in documents)
            {
                if (string.IsNullOrWhiteSpace(document.CollectionName))
                {
                    document.CollectionName = indexName;
                }
            }
            string requestContent = JsonConvert.SerializeObject(documents);
            string requestUrl = $"{semanticServiceEndpoint}/DocumentIndexing/saveDocuments";
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            requestMessage.Content = new StringContent(requestContent, Encoding.UTF8, "application/json");
            var response = await ExecuteRequest(requestMessage);
            if (response != null & response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                result = JsonConvert.DeserializeObject<List<bool>>(content);
            }
            else
            {
                _logger.LogError($"SemanticSearchServiceFailedStatusCode - Operation: SaveDocuments, StatusCode: {response?.StatusCode}");
            }
            return result;
        }

        public async Task<List<bool>> RemoveDocuments(List<string> documentIds, string indexName)
        {
            var result = new List<bool>();
            var body = new Dictionary<string, object>();
            body["collectionName"] = indexName;
            body["documentIds"] = documentIds;
            string requestContent = JsonConvert.SerializeObject(body);
            string requestUrl = $"{semanticServiceEndpoint}/DocumentIndexing/deleteDocuments";
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            requestMessage.Content = new StringContent(requestContent, Encoding.UTF8, "application/json");
            var response = await ExecuteRequest(requestMessage);
            if (response != null & response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                result = JsonConvert.DeserializeObject<List<bool>>(content);
            }
            else
            {
                _logger.LogError($"SemanticSearchServiceFailedStatusCode - Operation: DeleteDocuments, StatusCode: {response?.StatusCode}");
            }
            return result;
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
