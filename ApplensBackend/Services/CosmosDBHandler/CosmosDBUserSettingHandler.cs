using AppLensV3.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CosmosDBUserSettingHandler : CosmosDBHandlerBase<UserSetting>, ICosmosDBUserSettingHandler
    {
        const string collectionId = "UserInfo";
        private string defaultUserSettingId = "";
        public CosmosDBUserSettingHandler(IConfiguration configration) : base(configration)
        {
            CollectionId = collectionId;
            Inital(configration).Wait();
            defaultUserSettingId = configration["UserSetting:DefaultUserSettingId"];
        }

        public Task<UserSetting> UpdateUserSetting(UserSetting userSetting)
        {
            return UpdateItemAsync(userSetting, UserSettingConstant.PartitionKey);
        }

        public async Task<UserSetting> PatchLandingInfo(string id, List<RecentResource> resources, string defaultServiceType)
        {
            var patchOperations = new[]
              {
                PatchOperation.Add("/resources",resources),
                PatchOperation.Add("/defaultServiceType",defaultServiceType)
            };
            return await Container.PatchItemAsync<UserSetting>(id, new PartitionKey(UserSettingConstant.PartitionKey), patchOperations);
        }

        public async Task<UserSetting> RemoveFavoriteDetector(string id, string detectorId)
        {
            var patchOperations = new[]
             {
                PatchOperation.Remove($"/favoriteDetectors/{detectorId}")
             };
            return await Container.PatchItemAsync<UserSetting>(id, new PartitionKey(UserSettingConstant.PartitionKey), patchOperations);
        }

        public async Task<UserSetting> AddFavoriteDetector(string id, string detectorId, FavoriteDetectorProp detectorProp)
        {
            try
            {
                var patchOperations = new[]
                {
                PatchOperation.Add($"/favoriteDetectors/{detectorId}", detectorProp)
                };

                return await Container.PatchItemAsync<UserSetting>(id, new PartitionKey(UserSettingConstant.PartitionKey), patchOperations);
            }
            catch (CosmosException e)
            {
                if (e.Message.Contains("Operation can only create a child object of an existing node"))
                {
                    var patchOperations = new[]
                    {
                        PatchOperation.Add("/favoriteDetectors",new Dictionary<string,FavoriteDetectorProp>()),
                        PatchOperation.Add($"/favoriteDetectors/{detectorId}", detectorProp)
                    };

                    return await Container.PatchItemAsync<UserSetting>(id, new PartitionKey(UserSettingConstant.PartitionKey), patchOperations);
                }
                else
                {
                    throw;
                }
            }
        }

        public Task<UserSetting> PathUserSettingProperty(string id, string property, object value)
        {
            return PathItemAsync(id, UserSettingConstant.PartitionKey, property, value);
        }

        public async Task<UserSetting> PatchUserPanelSetting(string id, string theme, string viewMode, string expandAnalysisCheckCard)
        {
            var patchOperations = new[]
            {
                PatchOperation.Add("/theme",theme),
                PatchOperation.Add("/viewMode",viewMode),
                PatchOperation.Add("/expandAnalysisCheckCard",expandAnalysisCheckCard)
            };
            return await Container.PatchItemAsync<UserSetting>(id, new PartitionKey(UserSettingConstant.PartitionKey), patchOperations);
        }



        public async Task<UserSetting> GetUserSetting(string id, bool needCreate = true)
        {
            UserSetting userSetting = null;
            userSetting = await GetItemAsync(id, UserSettingConstant.PartitionKey);
            if (userSetting == null && needCreate == true)
            {
                //Get default user settings
                var defaultUserSetting = await GetUserSetting(defaultUserSettingId, false);
                UserSetting newUserSetting;
                if(defaultUserSetting != null)
                {
                    newUserSetting = new UserSetting(id, defaultUserSetting);
                }else
                {
                    newUserSetting = new UserSetting(id);
                }
                userSetting = await CreateItemAsync(newUserSetting);
            }
            return userSetting;
        }

    }
}
