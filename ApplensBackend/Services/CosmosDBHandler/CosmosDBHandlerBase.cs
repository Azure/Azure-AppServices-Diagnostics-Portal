using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Azure.Documents;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Documents.Linq;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{

    public class CosmosDBHandlerBase<T> : ICosmosDBHandlerBase<T> where T : class
    {
        protected string Endpoint;
        protected string Key;
        protected string DatabaseId;
        protected string CollectionId;
        protected string PartitionKey = "/PartitionKey";
        protected DocumentClient client;

        public CosmosDBHandlerBase(IConfiguration configuration)
        {
            Endpoint = configuration["ApplensTemporaryAccess:Endpoint"];
            Key = configuration["ApplensTemporaryAccess:Key"];
            DatabaseId = configuration["ApplensTemporaryAccess:DatabaseId"];
        }

        protected async Task Inital(IConfiguration configuration)
        {
            if (configuration["ServerMode"].Equals("internal", StringComparison.OrdinalIgnoreCase)
                && (string.IsNullOrWhiteSpace(Endpoint) || string.IsNullOrWhiteSpace(Key)))
            {
                // For internal server mode, if the cosmos db settings are not present, then skip the initialization part.
                return;
            }
            this.client = new DocumentClient(new Uri(Endpoint), Key);
            await CreateDatabaseIfNotExistsAsync();
            await CreateCollectionIfNotExistsAsync();
        }

        public async Task<T> GetItemAsync(string id, string partitionKey)
        {
            try
            {
                Document document = await client.ReadDocumentAsync(
                    UriFactory.CreateDocumentUri(DatabaseId, CollectionId, id),
                    new RequestOptions { PartitionKey = new PartitionKey(partitionKey) });
                return (T)(dynamic)document;
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    if (e.Message.Contains("Resource Not Found"))
                    {
                        await CreateDatabaseIfNotExistsAsync();
                        await CreateCollectionIfNotExistsAsync();
                        return await GetItemAsync(id, partitionKey);
                    }
                    return null;
                }
                else
                {
                    throw;
                }
            }
        }

        public async Task<List<T>> GetItemsAsync(string partitionKey, Expression<Func<T, bool>> predicate = null)
        {
            IQueryable<T> orderedQuery = client.CreateDocumentQuery<T>(
                UriFactory.CreateDocumentCollectionUri(DatabaseId, CollectionId),
                new FeedOptions { PartitionKey = new PartitionKey(partitionKey) });

            if (predicate != null)
            {
                orderedQuery = orderedQuery.Where(predicate);
            }

            IDocumentQuery<T> query = orderedQuery.AsDocumentQuery();

            List<T> results = new List<T>();
            while (query.HasMoreResults)
            {
                results.AddRange(await query.ExecuteNextAsync<T>());
            }

            return results;
        }

        public async Task<Document> CreateItemAsync(T item)
        {
            return await client.CreateDocumentAsync(UriFactory.CreateDocumentCollectionUri(DatabaseId, CollectionId), item);
        }

        protected async Task CreateDatabaseIfNotExistsAsync()
        {
            try
            {
                await client.ReadDatabaseAsync(UriFactory.CreateDatabaseUri(DatabaseId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    await client.CreateDatabaseAsync(new Database { Id = DatabaseId });
                }
                else
                {
                    throw;
                }
            }
        }

        protected async Task CreateCollectionIfNotExistsAsync()
        {
            try
            {
                await client.ReadDocumentCollectionAsync(UriFactory.CreateDocumentCollectionUri(DatabaseId, CollectionId));
            }
            catch (DocumentClientException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    DocumentCollection myCollection = new DocumentCollection();
                    myCollection.Id = CollectionId;
                    myCollection.PartitionKey.Paths.Add(PartitionKey);
                    await client.CreateDocumentCollectionAsync(
                        UriFactory.CreateDatabaseUri(DatabaseId),
                        myCollection,
                        new RequestOptions { OfferThroughput = 400 }
                        );
                }
                else
                {
                    throw;
                }
            }
        }
    }
}
