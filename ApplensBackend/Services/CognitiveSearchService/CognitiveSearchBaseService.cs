﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Azure;
using Azure.Search.Documents;
using Azure.Search.Documents.Indexes;
using Azure.Search.Documents.Indexes.Models;
using AppLensV3.Models;

namespace AppLensV3.Services.CognitiveSearchService
{
    public interface ICognitiveSearchBaseService
    {
        bool IsEnabled();
        Task<List<SearchIndex>> ListIndices();
        Task<bool> CreateIndex(string indexName);
        Task<bool> DeleteIndex(string indexName);
        Task<SearchClient> GetIndexClientForAdmin(string indexName);
        Task<SearchClient> GetSearchClientForQueries(string indexName);
    }

    public class CognitiveSearchBaseService: ICognitiveSearchBaseService
    {
        private readonly CognitiveSearchConfiguration _configuration;
        private readonly bool isEnabled;
        private readonly ConcurrentDictionary<string, SearchClient> _queryClientMapping;
        private readonly SearchIndexClient _indexClient;
        public CognitiveSearchBaseService(CognitiveSearchConfiguration configuration)
        {
            _configuration = configuration;
            isEnabled = _configuration.Enabled;

            if (!isEnabled)
            {
                return;
            }
            else
            {
                _indexClient = new SearchIndexClient(new Uri(_configuration.EndPoint), new AzureKeyCredential(_configuration.AdminApiKey));
            }
        }

        public bool IsEnabled()
        {
            return isEnabled;
        }

        public async Task<List<SearchIndex>> ListIndices()
        {
            if (!isEnabled)
            {
                return null;
            }
            return await _indexClient.GetIndexesAsync().ToListAsync();
        }

        public async Task<bool> CreateIndex(string indexName)
        {
            if (!isEnabled)
            {
                return false;
            }
            if (_indexClient.GetIndex(indexName) == null)
            {
                SearchIndex newIndex = new SearchIndex(indexName);
                await _indexClient.CreateIndexAsync(newIndex);
                return true;
            }
            return false;
        }

        public async Task<bool> DeleteIndex(string indexName)
        {
            if (!isEnabled)
            {
                return false;
            }
            try
            {
                if (_indexClient.GetIndex(indexName) != null)
                {
                    await _indexClient.DeleteIndexAsync(indexName);
                }
                return true;
            }
            catch (RequestFailedException e) when (e.Status == 404)
            {
                return false;
            }
        }

        public async Task<SearchClient> GetIndexClientForAdmin(string indexName)
        {
            if (!isEnabled)
            {
                return null;
            }
            if (_indexClient.GetIndex(indexName) == null)
            {
                var created = await CreateIndex(indexName);
            }
            return _indexClient.GetSearchClient(indexName);
        }

        public async Task<SearchClient> GetSearchClientForQueries(string indexName)
        {
            if (!isEnabled)
            {
                return null;
            }

            if (_queryClientMapping.TryGetValue(indexName, out SearchClient searchClient))
            {
                return searchClient;
            }

            else
            {
                if (_indexClient.GetIndex(indexName) == null)
                {
                    throw new Exception($"Search index with the name '{indexName}' was not found.");
                }
                SearchClient searchClientNew = new SearchClient(new Uri(_configuration.EndPoint), indexName, new AzureKeyCredential(_configuration.QueryApiKey));
                if (_queryClientMapping.TryAdd(indexName, searchClientNew))
                {
                    return _queryClientMapping[indexName];
                }
                else
                {
                    throw new Exception("Failed to add search client to the mapping");
                }
            }
        }
    }
}
