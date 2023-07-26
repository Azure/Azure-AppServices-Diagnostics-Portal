using AppLensV3.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class NullableCosmosDBOpenAIChatFeedbackHandler : ICosmosDBOpenAIChatFeedbackHandler
    {
        private ChatFeedback nullableChatFeedback;
        public Task<ChatFeedback> GetFeedback(string chatIdentifier, string provider, string resourceType, string feedbackId)
        {
            return Task.FromResult(nullableChatFeedback);
        }

        public Task<ChatFeedback> SaveFeedback(ChatFeedback chatFeedback)
        {
            return Task.FromResult(nullableChatFeedback);
        }

        Task<ChatFeedback> ICosmosDBHandlerBase<ChatFeedback>.CreateItemAsync(ChatFeedback item)
        {
            return Task.FromResult(nullableChatFeedback);
        }

        Task<ChatFeedback> ICosmosDBHandlerBase<ChatFeedback>.GetItemAsync(string id, string partitionKey)
        {
            return Task.FromResult(nullableChatFeedback);
        }

        Task<List<ChatFeedback>> ICosmosDBHandlerBase<ChatFeedback>.GetItemsAsync(string partitionKey)
        {
            return Task.FromResult(new List<ChatFeedback>() { nullableChatFeedback });
        }

        Task<ChatFeedback> ICosmosDBHandlerBase<ChatFeedback>.UpdateItemAsync(ChatFeedback item, string partitionKey)
        {
            return Task.FromResult(nullableChatFeedback);
        }
    }
}
