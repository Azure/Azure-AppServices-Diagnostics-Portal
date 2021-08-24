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

        [JsonProperty(PropertyName = "PartitionKey")]
        public string PartitionKey;

        public UserSetting(string id, List<RecentResource> resources)
        {
            Id = id;
            Resources = resources;
            PartitionKey = UserSettingConstant.PartitionKey;
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
