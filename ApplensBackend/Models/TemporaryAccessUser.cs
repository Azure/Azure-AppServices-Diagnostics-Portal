﻿using Newtonsoft.Json;
using System;

namespace AppLensV3.Models
{
    public class TemporaryAccessUser
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty(PropertyName = "accessStartDate")]
        public DateTime AccessStartDate { get; set; }

        [JsonProperty(PropertyName = "UserPrincipalName")]
        public string UserPrincipalName { get; set; }
    }
}
