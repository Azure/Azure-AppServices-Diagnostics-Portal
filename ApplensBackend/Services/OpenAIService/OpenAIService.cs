using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Models;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace AppLensV3.Services
{
    public class CompletionModel
    {
        public dynamic Payload { get; set; }
    }

    public interface IOpenAIService : IDisposable
    {
        Task<ChatResponse> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest);

        Task<ChatResponse> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata);

        Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task> onMessageStreamAsyncCallback, CancellationToken cancellationToken = default);

        bool IsEnabled();

        /// <summary>
        /// Returns the last user message in the form of a question that the user would ask AI by looking at the conversation history. The returned question is the users intent.
        /// This is helpful while looking up articles/documents in vectorDB.
        /// </summary>
        /// <param name="chatMessages">Conversation history.</param>
        /// <returns>A string representing the userss intent in their last message to the system represented as a question.</returns>
        Task<string> PrepareCompositeUserQuestion(List<ChatMessage> chatMessages, ChatMetaData metadata);

        /// <summary>
        /// Looks up feedback closely matching the query and returns a list of matching feedbacks.
        /// </summary>
        /// <param name="chatIdentifier">Chat identifier representing the bot.</param>
        /// <param name="provider">Provider for the RP.</param>
        /// <param name="resourceType">Resource type for the RP.</param>
        /// <param name="chatMessages">Conversation history which will be analyzed to create a final user intent to do the lookup against.</param>
        /// <param name="feedbackSearchSettings">Helps configure how many feedback elements should be returned and how strict the matching should be.</param>
        /// <returns>A list of chat feedbacks that closely matched the query.</returns>
        Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null);

        /// <summary>
        /// Constructs an index for the feedback using chat metadata (chatIdentifier, provider and resourceType) to look up the feedback closely matching the query and returns a list of matching feedbacks.
        /// </summary>
        /// <param name="metadata">Chat metadata.</param>
        /// <param name="chatMessages">Conversation history which will be analyzed to create a final user intent to do the lookup against.</param>
        /// <param name="feedbackSearchSettings">Helps configure how many feedback elements should be returned and how strict the matching should be.</param>
        /// <returns>A list of chat feedbacks that closely matched the query.</returns>
        Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null);

        /// <summary>
        /// Looks up feedback closely matching the query and returns a list of matching feedbacks.
        /// </summary>
        /// <param name="chatIdentifier">Chat identifier representing the bot.</param>
        /// <param name="provider">Provider for the RP.</param>
        /// <param name="resourceType">Resource type for the RP.</param>
        /// <param name="query">Question to lookup against in vectorDB.</param>
        /// <param name="feedbackSearchSettings">Helps configure how many feedback elements should be returned and how strict the matching should be.</param>
        /// <returns>A list of chat feedbacks that closely matched the query.</returns>
        Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null);

        /// <summary>
        /// Constructs an index for the feedback using chat metadata (chatIdentifier, provider and resourceType) to look up the feedback closely matching the query and returns a list of matching feedbacks.
        /// </summary>
        /// <param name="metadata">Chat metadata.</param>
        /// <param name="query">Question to lookup against in vectorDB.</param>
        /// <param name="feedbackSearchSettings">Helps configure how many feedback elements should be returned and how strict the matching should be.</param>
        /// <returns>A list of chat feedbacks that closely matched the query.</returns>
        Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null);
    }

    public class OpenAIServiceDisabled : IOpenAIService
    {
        public bool IsEnabled() { return false; }

        public async Task<ChatResponse> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest) { return null; }

        public void Dispose() { }

        public Task<ChatResponse> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            return null;
        }

        public Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task> onMessageStreamAsyncCallback, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }

        public Task<string> PrepareCompositeUserQuestion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            return null;
        }

        public Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            return null;
        }

        public Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            return null;
        }

        public Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            return null;
        }

        public Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            return null;
        }
    }

    public class OpenAIChainResponse
    {
        /// <summary>
        /// Gets or sets a value that should be returned back to the client in case of a short circuit is desired, must be null otherwise.
        /// </summary>
        public ChatResponse ChatResponseToUseInShortCircuit { get; set; } = null;

        /// <summary>
        /// Gets or sets a value indicating the reason why the response should be short circuited. Optional.
        /// </summary>
        public string ShortCircuitReason { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a value that will be used to make a call to OpenAI service as a part of chaining operation.
        /// </summary>
        public ExtendedChatCompletionsOptions ChatCompletionsOptionsToUseInChain { get; set; } = null;
    }

    public class OpenAIService : IOpenAIService
    {
        private const int MaxTokensAllowed = 800;
        private const int MaxTokensAllowedForStreaming = 3000;
        private readonly string openAIEndpoint;
        private readonly string openAIGPT3APIUrl;
        private readonly string openAIGPT4Model;
        private readonly string openAIGPT35Model;
        private readonly string openAIAPIKey;
        private readonly ILogger<OpenAIService> logger;
        private readonly bool isOpenAIAPIEnabled = false;
        private static HttpClient httpClient;
        private IOpenAIRedisService redisCache;
        private IConfiguration configuration;
        private static OpenAIClient openAIClient;
        private readonly ICognitiveSearchQueryService _cognitiveSearchQueryService;
        private ConcurrentDictionary<string, Task<string>> chatTemplateFileCache;
        private string chatHubRedisKeyPrefix;
        private ConcurrentDictionary<string, ChatCompletionCustomHandler> customHandlerForChatCompletion = new ConcurrentDictionary<string, ChatCompletionCustomHandler>(StringComparer.OrdinalIgnoreCase);

        // Delegate gets chatCompletionOptions which will have the corresponding template file and past user messages already loaded.
        // It also gets the chatMessages and the chatMetaData in case the custom logic needs to prepare its independent set of messages.
        private delegate Task<OpenAIChainResponse> ChatCompletionCustomHandler(List<ChatMessage> chatMessages, ChatMetaData metadata, ExtendedChatCompletionsOptions chatCompletionsOptions, ILogger<OpenAIService> logger);

        public OpenAIService(IConfiguration config, IOpenAIRedisService redisService, ILogger<OpenAIService> logger, ICognitiveSearchQueryService cognitiveSearchQueryService)
        {
            _cognitiveSearchQueryService = cognitiveSearchQueryService;
            configuration = config;
            isOpenAIAPIEnabled = Convert.ToBoolean(configuration["OpenAIService:Enabled"]);
            chatTemplateFileCache = new ConcurrentDictionary<string, Task<string>>(StringComparer.OrdinalIgnoreCase) ;
            if (isOpenAIAPIEnabled)
            {
                this.logger = logger;
                redisCache = redisService;
                openAIEndpoint = configuration["OpenAIService:Endpoint"];
                openAIGPT3APIUrl = configuration["OpenAIService:GPT3DeploymentAPI"];
                openAIGPT4Model = configuration["OpenAIService:GPT4DeploymentName"];
                openAIGPT35Model = configuration["OpenAIService:GPT35DeploymentName"];
                openAIAPIKey = configuration["OpenAIService:APIKey"];
                chatHubRedisKeyPrefix = "ChatHub-MessageState-";

                ValidateConfiguration();
                InitializeHttpClient();
                InitializeOpenAIClient();
                InitializeChatTemplateFileCache();
            }
        }

        private async Task<string> GetFromRedisCache(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return null;
            }
            return await redisCache.GetKey(key);
        }

        private async Task<bool> SaveToRedisCache(string key, string value)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            {
                return false;
            }
            return await redisCache.SetKey(key, value);
        }

        private async Task<string> PrepareDocumentContent(DocumentSearchSettings documentSearchSettings, string query)
        {
            if (documentSearchSettings != null && documentSearchSettings.IndexName != null)
            {
                try
                {
                    var documents = await _cognitiveSearchQueryService.SearchDocuments(query, documentSearchSettings.IndexName);
                    if (documents != null && documents.Count > 0)
                    {
                        List<string> documentContentList = new List<string>();
                        foreach (var document in documents)
                        {
                            documentContentList.Add($"{(!string.IsNullOrWhiteSpace(document.Title) ? document.Title + "\n" : "")}{document.Content}\n{(!string.IsNullOrWhiteSpace(document.Url) ? "ReferenceUrl: " + document.Url : "")}");
                        }
                        var documentContent = string.Join("\n\n", documentContentList);
                        if (documentSearchSettings.IncludeReferences)
                        {
                            documentContent = documentContent + "\nPlease provide reference links of the documents used to answer the query, at the bottom of your answer. Reference links should be created with title and url of the document using the <a href> HTML attribute with target='_blank'";
                        }
                        return documentContent;
                    }
                }
                catch (Exception ex)
                {
                    return null;
                }
            }
            return null;
        }

        public async Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            ChatMetaData metadata = new ChatMetaData()
            {
                ChatIdentifier = chatIdentifier,
                Provider = provider,
                ResourceType = resourceType
            };
            return await GetChatFeedbackRaw(metadata, chatMessages, feedbackSearchSettings);
        }

        public async Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, List<ChatMessage> chatMessages, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            if (chatMessages?.Count > 0)
            {
                string compositeUserQuestion = await PrepareCompositeUserQuestion(chatMessages, metadata);

                if (!string.IsNullOrWhiteSpace(compositeUserQuestion))
                {
                    return await GetChatFeedbackRaw(metadata, compositeUserQuestion, feedbackSearchSettings);
                }
            }

            return null;
        }

        public async Task<List<ChatFeedback>> GetChatFeedbackRaw(string chatIdentifier, string provider, string resourceType, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            ChatMetaData metadata = new ChatMetaData()
            {
                ChatIdentifier = chatIdentifier,
                Provider = provider,
                ResourceType = resourceType
            };
            return await GetChatFeedbackRaw(metadata, query, feedbackSearchSettings);
        }

        public async Task<List<ChatFeedback>> GetChatFeedbackRaw(ChatMetaData metadata, string query, ChatFeedbackSearchSettings feedbackSearchSettings = null)
        {
            try
            {
                if (feedbackSearchSettings == null)
                {
                    feedbackSearchSettings = new ChatFeedbackSearchSettings();
                }

                if (!string.IsNullOrWhiteSpace(ChatFeedback.GetPartitionKey(metadata.ChatIdentifier, metadata.Provider, metadata.ResourceType)))
                {
                    string index = ChatFeedback.GetPartitionKey(metadata.ChatIdentifier, metadata.Provider, metadata.ResourceType);
                    var documents = await _cognitiveSearchQueryService.SearchDocuments(query, index, feedbackSearchSettings.NumDocuments, feedbackSearchSettings.MinScore);
                    if (documents != null && documents.Count > 0)
                    {
                        List<ChatFeedback> feedbackList = new List<ChatFeedback>();
                        foreach (var document in documents)
                        {
                            if (!string.IsNullOrWhiteSpace(document.JsonPayload))
                            {
                                try
                                {
                                    feedbackList.Add(JsonConvert.DeserializeObject<ChatFeedback>(document.JsonPayload));
                                }
                                catch
                                {
                                    // If one deserialization fails, move to processing next feedback
                                }
                            }
                        }

                        return feedbackList;
                    }
                }
            }
            catch
            {
                return null;
            }

            return null;
        }

        public async Task<ChatResponse> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest)
        {
            var cacheKey = JsonConvert.SerializeObject(requestBody);
            if (cacheEnabledOnRequest)
            {
                var getFromCache = await GetFromRedisCache(cacheKey);
                if (!string.IsNullOrEmpty(getFromCache))
                {
                    return JsonConvert.DeserializeObject<ChatResponse>(getFromCache);
                }
            }

            try
            {
                var endpoint = $"{openAIEndpoint}{openAIGPT3APIUrl}";
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
                requestMessage.Content = new StringContent(JsonConvert.SerializeObject(requestBody.Payload), Encoding.UTF8, "application/json");
                var response = await httpClient.SendAsync(requestMessage);
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    OpenAIAPIResponse openAIApiResponse = JsonConvert.DeserializeObject<OpenAIAPIResponse>(content);
                    ChatResponse responseToReturn = new ChatResponse(openAIApiResponse);
                    if (cacheEnabledOnRequest)
                    {
                        try
                        {
                            if (!string.IsNullOrWhiteSpace(responseToReturn.Text))
                            {
                                var saveStatus = await SaveToRedisCache(cacheKey, JsonConvert.SerializeObject(responseToReturn));
                                logger.LogInformation($"Status of OpenAISaveToRedisCache: {saveStatus}");
                            }
                        }
                        catch (Exception ex)
                        {
                            // No big deal if save to cache fails, log and succeed the request
                            logger.LogWarning($"Failed to save OpenAI response to Redis Cache: {ex}");
                        }
                    }

                    return responseToReturn;
                }
                else
                {
                    throw new HttpRequestException(message: await response.Content.ReadAsStringAsync(), inner: null, statusCode: response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                logger.LogError($"OpenAICallError: {ex}");
                throw;
            }
        }

        public async Task<ChatResponse> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            if (chatMessages == null || chatMessages.Count == 0)
            {
                throw new ArgumentNullException("chatMessages cannot be null or empty");
            }

            ExtendedChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);

            Response<ChatCompletions> response = null;
            OpenAIChainResponse chainResponse = null;

            if (!string.IsNullOrWhiteSpace(metadata.ChatIdentifier) && customHandlerForChatCompletion.TryGetValue(metadata.ChatIdentifier, out ChatCompletionCustomHandler customHandler))
            {
                chainResponse = await customHandler.Invoke(chatMessages, metadata, chatCompletionsOptions, logger);
            }

            if (chainResponse?.ChatResponseToUseInShortCircuit != null)
            {
                return chainResponse.ChatResponseToUseInShortCircuit;
            }
            else
            {
                response = await openAIClient.GetChatCompletionsAsync(metadata.ChatModel == "gpt4" || string.IsNullOrWhiteSpace(openAIGPT35Model) ? openAIGPT4Model: openAIGPT35Model, chainResponse?.ChatCompletionsOptionsToUseInChain ?? chatCompletionsOptions);
            }

            ChatResponse chatResponse = new ChatResponse(response);
            if (chatCompletionsOptions?.FeedbackIdsUsed.Count > 0)
            {
                chatResponse.FeedbackIds.AddRange(chatCompletionsOptions.FeedbackIdsUsed);
            }

            return chatResponse;
        }

        /// <inheritdoc/>
        public async Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task>? onMessageStreamAsyncCallback = default, CancellationToken cancellationToken = default)
        {
            if (chatMessages == null || chatMessages.Count == 0)
            {
                return;
            }

            string finishReason = string.Empty;

            ExtendedChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);
            OpenAIChainResponse chainResponse = null;
            if (!string.IsNullOrWhiteSpace(metadata.ChatIdentifier) && customHandlerForChatCompletion.TryGetValue(metadata.ChatIdentifier, out ChatCompletionCustomHandler customHandler))
            {
                chainResponse = await customHandler.Invoke(chatMessages, metadata, chatCompletionsOptions, logger);
            }

            chatCompletionsOptions.MaxTokens = MaxTokensAllowedForStreaming;

            if (chainResponse?.ChatResponseToUseInShortCircuit != null)
            {
                if (onMessageStreamAsyncCallback != default)
                {
                    if (!string.IsNullOrWhiteSpace(chainResponse.ChatResponseToUseInShortCircuit.Text))
                    {
                        await onMessageStreamAsyncCallback(new ChatStreamResponse(content: chainResponse.ChatResponseToUseInShortCircuit.Text));
                    }

                    await onMessageStreamAsyncCallback(new ChatStreamResponse(
                        content: chatCompletionsOptions.FeedbackIdsUsed.Count > 0 ? JsonConvert.SerializeObject(chatCompletionsOptions.FeedbackIdsUsed) : string.Empty,
                        finishReason: "stop"));
                }
            }
            else
            {
                Response<StreamingChatCompletions> response = await openAIClient.GetChatCompletionsStreamingAsync(
                    metadata.ChatModel == "gpt4" || string.IsNullOrWhiteSpace(openAIGPT35Model) ? openAIGPT4Model : openAIGPT35Model, chainResponse?.ChatCompletionsOptionsToUseInChain ?? chatCompletionsOptions);
                using StreamingChatCompletions streamingChatCompletions = response.Value;
                await foreach (StreamingChatChoice choice in streamingChatCompletions.GetChoicesStreaming(cancellationToken))
                {
                    await foreach (ChatMessage message in choice.GetMessageStreaming(cancellationToken))
                    {
                        string messageState = await GetFromRedisCache($"{chatHubRedisKeyPrefix}{metadata.MessageId}");
                        if (messageState != null && messageState.Equals("cancelled", StringComparison.OrdinalIgnoreCase))
                        {
                            throw new OperationCanceledException("message marked for cancellation in redis cache");
                        }

                        if (onMessageStreamAsyncCallback != default && message != null)
                        {
                            await onMessageStreamAsyncCallback(new ChatStreamResponse(content: message.Content));
                        }
                    }

                    finishReason = choice.FinishReason;
                }

                if (onMessageStreamAsyncCallback != default)
                {
                    List<string> feedbackIdsToReturn = new List<string>();
                    feedbackIdsToReturn = (chainResponse?.ChatCompletionsOptionsToUseInChain ?? chatCompletionsOptions)?.FeedbackIdsUsed;
                    await onMessageStreamAsyncCallback(new ChatStreamResponse(
                        content: feedbackIdsToReturn?.Count > 0 ? JsonConvert.SerializeObject(feedbackIdsToReturn) : string.Empty,
                        finishReason: finishReason));
                }
            }
        }

        private void InitializeHttpClient()
        {
            httpClient = new HttpClient();
            httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
            httpClient.DefaultRequestHeaders.Add("api-key", $"{openAIAPIKey}");
        }

        private void InitializeOpenAIClient()
        {
            openAIClient = new OpenAIClient(
                new Uri(openAIEndpoint),
                new AzureKeyCredential(openAIAPIKey));
        }

        private async Task InitializeChatTemplateFileCache()
        {
            FileInfo[] allTemplateFiles = null;
            var listDirTask = Task.Factory.StartNew(() =>
            {
                DirectoryInfo dir = new DirectoryInfo(@"OpenAIChatTemplates");
                allTemplateFiles = dir.GetFiles("*.json");
            });

            await listDirTask;

            if (allTemplateFiles == null)
            {
                return;
            }

            foreach (FileInfo file in allTemplateFiles)
            {
                chatTemplateFileCache.TryAdd(file.Name, File.ReadAllTextAsync(file.FullName));
            }
        }

        private async Task<string> GetChatTemplateContent(string chatIdentifier)
        {
            string templateCacheKey = $"{chatIdentifier ?? string.Empty}.json";
            if (!chatTemplateFileCache.ContainsKey(templateCacheKey))
            {
                await InitializeChatTemplateFileCache();
            }

            if (string.IsNullOrWhiteSpace(chatIdentifier) || !chatTemplateFileCache.TryGetValue(templateCacheKey, out _))
            {
                templateCacheKey = "_default.json";
            }

            return await chatTemplateFileCache[templateCacheKey];
        }

        public async Task<string> PrepareCompositeUserQuestion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            if (chatMessages?.Count == 1 && !string.IsNullOrWhiteSpace(chatMessages[0].Content))
            {
                return chatMessages[0].Content;
            }

            string compositeQuestionCreatorTemplateContent = await GetChatTemplateContent("compositequestioncreator");
            JObject jObject = JObject.Parse(compositeQuestionCreatorTemplateContent);
            StringBuilder systemPromptSb = new StringBuilder();

            systemPromptSb.AppendLine("Below is a chat history between a human and an AI assistant.");
            systemPromptSb.AppendLine();
            foreach (ChatMessage chatMessage in chatMessages)
            {
                systemPromptSb.AppendLine($"{chatMessage.Role}:{chatMessage.Content}");
            }

            systemPromptSb.AppendLine();
            systemPromptSb.AppendLine($"{jObject["systemPrompt"] ?? string.Empty}");
            string systemPrompt = systemPromptSb.ToString();
            systemPrompt = systemPrompt.Replace("<<CURRENT_DATETIME>>", DateTime.UtcNow.ToString() + " UTC");
            systemPrompt = systemPrompt.Replace("<<ARM_RESOURCE_ID>>", metadata.ArmResourceId);
            ChatResponse response = await RunTextCompletion(new CompletionModel() { Payload = new GPT3CompletionModelPayload(systemPrompt) }, false);
            return response.Text;
        }

        private async Task<ExtendedChatCompletionsOptions> PrepareChatCompletionOptions(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            var chatCompletionsOptions = new ExtendedChatCompletionsOptions()
            {
                Temperature = 0.3F,
                MaxTokens = metadata.MaxTokens <= MaxTokensAllowed ? metadata.MaxTokens : MaxTokensAllowed,
                NucleusSamplingFactor = 0.95F,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };

            try
            {
                string chatTemplateContent = await GetChatTemplateContent(metadata.ChatIdentifier);
                string customPrompt = metadata.CustomPrompt ?? string.Empty;

                JObject jObject = JObject.Parse(chatTemplateContent);
                string systemPrompt = $"{(jObject["systemPrompt"] ?? string.Empty).ToString()}{customPrompt}";


                // Replace <<CURRENT_DATETIME>> with the current UTC Date time
                systemPrompt = systemPrompt.Replace("<<CURRENT_DATETIME>>", DateTime.UtcNow.ToString() + " UTC");
                systemPrompt = systemPrompt.Replace("<<ARM_RESOURCE_ID>>", metadata.ArmResourceId);
                string compsiteUserQuestion = string.Empty;

                ChatFeedbackSearchSettings feedbackSearchSettings = new ChatFeedbackSearchSettings();

                if (jObject["DocumentSearchSettings"] != null || jObject["ChatFeedbackSearchSettings"] != null || systemPrompt.Contains(feedbackSearchSettings.ContentPlaceholder))
                {
                    Task<string> documentContentTask = null;
                    DocumentSearchSettings documentSearchSettings = null;
                    Task<List<ChatFeedback>> getFeedbackListRawTask = null;
                    try
                    {
                        compsiteUserQuestion = await PrepareCompositeUserQuestion(chatMessages, metadata);
                        if (jObject["DocumentSearchSettings"] != null)
                        {
                            documentSearchSettings = jObject["DocumentSearchSettings"].ToObject<DocumentSearchSettings>();
                            documentContentTask = PrepareDocumentContent(documentSearchSettings, compsiteUserQuestion);
                        }

                        if (jObject["ChatFeedbackSearchSettings"] != null || systemPrompt.Contains(feedbackSearchSettings.ContentPlaceholder))
                        {
                            feedbackSearchSettings = jObject["ChatFeedbackSearchSettings"] != null ? (jObject["ChatFeedbackSearchSettings"].ToObject<ChatFeedbackSearchSettings>() ?? feedbackSearchSettings) : feedbackSearchSettings;

                            if (systemPrompt.Contains(feedbackSearchSettings.ContentPlaceholder))
                            {
                                ChatFeedbackSearchSettings clonedFeedbackSearchSettings = feedbackSearchSettings.Clone();
                                clonedFeedbackSearchSettings.NumDocuments += 10; // Fetch more documents than were specified. This is to account for later filtering before they are added to the system prompt.
                                getFeedbackListRawTask = GetChatFeedbackRaw(metadata, compsiteUserQuestion, clonedFeedbackSearchSettings);
                            }
                        }

                        if (documentContentTask != null && documentSearchSettings != null)
                        {
                            string documentContent = await documentContentTask;
                            if (!string.IsNullOrWhiteSpace(documentContent))
                            {
                                if (systemPrompt.Contains(documentSearchSettings.DocumentContentPlaceholder))
                                {
                                    systemPrompt = systemPrompt.Replace(documentSearchSettings.DocumentContentPlaceholder, documentContent);
                                }
                                else
                                {
                                    systemPrompt = $"Here is some information that can help answer user queries:\n{documentContent}\n\n{systemPrompt}";
                                }
                            }
                        }

                        if (getFeedbackListRawTask != null)
                        {
                            List<ChatFeedback> feedbackList = (await getFeedbackListRawTask) ?? new List<ChatFeedback>();

                            if (metadata.ResourceSpecificInfo?.Count > 0)
                            {
                                // Match retrieved feedback based on resource specific Info.
                                for (int i = feedbackList.Count - 1; i > -1; i--)
                                {
                                   if (!IsFeedbackApplicable(metadata, feedbackList[0]))
                                   {
                                        feedbackList.RemoveAt(i);
                                   }
                                }
                            }

                            if (feedbackList.Count > feedbackSearchSettings.NumDocuments)
                            {
                                // Optional, apply some semantic sorting to intelligently determine which feedbacks to retain out of the ones that matched.
                                feedbackList = feedbackList.Take(feedbackSearchSettings.NumDocuments).ToList();
                            }

                            StringBuilder feedbackSb = new StringBuilder();
                            foreach (ChatFeedback feedback in feedbackList)
                            {
                                feedbackSb.AppendLine($"Q:{feedback.UserQuestion}");
                                feedbackSb.AppendLine($"A:{feedback.ExpectedResponse}");
                                if (feedback.AdditionalFields?.Count > 0)
                                {
                                    List<string> additionalFields = new List<string>();
                                    foreach (KeyValuePair<string, string> kvp in feedback.AdditionalFields)
                                    {
                                        if (!string.IsNullOrWhiteSpace(kvp.Value))
                                        {
                                            additionalFields.Add(JsonConvert.SerializeObject(kvp, new JsonSerializerSettings()
                                            {
                                                ContractResolver = new DefaultContractResolver()
                                                {
                                                    NamingStrategy = new CamelCaseNamingStrategy()
                                                }
                                            }));
                                        }
                                    }

                                    if (additionalFields.Count > 0)
                                    {
                                        feedbackSb.AppendLine();
                                        feedbackSb.AppendLine($"Additional_Fields:[{string.Join(", ", additionalFields)}]");
                                    }
                                }

                                feedbackSb.AppendLine();
                                chatCompletionsOptions.FeedbackIdsUsed.Add(feedback.Id);
                            }

                            systemPrompt = systemPrompt.Replace(feedbackSearchSettings.ContentPlaceholder, feedbackSb.ToString());
                        }
                    }
                    catch (Exception ex)
                    {
                        // Do nothing and let the chat work as it is
                        logger.LogError($"Error while dynamically updating the system prompt : {ex}");
                    }
                }

                chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.System, systemPrompt));
                JArray fewShotExamples = (jObject["fewShotExamples"] ?? new JObject()).ToObject<JArray>();

                foreach (var element in fewShotExamples)
                {
                    string userMessage = (element["userInput"] ?? string.Empty).ToString();
                    string assistantMessage = (element["chatbotResponse"] ?? string.Empty).ToString();

                    chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, userMessage));
                    chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.Assistant, assistantMessage));
                }

                chatMessages.ForEach(e => chatCompletionsOptions.Messages.Add(e));

            }
            catch (Exception ex)
            {
                logger.LogError($"Error preparing chat completion options : {ex}");
            }

            return chatCompletionsOptions;
        }

        private void ValidateConfiguration()
        {
            ValidateConfigEntry("OpenAIService:Endpoint");
            ValidateConfigEntry("OpenAIService:APIKey");
            ValidateConfigEntry("OpenAIService:GPT3ModelAPI");
            ValidateConfigEntry("OpenAIService:GPT4Model");
        }

        private void ValidateConfigEntry(string entryName)
        {
            string errorMsg = $"Invalid configuration for parameter - {entryName}";
            if (string.IsNullOrWhiteSpace(entryName))
            {
                this.logger.LogError(errorMsg);
                throw new Exception(errorMsg);
            }
        }

        public bool IsEnabled()
        {
            return isOpenAIAPIEnabled;
        }

        public void Dispose()
        {
            if (httpClient != null)
            {
                httpClient.Dispose();
            }
        }

        private bool AreCommaSeparatedValuesEqual(string str1, string str2, bool matchAll = true)
        {
            str1 = string.IsNullOrWhiteSpace(str1) ? string.Empty : str1;
            str2 = string.IsNullOrWhiteSpace(str2) ? string.Empty : str2;

            var words1 = str1.Replace(" ", string.Empty).Split(',');
            var words2 = str2.Replace(" ", string.Empty).Split(',');

            if (matchAll)
            {
                if (words1.Length != words2.Length)
                {
                    return false;
                }
                else
                {
                    // Remove duplicates
                    words1 = words1.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
                    words2 = words2.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

                    Array.Sort(words1, StringComparer.OrdinalIgnoreCase);
                    Array.Sort(words2, StringComparer.OrdinalIgnoreCase);

                    // Assuming comma seperated values do not have duplicates.
                    return words1.SequenceEqual(words2, StringComparer.OrdinalIgnoreCase);
                }
            }
            else
            {
                return words1.Any(w => words2.Contains(w, StringComparer.OrdinalIgnoreCase));
            }
        }

        private bool IsFeedbackApplicable(ChatMetaData metadata, ChatFeedback feedback)
        {
            Dictionary<string, string> dict1 = metadata?.ResourceSpecificInfo?.Count > 0 ? metadata.ResourceSpecificInfo : new Dictionary<string, string>();
            Dictionary<string, string> dict2 = feedback?.ResourceSpecificInfo?.Count > 0 ? feedback.ResourceSpecificInfo : new Dictionary<string, string>();

            // If metadata.ResourceSpecificInfo does not have any resourceSpecificInfo value, it is assumed that no filtering constraint is desired and the feedback will be evaluated as a match.
            foreach (var kvp in dict1)
            {
                if (dict2.TryGetValue(kvp.Key, out var value2))
                {
                    // AppKind property is the only property that we send today which is comma seperated.
                    // Strict comparision at the moment. App Kind match should have all app kinds
                    if (kvp.Value?.Contains(",") == true && value2?.Contains(",") == true)
                    {
                        if (!AreCommaSeparatedValuesEqual(
                            kvp.Value,
                            value2,
                            !(kvp.Key.Equals("Kind", StringComparison.OrdinalIgnoreCase) && metadata.Provider.Equals("Microsoft.Web", StringComparison.OrdinalIgnoreCase) && metadata.ResourceType.Equals("sites", StringComparison.OrdinalIgnoreCase))
                            ))
                        {
                            return false;
                        }
                    }
                    else
                    {
                        if (kvp.Value?.Equals(value2, StringComparison.OrdinalIgnoreCase) == false)
                        {
                            return false;
                        }
                    }
                }
                else
                {
                    if (kvp.Key.Equals("Kind", StringComparison.OrdinalIgnoreCase) && metadata.Provider.Equals("Microsoft.Web", StringComparison.OrdinalIgnoreCase) && metadata.ResourceType.Equals("sites", StringComparison.OrdinalIgnoreCase))
                    {
                        // If  kind is not present in feedback of a web app resource, then the feedback is shared across all app types and it should match.
                        return true;
                    }
                    else
                    {
                        return false; // Key is missing in feedback, it is not applicable
                    }
                }
            }

            return true;
        }
    }
}