using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{
    public interface IOpenAIRedisService
    {
        bool IsEnabled();
        Task<string> GetKey(string key);
        Task<bool> SetKey(string key, string value, TimeSpan? expiryTime = null);
        Task<bool> DeleteKey(string key);
    }

    public class OpenAIRedisServiceDisabled : IOpenAIRedisService
    {
        public bool IsEnabled() { return false; }
        public async Task<string> GetKey(string key) { return null; }
        public async Task<bool> SetKey(string key, string value, TimeSpan? expiryTime = null) { return false; }
        public async Task<bool> DeleteKey(string key) { return false; }
    }
    /// <summary>
    /// Resource Validation service
    /// </summary>
    public class OpenAIRedisService : IOpenAIRedisService
    {
        private readonly bool _redisEnabled;
        private readonly Task<RedisConnection> _redisConnectionFactory;
        private RedisConnection _redisConnection;
        private readonly TimeSpan DefaultExpiryTime;

        public OpenAIRedisService(IConfiguration configuration, Task<RedisConnection> redisConnectionFactory)
        {
            _redisEnabled = configuration.GetValue("OpenAIService:RedisEnabled", false);
            if (_redisEnabled)
            {
                _redisConnectionFactory = redisConnectionFactory;
                var expiryTimeInDays = configuration.GetValue("OpenAIService:DefaultCacheExpiryInDays", "7");
                int expiryTime = int.TryParse(expiryTimeInDays, out int val) ? val : 7;
                DefaultExpiryTime = TimeSpan.FromDays(expiryTime);
            }
        }

        public bool IsEnabled()
        {
            return _redisEnabled;
        }

        public async Task<string> GetKey(string key)
        {
            if (!_redisEnabled) { return null; }
            _redisConnection = await _redisConnectionFactory;
            return (await _redisConnection.BasicRetryAsync(async (db) => await db.StringGetAsync(key))).ToString();
        }

        public async Task<bool> SetKey(string key, string value, TimeSpan? expiryTime = null)
        {
            if (!_redisEnabled) { return false; }
            _redisConnection = await _redisConnectionFactory;
            if (!string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
            {
                var setResult = await _redisConnection.BasicRetryAsync(async (db) => await db.StringSetAsync(key, value, expiryTime != null ? expiryTime : DefaultExpiryTime));
                return setResult;
            }
            else
            {
                throw new Exception($"The following parameters are empty: {(string.IsNullOrWhiteSpace(key) ? "key" : "")} {(string.IsNullOrWhiteSpace(value) ? "value" : "")}");
            }
        }

        public async Task<bool> DeleteKey(string key)
        {
            if (!_redisEnabled) { return true; }
            _redisConnection = await _redisConnectionFactory;
            if (!string.IsNullOrWhiteSpace(key))
            {
                var deleteResult = await _redisConnection.BasicRetryAsync(async (db) => await db.KeyDeleteAsync(key));
                return deleteResult;
            }
            else
            {
                throw new Exception("The provided key is empty");
            }
        }
    }
}