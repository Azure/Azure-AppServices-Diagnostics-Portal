using System.Threading.Tasks;
using System;

namespace AppLensV3.Services.RedisCache
{
    public abstract class RedisServiceBase<T> : IRedisService<T> where T : class
    {
        public bool _redisEnabled;
        public readonly Task<RedisConnection> _redisConnectionFactory;
        public RedisConnection _redisConnection;
        public TimeSpan DefaultExpiryTime;

        public RedisServiceBase(bool redisEnabled, Task<RedisConnection> redisConnectionFactory, int expiryTimeInHours = 72)
        {
            _redisEnabled = redisEnabled;
            if (_redisEnabled)
            {
                _redisConnectionFactory = redisConnectionFactory;
                DefaultExpiryTime = TimeSpan.FromHours(expiryTimeInHours);
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
                throw new Exception($"The following parameters are empty: {(string.IsNullOrWhiteSpace(key) ? "key" : string.Empty)} {(string.IsNullOrWhiteSpace(value) ? "value" : string.Empty)}");
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
