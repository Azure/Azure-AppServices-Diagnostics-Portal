using Newtonsoft.Json;
using System;
using System.Collections.Generic;

namespace AppLensV3.Models
{
    public class UserSetting
    {
        /// <summary>
        /// User alias
        /// </summary>
        [JsonProperty(PropertyName = "id")]
        public string Id;

        [JsonProperty(PropertyName = "resources")]
        public List<RecentResource> Resources { get; set; }

        [JsonProperty(PropertyName = "theme")]
        public string Theme { get; set; }

        [JsonProperty(PropertyName = "viewMode")]
        public string ViewMode { get; set; }

        [JsonProperty]
        private readonly string PartitionKey;

        [JsonProperty(PropertyName = "expandAnalysisCheckCard")]
        public bool ExpandAnalysisCheckCard { get; set; }

        [JsonProperty(PropertyName = "defaultServiceType")]
        public string DefaultServiceType { get; set; }

        /// <summary>
        /// Key is detectorId, value is detector property
        /// </summary>
        [JsonProperty(PropertyName = "favoriteDetectors")]
        public Dictionary<string, FavoriteDetectorProp> FavoriteDetectors { get; set; }

        public UserSetting(string id)
        {
            Id = id;
            Resources = new List<RecentResource>();
            PartitionKey = UserSettingConstant.PartitionKey;
            Theme = "light";
            ViewMode = "smarter";
            ExpandAnalysisCheckCard = false;
            DefaultServiceType = string.Empty;
            FavoriteDetectors = new Dictionary<string, FavoriteDetectorProp>();
        }
    }


    public class RecentResource
    {
        public string ResourceUri { get; set; }
        public string Kind { get; set; }
        public Dictionary<string,string> QueryParams { get; set; }
    }

    public class FavoriteDetectorProp
    {
        public string Type { get; set; }
    }

    public class UserSettingConstant
    {
        public static readonly string PartitionKey = "RecentResources";
    }
}
