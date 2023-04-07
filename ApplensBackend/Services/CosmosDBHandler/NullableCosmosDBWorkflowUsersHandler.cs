using AppLensV3.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class NullableCosmosDBWorkflowUsersHandler : ICosmosDBWorkflowUsersHandler
    {
        private UserAlias nullableUserAlias;
        public Task AddUser(UserAlias userAlias)
        {
            return Task.FromResult(nullableUserAlias);
        }

        public Task<UserAlias> CreateItemAsync(UserAlias item)
        {
            return Task.FromResult(item);
        }

        public Task<UserAlias> GetItemAsync(string id, string partitionKey)
        {
            return Task.FromResult(nullableUserAlias);
        }

        public Task<List<UserAlias>> GetItemsAsync(string partitionKey)
        {
            return Task.FromResult(new List<UserAlias>() { nullableUserAlias });
        }

        public List<UserAlias> GetUsers()
        {
            return new List<UserAlias>() { nullableUserAlias };
        }

        public Task<List<UserAlias>> GetUsersAsync()
        {
            return Task.FromResult(new List<UserAlias>() { nullableUserAlias });
        }

        public Task<UserAlias> UpdateItemAsync(UserAlias item, string partitionKey)
        {
            return Task.FromResult(nullableUserAlias);
        }
    }
}
