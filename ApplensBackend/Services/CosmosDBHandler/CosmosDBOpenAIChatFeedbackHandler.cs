using AppLensV3.Models;
using AppLensV3.Services.CognitiveSearchService;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
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

        /// <summary>
        /// Adds feedback to database.
        /// </summary>
        /// <param name="chatFeedback">Feedback to be added.</param>
        /// <returns>ChatFeedbackSaveOperationResponse object indicating whether the save operation was successful or a failure.</returns>
        public async Task<ChatFeedback> SaveFeedback(ChatFeedback chatFeedback)
        {
            CognitiveSearchDocument doc = new CognitiveSearchDocument(chatFeedback.Id, chatFeedback.UserQuestion, chatFeedback.FeedbackExplanation);
            doc.JsonPayload = JsonConvert.SerializeObject(chatFeedback);
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

        private PartitionKey GetPartitionKey(ChatFeedback chatFeedback) => new PartitionKey(chatFeedback.PartitionKey);

    }
}
