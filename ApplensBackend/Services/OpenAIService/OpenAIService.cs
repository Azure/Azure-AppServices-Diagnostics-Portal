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
        public ChatCompletionsOptions ChatCompletionsOptionsToUseInChain { get; set; } = null;
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
        private Dictionary<string, AnalyticsKustoTableDetails> analyticsKustoTables = new Dictionary<string, AnalyticsKustoTableDetails>(StringComparer.OrdinalIgnoreCase);
        private string analyticsKustoSecondPrompt = string.Empty;
        private ConcurrentDictionary<string, ChatCompletionCustomHandler> customHandlerForChatCompletion = new ConcurrentDictionary<string, ChatCompletionCustomHandler>(StringComparer.OrdinalIgnoreCase);

        // Delegate gets chatCompletionOptions which will have the corresponding template file and past user messages already loaded.
        // It also gets the chatMessages and the chatMetaData in case the custom logic needs to prepare its independent set of messages.
        private delegate Task<OpenAIChainResponse> ChatCompletionCustomHandler(List<ChatMessage> chatMessages, ChatMetaData metadata, ChatCompletionsOptions chatCompletionsOptions, ILogger<OpenAIService> logger);

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

                // Initialize custom handlers for chat completion API. This allows for chaining GPT responses.
                customHandlerForChatCompletion["analyticskustocopilot"] = HandleAnalyticsKustoCopilot;
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

            ChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);

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

            return new ChatResponse(response);
        }

        /// <inheritdoc/>
        public async Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task>? onMessageStreamAsyncCallback = default, CancellationToken cancellationToken = default)
        {
            if (chatMessages == null || chatMessages.Count == 0)
            {
                return;
            }

            string finishReason = string.Empty;

            ChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);
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

                    await onMessageStreamAsyncCallback(new ChatStreamResponse(finishReason: "stop"));
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
                    await onMessageStreamAsyncCallback(new ChatStreamResponse(finishReason: finishReason));
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

        #region Delegate implementation for custom chat completion handlers
        private async Task<OpenAIChainResponse> HandleAnalyticsKustoCopilot(List<ChatMessage> chatMessages, ChatMetaData metadata, ChatCompletionsOptions chatCompletionsOptions, ILogger<OpenAIService> logger)
        {
            try
            {
                string latestUserQuestion = chatMessages.Last(m => m.Role == ChatRole.User).Content;
                string chainingQuestion = $"Which table(s) will help answer the following question? If more than one table is found, return a comma seperated list.{Environment.NewLine}{latestUserQuestion}";

                // Replace the users question with a synthethic intermediate question.
                chatCompletionsOptions.Messages.Remove(chatCompletionsOptions.Messages.Last(m => m.Role == ChatRole.User));
                chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, chainingQuestion));

                Response<ChatCompletions> intermediateResponse = await openAIClient.GetChatCompletionsAsync(openAIGPT4Model, chatCompletionsOptions);

                string tableNamesCSV = intermediateResponse?.Value?.Choices?.Count > 0 && !string.IsNullOrWhiteSpace(intermediateResponse.Value.Choices[0]?.Message?.Content)
                    ? intermediateResponse.Value.Choices[0].Message.Content : string.Empty;

                if (string.IsNullOrWhiteSpace(tableNamesCSV))
                {
                    return new OpenAIChainResponse()
                    {
                        ShortCircuitReason = "Unable to identify tables necessary to construct the query",
                        ChatResponseToUseInShortCircuit = new ChatResponse("Unable to identify related tables. Please help me learn, submit the expected query along with your question to Applens team."),
                        ChatCompletionsOptionsToUseInChain = null
                    };
                }

                #region Fetch details of relevent tables

                StringBuilder secondQuestion = new StringBuilder();
                foreach (string tableName in tableNamesCSV.Split(","))
                {
                    if (analyticsKustoTables.Count == 0)
                    {
                        string configString = await GetChatTemplateContent("analyticskustotableconfig");
                        JObject jObject = JObject.Parse(configString);
                        JArray tablesList = (jObject["Tables"] ?? new JObject()).ToObject<JArray>();
                        foreach (var element in tablesList)
                        {
                            if (!string.IsNullOrWhiteSpace((element["TableName"] ?? string.Empty).ToString()) && !string.IsNullOrWhiteSpace((element["SchemaWithNotes"] ?? string.Empty).ToString()))
                            {
                                analyticsKustoTables.Add(element["TableName"].ToString().Trim(),
                                    new AnalyticsKustoTableDetails()
                                    {
                                        TableName = element["TableName"].ToString().Trim(),
                                        Description = (element["Description"] ?? string.Empty).ToString(),
                                        SchemaWithNotes = (string)element["SchemaWithNotes"]
                                    }
                                 );
                            }
                        }
                    }

                    if (analyticsKustoTables.TryGetValue(tableName.Trim(), out AnalyticsKustoTableDetails tableDetails))
                    {
                        secondQuestion.AppendLine($"Table:{tableDetails.TableName}");
                        if (!string.IsNullOrWhiteSpace(tableDetails.Description))
                        {
                            secondQuestion.AppendLine($"Description:{tableDetails.Description}");
                        }

                        secondQuestion.AppendLine($"SchemaWithNotes:{tableDetails.SchemaWithNotes}");
                        secondQuestion.AppendLine();
                    }
                }

                #endregion

                if (secondQuestion.Length < 5)
                {
                    // We could not identify the table or the attempted question does not adhere to the rules set for the copilot. Terminate processing and return a response.
                    OpenAIChainResponse returnResponse = new OpenAIChainResponse()
                    {
                        ShortCircuitReason = "Unable to identify tables necessary to construct the query",
                        ChatResponseToUseInShortCircuit = new ChatResponse(tableNamesCSV),
                        ChatCompletionsOptionsToUseInChain = null
                    };

                    return returnResponse;
                }

                if (string.IsNullOrWhiteSpace(analyticsKustoSecondPrompt))
                {
                    analyticsKustoSecondPrompt = await GetChatTemplateContent("analyticskustocopilotsecondprompt");
                    JObject jObject = JObject.Parse(analyticsKustoSecondPrompt);
                    analyticsKustoSecondPrompt = (jObject["systemPrompt"] ?? string.Empty).ToString();
                }

                secondQuestion.AppendLine(analyticsKustoSecondPrompt);
                secondQuestion.AppendLine($"Note: The current timestamp is {DateTime.UtcNow.ToString("yyyy-MM-dd HH:MM:SS")} UTC");

                // Remove the original system prompt and replace it with the newly constructed system prompt.
                chatCompletionsOptions.Messages.RemoveAt(0);
                chatCompletionsOptions.Messages.Insert(0, new ChatMessage(ChatRole.System, secondQuestion.ToString()));

                // Remove the synthetic question that was added earlier and add the users question back.
                chatCompletionsOptions.Messages.Remove(chatCompletionsOptions.Messages.Last(m => m.Role == ChatRole.User));
                chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, latestUserQuestion));

                return new OpenAIChainResponse()
                {
                    ChatResponseToUseInShortCircuit = null,
                    ChatCompletionsOptionsToUseInChain = chatCompletionsOptions
                };
            }
            catch (Exception ex)
            {
                logger.LogError(ex.Message);
                throw;
            }
        }
        #endregion

        private async Task<ChatCompletionsOptions> PrepareChatCompletionOptions(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            var chatCompletionsOptions = new ChatCompletionsOptions()
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

                JObject jObject = JObject.Parse(chatTemplateContent);
                string systemPrompt = (jObject["systemPrompt"] ?? string.Empty).ToString();
                // replace <<CURRENT_DATETIME>> with the current UTC Date time
                systemPrompt = systemPrompt.Replace("<<CURRENT_DATETIME>>", DateTime.UtcNow.ToString() + "UTC");
                
                if (jObject["DocumentSearchSettings"] != null)
                {
                    try
                    {
                        var documentSearchSettings = jObject["DocumentSearchSettings"].ToObject<DocumentSearchSettings>();
                        var userQuery = chatMessages.Last().Content;
                        string documentContent = await PrepareDocumentContent(documentSearchSettings, userQuery);
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
                    catch (Exception ex)
                    {
                        //Do nothing and let the chat work as it is
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
    }
}