using AppLensV3.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;

namespace AppLensV3.Services
{
    public interface ICosmosDBUserSettingHandler : ICosmosDBHandlerBase<UserSetting>
    {
        Task<UserSetting> UpdateUserSetting(UserSetting userSettings);

        Task<UserSetting> GetUserSetting(string id, bool needCreate = true);

        Task<UserSetting> PathUserSettingProperty(string id, string property, object value);

        Task<UserSetting> RemoveFavoriteDetector(string id,string detectorId);

        Task<UserSetting> AddFavoriteDetector(string id, string detectorId, FavoriteDetectorProp prop);

        Task<UserSetting> PatchUserPanelSetting(string id, string theme, string viewMode, string expandAnalysisCheckCard);

        Task<UserSetting> PatchLandingInfo(string id, List<RecentResource> resources, string defaultServiceType);
    }
}
