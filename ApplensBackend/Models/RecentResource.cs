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
        public List<RecentResource> Resources;

        [JsonProperty(PropertyName = "theme")]
        public string Theme;

        [JsonProperty(PropertyName = "viewMode")]
        public string ViewMode;

        [JsonProperty(PropertyName = "PartitionKey")]
        public string PartitionKey;

       [JsonProperty(PropertyName = "expandAnalysisCheckCard")]
       public bool ExpandAnalysisCheckCard { get; set; }

        [JsonProperty(PropertyName = "defaultServiceType")]
        public string DefaultServiceType;

        public UserSetting(string id, List<RecentResource> resources, string theme="light", string viewMode="smarter", bool expandAnalysisCheckCard = false, string defaultServiceType = "")
        {
            Id = id;
            Resources = resources;
            PartitionKey = UserSettingConstant.PartitionKey;
            Theme = theme;
            ViewMode = viewMode;
            ExpandAnalysisCheckCard = expandAnalysisCheckCard;
            DefaultServiceType = defaultServiceType;
        }
    }


    public class RecentResource
    {
        public string ResourceUri { get; set; }
        public string Kind { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }
    }

    public class UserSettingConstant
    {
        public static readonly string PartitionKey = "RecentResources";
    }
}
