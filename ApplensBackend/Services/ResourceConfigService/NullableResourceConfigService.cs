using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;

namespace AppLensV3.Services
{
    public class NullableResourceConfigService : IResourceConfigService
    {
        public Task<ResourceConfig> GetResourceConfig(string resourceType)
        {
            return null;
        }
    }
}
