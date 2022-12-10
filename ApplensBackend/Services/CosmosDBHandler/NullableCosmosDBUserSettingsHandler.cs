using System.Collections.Generic;
using System.Threading.Tasks;
using AppLensV3.Models;

namespace AppLensV3.Services
{
    public class NullableCosmosDBUserSettingsHandler : ICosmosDBUserSettingHandler
    {
        private UserSetting nullableUserSetting;

        public NullableCosmosDBUserSettingsHandler()
        {
            nullableUserSetting = new UserSetting("__default");
        }

        public Task<UserSetting> AddFavoriteDetector(string id, string detectorId, FavoriteDetectorProp prop)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> CreateItemAsync(UserSetting item)
        {
            return Task.FromResult(item);
        }

        public Task<UserSetting> GetItemAsync(string id, string partitionKey)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<List<UserSetting>> GetItemsAsync(string partitionKey)
        {
            return Task.FromResult(new List<UserSetting>() { nullableUserSetting });
        }

        public Task<UserSetting> GetUserSetting(string id, bool needCreate = true)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> PatchLandingInfo(string id, List<RecentResource> resources, string defaultServiceType)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> PatchUserPanelSetting(string id, string theme, string viewMode, string expandAnalysisCheckCard)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> PathUserSettingProperty(string id, string property, object value)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> RemoveFavoriteDetector(string id, string detectorId)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> UpdateItemAsync(UserSetting item, string partitionKey)
        {
            return Task.FromResult(nullableUserSetting);
        }

        public Task<UserSetting> UpdateUserSetting(UserSetting userSettings)
        {
            return Task.FromResult(nullableUserSetting);
        }
    }
}
