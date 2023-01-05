using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;

namespace AppLensV3.Services
{
    public class NullableGraphClientService : IGraphClientService
    {
        Task<string> IGraphClientService.GetOrCreateUserImageAsync(string userId)
        {
            return Task.FromResult<string>(null);
        }

        Task<string> IGraphClientService.GetUserImageAsync(string userId)
        {
            return Task.FromResult<string>(null);
        }

        Task<AuthorInfo> IGraphClientService.GetUserInfoAsync(string userId)
        {
            return Task.FromResult<AuthorInfo>(null);
        }

        Task<IDictionary<string, string>> IGraphClientService.GetUsers(string[] users)
        {
            return Task.FromResult((IDictionary<string, string>)new Dictionary<string, string>());
        }

        Task<List<AuthorInfo>> IGraphClientService.GetSuggestionForAlias(string aliasFilter)
        {
            return Task.FromResult(new List<AuthorInfo>());
        }
    }
}
