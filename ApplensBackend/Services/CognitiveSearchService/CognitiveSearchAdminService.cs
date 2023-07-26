using AppLensV3.Models;
using Azure.Search.Documents.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services.CognitiveSearchService
{
    public interface ICognitiveSearchAdminService
    {
        Task<bool> AddDocuments(List<CognitiveSearchDocument> documents, string indexName);
        Task<bool> DeleteIndex(string indexName);
        Task<bool> CreateIndex(string indexName);
        Task<List<string>> ListIndices();
    }

    public class CognitiveSearchAdminService: ICognitiveSearchAdminService {
        private readonly ICognitiveSearchBaseService _baseService;

        public CognitiveSearchAdminService(ICognitiveSearchBaseService baseService)
        {
            _baseService = baseService;
        }

        public async Task<bool> DeleteDocuments(List<CognitiveSearchDocument> documents, string indexName)
        {
            var searchClient = await _baseService.GetIndexClientForAdmin(indexName);
            IndexDocumentsResult result = await searchClient.DeleteDocumentsAsync(documents.Select(document => CreateDocumentModel(document)));
            return !(result.Results.Any(r => r.Succeeded == false) == true);
        }

        public async Task<bool> AddDocuments(List<CognitiveSearchDocument> documents, string indexName)
        {
            IndexDocumentsBatch<CognitiveSearchDocumentWrapper> batch = IndexDocumentsBatch.Create(
                documents.Select(document => IndexDocumentsAction.Upload(CreateDocumentModel(document))).ToArray());
            var searchClient = await _baseService.GetIndexClientForAdmin(indexName);
            IndexDocumentsResult result = searchClient.IndexDocuments(batch);
            return !(result.Results.Any(r => r.Succeeded == false) == true);
        }

        public async Task<bool> DeleteIndex(string indexName)
        {
            return await _baseService.DeleteIndex(indexName);
        }

        public async Task<bool> CreateIndex(string indexName)
        {
            return await _baseService.CreateIndex(indexName);
        }

        public async Task<List<string>> ListIndices()
        {
            return (await _baseService.ListIndices()).Select(x => x.Name).ToList();
        }

        private CognitiveSearchDocumentWrapper CreateDocumentModel(CognitiveSearchDocument document)
        {
            return new CognitiveSearchDocumentWrapper()
            {
                Text = document.Content,
                Description = document.Title,
                Id = document.Id,
                AdditionalMetadata = JsonConvert.SerializeObject(document)
            };
        }
    }
}
