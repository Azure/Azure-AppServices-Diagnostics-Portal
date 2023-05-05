using AppLensV3.Services.RedisCache;
using Microsoft.Extensions.Configuration;
using System.Configuration;
using System;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class ArmResourceRedisModel
    {
        // intentionally left blank.
        // This is just used to identify the right Redis cache service for dependency injection.
    }

    public class ArmResourceRedisCache : RedisServiceBase<ArmResourceRedisModel>, IRedisService<ArmResourceRedisModel>
    {
        public ArmResourceRedisCache(IConfiguration config, Task<RedisConnection> redisConnectionFactory)
            : base(true, redisConnectionFactory, 7)
        {
            if (config == null)
            {
                throw new ArgumentNullException(nameof(config));
            }

            bool.TryParse(config["ArmResourceService:RedisEnabled"], out _redisEnabled);

            if (_redisEnabled)
            {
                var expiryTimeInDays = string.IsNullOrWhiteSpace(config["ArmResourceService:DefaultCacheExpiryInDays"]) ? config["ArmResourceService:DefaultCacheExpiryInDays"] : "7";
                int expiryTime = int.TryParse(expiryTimeInDays, out int val) ? val : 7;
                DefaultExpiryTime = TimeSpan.FromDays(expiryTime);
            }
        }
    }
}
