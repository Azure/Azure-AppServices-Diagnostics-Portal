using AppLensV3.Models;
using System.Collections.Generic;
using System;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface ICosmosDBOpenAIChatFeedbackHandler: ICosmosDBHandlerBase<ChatFeedback>
    {
        /// <summary>
        /// Adds feedback to database.
        /// </summary>
        /// <param name="chatFeedback">Feedback to be added.</param>
        /// <returns>ChatFeedbackSaveOperationResponse object indicating whether the save operation was successful or a failure.</returns>
        Task<ChatFeedback> SaveFeedback(ChatFeedback chatFeedback);

        /// <summary>
        /// Gets chat feedback for a specific PartitionKey and Id. PartitionKey is auto created based on ChatIdentifier, provider and resourcetype values.
        /// </summary>
        /// <returns>Feedback correspoding to the Id. Null if matching feedback is not found.</returns>
        Task<ChatFeedback> GetFeedback(string chatIdentifier, string provider, string resourceType, string feedbackId);

        Task<Tuple<bool, List<string>>> DeleteFeedbacks(string chatIdentifier, string provider, string resourceType, List<string> feedbackIds);
    }
}
