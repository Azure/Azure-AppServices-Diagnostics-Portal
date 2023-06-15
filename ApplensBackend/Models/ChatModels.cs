using Azure.AI.OpenAI;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Models
{
    public class RequestChatPayload
    {
        public ChatMetaData MetaData { get; set; }

        public ChatMessage[] Messages { get; set; }
    }

    public class ChatMetaData
    {
        public string MessageId;
        public string ChatIdentifier;
        public string ChatModel;
        public int MaxTokens;
        public string AzureServiceName;
    }

    public class ChatStreamResponse
    {
        public string Content;

        public string FinishReason;

        /// <summary>
        /// Initializes a new instance of the <see cref="ChatStreamResponse"/> class.
        /// </summary>
        /// <param name="content">content.</param>
        /// <param name="finishReason">finish reason.</param>
        public ChatStreamResponse(string content = "", string finishReason = "")
        {
            Content = content;
            FinishReason = finishReason;
        }
    }
}
