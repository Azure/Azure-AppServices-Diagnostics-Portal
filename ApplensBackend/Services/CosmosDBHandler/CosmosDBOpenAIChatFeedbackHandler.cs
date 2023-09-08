using CommonLibrary.Models;
using CommonLibrary.Services;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CosmosDBOpenAIChatFeedbackHandler : CosmosDBHandlerBase<ChatFeedback>, ICosmosDBOpenAIChatFeedbackHandler
    {
        const string collectionId = "OpenAIChatFeedback";
        private readonly ISemanticSearchService _semanticSearchService;

        /// <summary>
        /// Initializes a new instance of the <see cref="CosmosDBOpenAIChatFeedbackHandler"/> class.
        /// Constructor.
        /// </summary>
        /// <param name="configuration">Configuration object.</param>
        public CosmosDBOpenAIChatFeedbackHandler(IConfiguration configration, ISemanticSearchService semanticSearchService) : base(configration)
        {
            CollectionId = collectionId;
            Inital(configration).Wait();
            _semanticSearchService = semanticSearchService;
        }

        private SemanticSearchDocument GetCogSearchDocFromFeedback(ChatFeedback chatFeedback)
        {
            if (chatFeedback == null)
            {
                return null;
            }

            SemanticSearchDocument doc = new SemanticSearchDocument(chatFeedback.Id, chatFeedback.UserQuestion, !string.IsNullOrWhiteSpace(chatFeedback.FeedbackExplanation) ? chatFeedback.FeedbackExplanation : chatFeedback.ExpectedResponse);
            doc.JsonPayload = JsonConvert.SerializeObject(chatFeedback);
            return doc;
        }

        /// <summary>
        /// Adds feedback to database.
        /// </summary>
        /// <param name="chatFeedback">Feedback to be added.</param>
        /// <returns>ChatFeedbackSaveOperationResponse object indicating whether the save operation was successful or a failure.</returns>
        public async Task<ChatFeedback> SaveFeedback(ChatFeedback chatFeedback)
        {
            SemanticSearchDocument doc = GetCogSearchDocFromFeedback(chatFeedback);
            var cosmosSaveResponse = await Container.CreateItemAsync<ChatFeedback>(chatFeedback, GetPartitionKey(chatFeedback));
            if ((int)cosmosSaveResponse.StatusCode > 199 && (int)cosmosSaveResponse.StatusCode < 300)
            {
                try
                {
                    _ = await _semanticSearchService.AddDocuments(new List<SemanticSearchDocument>() { doc }, chatFeedback.PartitionKey);
                    return chatFeedback;
                }
                catch
                {
                    await Container.DeleteItemAsync<ChatFeedback>(chatFeedback.Id, GetPartitionKey(chatFeedback));
                    throw;
                }
            }
            else
            {
                throw new Exception($"Failed to save feedback in Cosmos. Status: {cosmosSaveResponse.StatusCode} ActivityId:{cosmosSaveResponse.ActivityId}");
            }
        }

        /// <summary>
        /// Gets chat feedback for a specific PartitionKey and Id from Cosmos.
        /// </summary>
        /// <returns>Feedback correspoding to the Id. Null if matching feedback is not found.</returns>
        public async Task<ChatFeedback> GetFeedback(string chatIdentifier, string provider, string resourceType, string feedbackId) =>
            await GetItemAsync(feedbackId, ChatFeedback.GetPartitionKey(chatIdentifier, provider, resourceType));


        public async Task<Tuple<bool, List<string>>> DeleteFeedbacks(string chatIdentifier, string provider, string resourceType, List<string> feedbackIds)
        {
            if (feedbackIds?.Count < 1)
            {
                return new Tuple<bool, List<string>>(true, feedbackIds);
            }

            string partitionKeyStr = ChatFeedback.GetPartitionKey(chatIdentifier, provider, resourceType);
            List<bool> deleteResult = await _semanticSearchService.RemoveDocuments(feedbackIds, partitionKeyStr);

            if (deleteResult.Any())
            {
                List<string> deletedFeedbacks = new List<string>();
                PartitionKey partitionKey = new PartitionKey(partitionKeyStr);
                List<string> docsFailedDeletionFromCosmos = new List<string>();
                for (var idx=0; idx<feedbackIds.Count; idx++)
                {
                    if (deleteResult[idx])
                    {
                        try
                        {
                            await Container.DeleteItemAsync<ChatFeedback>(feedbackIds[idx], partitionKey);
                            deletedFeedbacks.Add(feedbackIds[idx]);
                        }
                        catch
                        {
                            docsFailedDeletionFromCosmos.Add(feedbackIds[idx]);
                        }
                    }
                }

                if (docsFailedDeletionFromCosmos.Count > 0)
                {
                    // Some documents could not be deleted from Cosmos while they were deleted from CognitiveSearch. Re-insert them in Cognitive to ensure consistency
                    List<ChatFeedback> feedbacksToReinsert = new List<ChatFeedback>();
                    foreach (string feedbackId in docsFailedDeletionFromCosmos)
                    {
                        var chatFeedbackItem = await GetItemAsync(feedbackId, partitionKeyStr);
                        // Item not present in Cosmos, conclude it was deleted.
                        if (chatFeedbackItem == null)
                        {
                            // Item not present in Cosmos, conclude it was deleted.
                            if (!deletedFeedbacks.Any(id => id.Equals(feedbackId, StringComparison.OrdinalIgnoreCase)))
                            {
                                deletedFeedbacks.Add(feedbackId);
                            }
                        }
                        else
                        {
                            feedbacksToReinsert.Add(chatFeedbackItem);
                        }
                    }

                    List<SemanticSearchDocument> docs = feedbacksToReinsert.Where(f => f != null).Select(f => GetCogSearchDocFromFeedback(f)).ToList();
                    _ = await _semanticSearchService.AddDocuments(docs, partitionKeyStr);
                }

                return new Tuple<bool, List<string>>(deletedFeedbacks.Count == deleteResult.Count(x => x), deletedFeedbacks);
            }
            else
            {
                return new Tuple<bool, List<string>>(false, new List<string>());
            }
        }

        private PartitionKey GetPartitionKey(ChatFeedback chatFeedback) => new PartitionKey(chatFeedback.PartitionKey);

    }
}
