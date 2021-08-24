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
        const string endPoint = "https://xiaoxu-comsmos.documents.azure.com:443/";
        const string key = "sWcLThKUDVjYs1flIN80SbnmLhRCc4Ijkw4zlmCRySjTEEGk9RaxwPQb4QMfhRAjG4mNFJFlrNWvxxPllghJzA==";
        const string dataBaseId = "userinfo";
        const string collectionId = "recent";
        private UserSetting _userSetting;
        public CosmosDBUserSettingHandler(IConfiguration configration) : base(configration)
        {
            Endpoint = endPoint;
            Key = key;
            DatabaseId = dataBaseId;
            CollectionId = collectionId;
            //Inital(configration);
            this.client = new DocumentClient(new Uri(Endpoint), Key);
            CreateDatabaseIfNotExistsAsync().Wait();
            CreateCollectionIfNotExistsAsync().Wait();
        }

        public async Task<UserSetting> UpdateRecentResources(UserSetting userSetting)
        {
            return await UpdateUserInfoInternal(userSetting);
        }

        private async Task<UserSetting> UpdateUserInfoInternal(UserSetting user)
        {
            Document doc;
            if (_userSetting == null)
            {
                doc = client.CreateDocumentQuery(UriFactory.CreateDocumentCollectionUri(DatabaseId, CollectionId), new FeedOptions { PartitionKey = new PartitionKey(UserSettingConstant.PartitionKey) })
                          .Where(r => r.Id == user.Id).AsEnumerable().FirstOrDefault();
            }

            if (_userSetting == null)
            {
                doc = await CreateItemAsync(user);
            }
            else
            {
                doc = await client.ReplaceDocumentAsync(UriFactory.CreateDocumentUri(DatabaseId, CollectionId, user.Id), user, new RequestOptions { PartitionKey = new PartitionKey(UserSettingConstant.PartitionKey) });
            }

            _userSetting = (dynamic)doc;
            return _userSetting;
        }

        public async Task<UserSetting> GetItemAsync(string id)
        {
            if (_userSetting == null)
            {
                _userSetting = await GetItemAsync(id, UserSettingConstant.PartitionKey);
            }
            return _userSetting;
        }
    }
}
