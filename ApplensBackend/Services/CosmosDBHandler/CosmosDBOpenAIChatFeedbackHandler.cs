using AppLensV3.Models;
using AppLensV3.Services.CognitiveSearchService;
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
        private readonly ICognitiveSearchAdminService _cognitiveSearchAdminService;

        /// <summary>
        /// Initializes a new instance of the <see cref="CosmosDBOpenAIChatFeedbackHandler"/> class.
        /// Constructor.
        /// </summary>
        /// <param name="configuration">Configuration object.</param>
        public CosmosDBOpenAIChatFeedbackHandler(IConfiguration configration, ICognitiveSearchAdminService cognitiveSearchAdminService) : base(configration)
        {
            CollectionId = collectionId;
            Inital(configration).Wait();
            _cognitiveSearchAdminService = cognitiveSearchAdminService;
        }

        private CognitiveSearchDocument GetCogSearchDocFromFeedback(ChatFeedback chatFeedback)
        {
            if (chatFeedback == null)
            {
                return null;
            }

            CognitiveSearchDocument doc = new CognitiveSearchDocument(chatFeedback.Id, chatFeedback.UserQuestion, !string.IsNullOrWhiteSpace(chatFeedback.FeedbackExplanation) ? chatFeedback.FeedbackExplanation : chatFeedback.ExpectedResponse);
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
            CognitiveSearchDocument doc = GetCogSearchDocFromFeedback(chatFeedback);
            var cosmosSaveResponse = await Container.CreateItemAsync<ChatFeedback>(chatFeedback, GetPartitionKey(chatFeedback));
            if ((int)cosmosSaveResponse.StatusCode > 199 && (int)cosmosSaveResponse.StatusCode < 300)
            {
                try
                {
                    _ = await _cognitiveSearchAdminService.AddDocuments(new List<CognitiveSearchDocument>() { doc }, chatFeedback.PartitionKey);
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
            Tuple<bool, List<string>> deleteResult = await _cognitiveSearchAdminService.DeleteDocuments(feedbackIds, partitionKeyStr, "Id");

            if (deleteResult.Item2.Count > 0)
            {
                List<string> deletedFeedbacks = new List<string>();
                PartitionKey partitionKey = new PartitionKey(partitionKeyStr);
                foreach (string feedbackId in deleteResult.Item2)
                {
                    try
                    {
                        await Container.DeleteItemAsync<ChatFeedback>(feedbackId, partitionKey);
                        deletedFeedbacks.Add(feedbackId);
                    }
                    catch
                    { }
                }

                if (deletedFeedbacks.Count < deleteResult.Item2.Count)
                {
                    // Some documents could not be deleted from Cosmos while they were deleted from CognitiveSearch. Re-insert them in Cognitive to ensure consistency
                    List<string> docsFailedDeletionFromCosmos = deleteResult.Item2.Except(deletedFeedbacks).ToList();
                    List<ChatFeedback> feedbacksToReinsert = new List<ChatFeedback>();
                    foreach (string feedbackId in docsFailedDeletionFromCosmos)
                    {
                        var chatFeedbackItem = await GetItemAsync(feedbackId, partitionKeyStr);
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

                    List<CognitiveSearchDocument> docs = feedbacksToReinsert.Where(f => f != null).Select(f => GetCogSearchDocFromFeedback(f)).ToList();
                    _ = await _cognitiveSearchAdminService.AddDocuments(docs, partitionKeyStr);
                }

                return new Tuple<bool, List<string>>(deletedFeedbacks.Count == deleteResult.Item2.Count, deletedFeedbacks);
            }
            else
            {
                return new Tuple<bool, List<string>>(false, new List<string>());
            }
        }

        private PartitionKey GetPartitionKey(ChatFeedback chatFeedback) => new PartitionKey(chatFeedback.PartitionKey);

    }
}
