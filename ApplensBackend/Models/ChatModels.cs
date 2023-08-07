using Azure;
using Azure.AI.OpenAI;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Newtonsoft.Json;
using SendGrid.Helpers.Mail;
using System;
using System.Collections.Generic;
using System.Security.Policy;
using System.Text.RegularExpressions;

namespace AppLensV3.Models
{
    public class RequestChatPayload
    {
        public ChatMetaData MetaData { get; set; }

        public ChatMessage[] Messages { get; set; }
    }

    public class ChatPurgeModel
    {
        public List<string> FeedbackIds { get; set; }

        public string ChatIdentifier { get; set; }

        public string Provider { get; set; }

        public string ResourceType { get; set; }
    }

    public class GPT3CompletionModelPayload
    {
        [JsonProperty(PropertyName = "model")]
        public string Model { get; set; } = "text-davinci-003";

        [JsonProperty(PropertyName = "prompt")]
        public string Prompt { get; set; }

        [JsonProperty(PropertyName = "temperature")]
        public double temperature { get; set; } = 0.1;

        [JsonProperty(PropertyName = "max_tokens")]
        public int MaxTokens { get; set; } = 500;

        public GPT3CompletionModelPayload(string prompt)
        {
            if (string.IsNullOrWhiteSpace(prompt))
            {
                throw new ArgumentNullException(nameof(prompt));
            }

            Prompt = prompt;
        }
    }

    public class ChatMetaData
    {
        public string MessageId;
        public string ChatIdentifier;
        public string ChatModel;
        public int MaxTokens;
        public string AzureServiceName;
        public string ArmResourceId;

        private string provider = string.Empty;

        public string Provider
        {
            get
            {
                if (string.IsNullOrWhiteSpace(provider) && !string.IsNullOrWhiteSpace(ArmResourceId) && ArmResourceId.IndexOf("/providers/", StringComparison.OrdinalIgnoreCase) > -1)
                {
                    int providersIndex = ArmResourceId.IndexOf("/providers/", StringComparison.OrdinalIgnoreCase) + 11;
                    var resourceParts = ArmResourceId.Substring(providersIndex).Split('/');
                    if (resourceParts.Length > 0)
                    {
                        provider = resourceParts[0];
                    }
                }

                return provider;
            }

            set
            {
                provider = value ?? string.Empty;
            }
        }

        private string resourceType;

        public string ResourceType
        {
            get
            {
                if (string.IsNullOrWhiteSpace(resourceType) && !string.IsNullOrWhiteSpace(ArmResourceId) && ArmResourceId.IndexOf("/providers/", StringComparison.OrdinalIgnoreCase) > -1)
                {
                    int providersIndex = ArmResourceId.IndexOf("/providers/", StringComparison.OrdinalIgnoreCase) + 11;
                    var resourceParts = ArmResourceId.Substring(providersIndex).Split('/');
                    if (resourceParts.Length > 1)
                    {
                        resourceType = resourceParts[1];
                    }
                }

                return resourceType;
            }

            set
            {
                resourceType = value ?? string.Empty;
            }
        }

        public Dictionary<string, string> ResourceSpecificInfo { get; set; } = new Dictionary<string, string>();
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

    public class ExtendedChatCompletionsOptions:ChatCompletionsOptions
    {
        [JsonIgnore]
        public List<string> FeedbackIdsUsed { get; set; } = new List<string>();
    }

    public class ChatResponse
    {
        /// <summary>
        /// Gets or sets response to show on the UI.
        /// </summary>
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// Gets a value indicating whether the response is truncated and if more is to follow.
        /// </summary>
        public bool Truncated
        {
            get => FinishReason.Equals("length", System.StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets or sets a description of how evaluation of this chat ended.
        /// </summary>
        public string FinishReason { get; set; } = string.Empty;

        public List<string> FeedbackIds { get; set; }

        public ChatResponse(string chatResponse)
        {
            Text = chatResponse ?? string.Empty;
            FinishReason = "stop";
        }

        public ChatResponse(string chatResponse, string finishReason)
        {
            Text = chatResponse ?? string.Empty;
            FinishReason = finishReason ?? string.Empty;
        }

        public ChatResponse(Response<ChatCompletions> chatCompletionResponse)
        {
            if (chatCompletionResponse?.Value?.Choices?.Count > 0)
            {
                Text = chatCompletionResponse.Value.Choices[0].Message?.Content ?? string.Empty;
                FinishReason = chatCompletionResponse.Value.Choices[0].FinishReason ?? string.Empty;
            }
        }

        public ChatResponse(OpenAIAPIResponse textCompletionResponse)
        {
            if (textCompletionResponse?.Choices.Count > 0)
            {
                Text = textCompletionResponse.Choices[0].Text ?? string.Empty;
                FinishReason = textCompletionResponse.Choices[0].Finish_Reason ?? string.Empty;
            }
        }


        /// <summary>
        /// Initializes a new instance of the <see cref="ChatResponse"/> class.
        /// </summary>
        public ChatResponse()
        {
        }
    }

    public class OpenAIAPIResponse
    {
        public string Id { get; set; }
        public string Object { get; set; }
        public int Created { get; set; }
        public string Model { get; set; }
        public List<OpenAIResponseText> Choices { get;set; }
        public OpenAIResponseUsage Usage { get; set; }
    }

    public class OpenAIResponseText
    {
        public string Text { get; set; }
        public int Index { get; set; }
        public string Logprobs { get; set; }
        public string Finish_Reason { get; set; }
    }

    public class OpenAIResponseUsage
    {
        public int Prompt_Tokens { get; set; }
        public int Completion_Tokens { get; set; }
        public int Total_Tokens { get; set; }
    }

    public class ChatFeedback
    {
        [JsonProperty(PropertyName = "id")]
        public string Id { get; set; }

        [JsonProperty]
        public DateTime Timestamp { get; set; }

        [JsonProperty]
        public string Provider { get; set; }

        [JsonProperty]
        public string ResourceType { get; set; }

        [JsonProperty]
        public string ChatIdentifier { get; set; }

        [JsonProperty]
        public string SubmittedBy { get; set; }

        [JsonProperty]
        public string UserQuestion { get; set; }

        [JsonProperty]
        public string IncorrectSystemResponse { get; set; }

        [JsonProperty]
        public string ExpectedResponse { get; set; }

        [JsonProperty]
        public string FeedbackExplanation { get; set; }

        [JsonProperty]
        public Dictionary<string, string> AdditionalFields { get; set; }

        [JsonProperty]
        public Dictionary<string, string> ResourceSpecificInfo { get; set; }

        [JsonProperty]
        public List<string> LinkedFeedbackIds { get; set; }

        [JsonProperty]
        public string PartitionKey => $"{ChatFeedback.GetPartitionKey(ChatIdentifier, Provider, ResourceType)}";

        public static string GetPartitionKey(string chatIdentifier, string provider, string resourceType)
            => NormalizeString($"{(string.IsNullOrWhiteSpace(chatIdentifier) ? "default" : chatIdentifier)}-{provider}-{resourceType}");

        /// <summary>
        /// Remove special characters from a string. This is used to create partition key and adhere to requirements by Azure Cognitive search APIs.
        /// </summary>
        /// <param name="str">String to normalize</param>
        /// <returns>A string that has all special characters replaced with a -</returns>
        private static string NormalizeString(string str)
        {
            if (string.IsNullOrWhiteSpace(str)) return str;

            str = str.Replace(" ", string.Empty).Trim('-').ToLowerInvariant();

            // Replace all special characters with - in str
            string pattern = "[^a-z0-9-]+";

            // Replace special characters with a hyphen "-". Repeating special characters are replaced with a single occurrence of a dash.
            string updatedString = Regex.Replace(str, pattern, "-");
            updatedString = updatedString.Trim('-');
            return updatedString.Length > 127 ? updatedString.Substring(0, 127) : updatedString;
        }
    }
}
