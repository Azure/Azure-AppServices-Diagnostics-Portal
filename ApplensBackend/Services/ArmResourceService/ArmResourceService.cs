using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Configuration;
using Octokit;

namespace AppLensV3.Services
{
    public interface IArmResourceService
    {
        /// <summary>
        /// Returns Arm url for the resource.
        /// </summary>
        /// <param name="provider">Provider name.</param>
        /// <param name="serviceName">Service name.</param>
        /// <param name="resourceName">Resource name.</param>
        /// <returns>Arm Resource Url.</returns>
        public Task<string> GetArmResourceUrlAsync(string provider, string serviceName, string resourceName);
    }

    /// <summary>
    /// Arm resource class.
    /// </summary>
    public class ArmResourceService : IArmResourceService
    {
        private readonly IRedisService<ArmResourceRedisModel> redisService;
        private readonly IKustoQueryService kustoQueryService;
        private readonly IConfiguration config;

        /// <summary>
        /// Initializes a new instance of the <see cref="ArmResourceService"/> class.
        /// </summary>
        /// <param name="configuration">config object</param>
        /// <param name="redisConnFactory">redis connection factory</param>
        public ArmResourceService(IConfiguration configuration, IRedisService<ArmResourceRedisModel> redis, IKustoQueryService kustoQuerySvc)
        {
            config = configuration;
            redisService = redis;
            kustoQueryService = kustoQuerySvc;
        }

        /// <inheritdoc/>
        public async Task<string> GetArmResourceUrlAsync(string provider, string serviceName, string resourceName)
        {
            var cacheKey = string.Join("/", provider, serviceName, resourceName);
            var cacheValue = await redisService.GetKey(cacheKey);
            if (string.IsNullOrWhiteSpace(cacheValue))
            {
                var dictKey = $"{string.Join("/", provider, serviceName)}:{MultiCloudExtensions.GetCloudDomain(config)}".ToLower();
                ArmResourceServiceConfig.ArmKustoQueryPerService.TryGetValue(dictKey, out var kustoInfo);
                if (kustoInfo == null)
                {
                    throw new Exception($"No Arm kusto query found for provider : {provider} and service : {serviceName}. Most likely ARM url resolution is not enabled for this service.");
                }

                var dt = await kustoQueryService.ExecuteQueryAsync(
                    cluster: kustoInfo.Item1,
                    database: kustoInfo.Item2,
                    query: string.Format(kustoInfo.Item3, resourceName),
                    operationName: "Get Arm Resource for Applens");

                if (dt == null || dt.Rows == null || dt.Rows.Count == 0)
                {
                    throw new NotFoundException(
                        $"Unable to fetch arm resource for '{string.Join("/", provider, serviceName, resourceName)}'. " +
                        $"Kusto query returned 0 results." +
                        $"Cluster: {kustoInfo.Item1}, Database: {kustoInfo.Item2}, Query: {string.Format(kustoInfo.Item3, resourceName)}",
                        System.Net.HttpStatusCode.NotFound);
                }

                string? armId = dt.Rows[0]["armId"] == null ? string.Empty : dt.Rows[0]["armId"].ToString();

                if (string.IsNullOrWhiteSpace(armId))
                {
                    throw new Exception($"Unable to fetch arm resource for '{string.Join("/", provider, serviceName, resourceName)}'. Kusto query results doesnt contain column 'armId'.");
                }

                cacheValue = armId;
                await redisService.SetKey(cacheKey, cacheValue);
                
                // Push the armId to durian cache as well to skip ACIS validation in runtimehost
                await redisService.SetKey((armId.StartsWith("/") ? armId[1..] : armId).ToLower(), true.ToString());
            }

            return cacheValue;
        }
    }
}
