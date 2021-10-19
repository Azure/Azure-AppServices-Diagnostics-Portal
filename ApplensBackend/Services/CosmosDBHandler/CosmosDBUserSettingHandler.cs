using AppLensV3.Models;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CosmosDBUserSettingHandler : CosmosDBHandlerBase<UserSetting>, ICosmosDBUserSettingHandler
    {
        const string collectionId = "UserInfo";
        public CosmosDBUserSettingHandler(IConfiguration configration) : base(configration)
        {
            CollectionId = collectionId;
            Inital(configration).Wait();
        }

        public async Task<UserSetting> UpdateRecentResources(UserSetting userSetting)
        {
            return await UpdateUserInfoInternal(userSetting);
        }

        private async Task<UserSetting> UpdateUserInfoInternal(UserSetting user)
        {
            if (string.IsNullOrEmpty(DatabaseId))
            {
                return null;
            }

            UserSetting userSetting = await GetItemAsync(user.Id);
            Document doc;
            if (userSetting == null)
            {
               doc = await CreateItemAsync(user);
            }
            else
            {
                doc = await client.ReplaceDocumentAsync(UriFactory.CreateDocumentUri(DatabaseId, CollectionId, user.Id), user, new RequestOptions { PartitionKey = new PartitionKey(UserSettingConstant.PartitionKey) });
            }

            return (dynamic)doc;
        }

        public async Task<UserSetting> GetItemAsync(string id)
        {
            return await GetItemAsync(id, UserSettingConstant.PartitionKey);
        }
    }
}
