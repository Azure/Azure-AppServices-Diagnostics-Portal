using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{
    public class ResourceConfigService : IResourceConfigService
    {
        private readonly int refreshIntervalInSeconds;
        private readonly string serverMode;
        private List<ResourceConfig> resourceConfigList;
        private ICosmosDBHandlerBase<ResourceConfig> resourceConfigDBHandler;
        private Task<List<ResourceConfig>> fetchConfigFromDBTask;
        private bool configFetchedAtleastOnce;

        public ResourceConfigService(ICosmosDBHandlerBase<ResourceConfig> cosmosDbHandler, IConfiguration configuration)
        {
            resourceConfigDBHandler = cosmosDbHandler;
            refreshIntervalInSeconds = configuration.GetValue("ResourceConfig:RefreshIntervalInSeconds", 1800);
            resourceConfigList = new List<ResourceConfig>();
            serverMode = configuration.GetValue("ServerMode", string.Empty);

            if (!serverMode.Equals("internal", StringComparison.OrdinalIgnoreCase))
            {
                FetchResourceConfigFromCosmosDB();
            }
        }

        public async Task<ResourceConfig> GetResourceConfig(string resourceType)
        {
            if (serverMode.Equals("internal", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            List<ResourceConfig> configList = new List<ResourceConfig>();

            if (!configFetchedAtleastOnce)
            {
                configList = await fetchConfigFromDBTask;
            }
            else
            {
                configList = resourceConfigList;
            }

            return configList.FirstOrDefault(p => p.ResourceType.Equals(resourceType, StringComparison.OrdinalIgnoreCase));
        }

        private async Task FetchResourceConfigFromCosmosDB()
        {
            while (true)
            {
                try
                {
                    fetchConfigFromDBTask = resourceConfigDBHandler.GetItemsAsync("ResourceConfig");
                    resourceConfigList = await fetchConfigFromDBTask;
                    configFetchedAtleastOnce = true;
                }
                catch (Exception)
                {
                    // todo: log the exception
                }

                await Task.Delay(refreshIntervalInSeconds * 1000);
            }
        }
    }
}
