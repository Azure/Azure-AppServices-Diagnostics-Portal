using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Configuration;
using AppLensV3.Helpers;
using Octokit;
using Newtonsoft.Json;

namespace AppLensV3.Services
{
    public interface IArmResourceService
    {
        /// <summary>
        /// This service is enabled or not.
        /// </summary>
        /// <returns>true/false</returns>
        bool IsEnabled();

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
        private readonly bool enabled;
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
            enabled = configuration.GetValue("ArmResourceService:Enabled", false);
            redisService = redis;
            kustoQueryService = kustoQuerySvc;
        }

        /// <inheritdoc/>
        public bool IsEnabled()
        {
            return enabled;
        }

        /// <inheritdoc/>
        public async Task<string> GetArmResourceUrlAsync(string provider, string serviceName, string resourceName)
        {
            if (!enabled)
            {
                return FakeResource(provider, serviceName, resourceName);
            }

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
            }

            return cacheValue;
        }

        private string FakeResource(string provider, string serviceName, string resourceName) =>
            string.Format(ResourceConstants.ArmUrlTemplate, "00000000-0000-0000-0000-000000000000", "Fake-RG", provider, serviceName, resourceName);
    }
}
