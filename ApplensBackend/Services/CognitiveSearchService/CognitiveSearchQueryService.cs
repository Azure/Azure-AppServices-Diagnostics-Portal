using AppLensV3.Models;
using AppLensV3.Services.CognitiveSearchService;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface ICognitiveSearchQueryService
    {
        Task<List<CognitiveSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments=3, double minScore = 0.5);
    }

    public class CognitiveSearchQueryService: ICognitiveSearchQueryService
    {
        private readonly ICognitiveSearchBaseService _baseService;
        public CognitiveSearchQueryService(ICognitiveSearchBaseService baseService)
        {
            _baseService = baseService;
        }

        public async Task<List<CognitiveSearchDocument>> SearchDocuments(string query, string indexName, int numDocuments = 3, double minScore = 0.5)
        {
            var queryClient = await _baseService.GetSearchClientForQueries(indexName);
            if (queryClient != null)
            {
                SearchOptions options = new SearchOptions();
                options.Size = numDocuments;
                options.IncludeTotalCount = true;
                options.Select.Add("AdditionalMetadata");
                SearchResults<CognitiveSearchDocumentWrapper> results = await queryClient.SearchAsync<CognitiveSearchDocumentWrapper>(query, options);
                if (results != null && results.TotalCount > 0)
                {
                    return results.GetResults().ToList().Where(result => result.Score >= minScore).OrderBy(o => o.Score).Select(x => JsonConvert.DeserializeObject<CognitiveSearchDocument>(x.Document.AdditionalMetadata)).ToList();
                }
            }

            return new List<CognitiveSearchDocument>();
        }
    }
}
