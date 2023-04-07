using AppLensV3.Authorization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CompletionModel
    {
        public dynamic Payload { get; set; }
    }

    public interface IOpenAIService : IDisposable
    {
        Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest);
        bool IsEnabled();
    }

    public class OpenAIServiceDisabled : IOpenAIService
    {
        public bool IsEnabled() { return false; }
        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest) { return null; }
        public void Dispose() {}
    }

    public class OpenAIService : IOpenAIService
    {
        private string OpenAIAPIUrl;
        private string OpenAIAPIKey;
        private static HttpClient _httpClient;
        IConfiguration _configuration;
        bool IsOpenAIAPIEnabled = false;
        private IOpenAIRedisService _redisCache;
        private readonly ILogger<OpenAIService> _logger;

        public OpenAIService(IConfiguration Configuration, IOpenAIRedisService redisService, ILogger<OpenAIService> logger)
        {
            _configuration = Configuration;
            IsOpenAIAPIEnabled = Convert.ToBoolean(_configuration["OpenAIService:Enabled"]);
            if (IsOpenAIAPIEnabled)
            {
                _logger = logger;
                _redisCache = redisService;
                OpenAIAPIUrl = _configuration["OpenAIService:APIUrl"];
                OpenAIAPIKey = _configuration["OpenAIService:APIKey"];
                if (string.IsNullOrWhiteSpace(OpenAIAPIUrl))
                {
                    _logger.LogError("Invalid configuration for parameter - OpenAIService:APIUrl");
                    throw new Exception("Invalid configuration for parameter - OpenAIService:APIUrl");
                }
                if (string.IsNullOrWhiteSpace(OpenAIAPIKey))
                {
                    _logger.LogError("Invalid configuration for parameter - OpenAIService:APIKey");
                    throw new Exception("Invalid configuration for parameter - OpenAIService:APIKey");
                }
                else
                {
                    InitializeHttpClient();
                }
            }
        }

        private async Task<string> GetFromRedisCache(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return null;
            }
            return await _redisCache.GetKey(key);
        }

        private async Task<bool> SaveToRedisCache(string key, string value)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            {
                return false;
            }
            return await _redisCache.SetKey(key, value);
        }


        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest)
        {
            var cacheKey = JsonConvert.SerializeObject(requestBody);
            if (cacheEnabledOnRequest)
            {
                var getFromCache = await GetFromRedisCache(cacheKey);
                if (!string.IsNullOrEmpty(getFromCache))
                {
                    return new HttpResponseMessage()
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent(getFromCache)
                    };
                }
            }
            try
            {
                var endpoint = $"{OpenAIAPIUrl}";
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
                requestMessage.Content = new StringContent(JsonConvert.SerializeObject(requestBody.Payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.SendAsync(requestMessage);
                if (cacheEnabledOnRequest)
                {
                    try
                    {
                        if (response.IsSuccessStatusCode)
                        {
                            var content = await response.Content.ReadAsStringAsync();
                            if (!string.IsNullOrWhiteSpace(content))
                            {
                                var saveStatus = await SaveToRedisCache(cacheKey, content);
                                _logger.LogInformation($"Status of OpenAISaveToRedisCache: {saveStatus}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // No big deal if save to cache fails, log and succeed the request
                        _logger.LogWarning($"Failed to save OpenAI response to Redis Cache: {ex.ToString()}");
                    }
                }
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError($"OpenAICallError: {ex.ToString()}");
                throw ex;
            }
        }

        public bool IsEnabled()
        {
            return IsOpenAIAPIEnabled;
        }

        private void InitializeHttpClient()
        {
            _httpClient = new HttpClient();
            _httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
            _httpClient.DefaultRequestHeaders.Add("api-key", $"{OpenAIAPIKey}");
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
