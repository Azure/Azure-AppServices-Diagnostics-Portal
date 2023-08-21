using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using StackExchange.Redis;

namespace AppLensV3.Hubs
{
    /// <summary>
    /// Open AI Chat Completion Hub Class.
    /// </summary>
    [Authorize(Policy = "ApplensAccess")]
    public class OpenAIChatCompletionHub : Hub
    {
        private IOpenAIRedisService openAIRedisService;
        private IOpenAIService openAIService;
        private ILogger<OpenAIChatCompletionHub> logger;
        private string redisKeyPrefix;

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIChatCompletionHub"/> class.
        /// </summary>
        /// <param name="openAIService">Open AI service instance.</param>
        /// <param name="openAIRedisService">Redis service instance.</param>
        /// <param name="logger">Logger instance.</param>
        public OpenAIChatCompletionHub(IOpenAIService openAIService, IOpenAIRedisService openAIRedisService, ILogger<OpenAIChatCompletionHub> logger)
        {
            this.openAIService = openAIService;
            this.logger = logger;
            this.openAIRedisService = openAIRedisService;
            this.redisKeyPrefix = "ChatHub-MessageState-";
        }

        /// <summary>
        /// Send Message.
        /// </summary>
        /// <param name="chatPayloadStr">chat payload.</param>
        /// <returns>A <see cref="Task"/> representing the result of the asynchronous operation.</returns>
        public async Task SendMessage(string chatPayloadStr)
        {
            string redisKey = string.Empty;
            try
            {
                if (chatPayloadStr == null)
                {
                    return;
                }

                var chatPayload = JsonConvert.DeserializeObject<RequestChatPayload>(chatPayloadStr);
                if (chatPayload == null)
                {
                    return;
                }

                redisKey = $"{redisKeyPrefix}{chatPayload.MetaData.MessageId}";

                _ = await this.openAIRedisService.SetKey(redisKey, "inprogress", TimeSpan.FromMinutes(5));

                Func<ChatStreamResponse, Task> onMessageStreamAsyncCallback = async (response) =>
                {
                    await Clients.Caller.SendAsync("MessageReceived", JsonConvert.SerializeObject(response));
                };

                await openAIService.StreamChatCompletion(chatPayload.Messages.ToList(), chatPayload.MetaData, onMessageStreamAsyncCallback);
            }
            catch (Exception ex)
            {
                this.logger.LogError(ex.ToString());
                await Clients.Caller.SendAsync("MessageCancelled", ex.Message);
            }
            finally
            {
                if (!string.IsNullOrWhiteSpace(redisKey))
                {
                    _ = await this.openAIRedisService.DeleteKey(redisKey);
                }
            }
        }

        /// <summary>
        /// Cancel message.
        /// </summary>
        /// <param name="messageId">Message Id.</param>
        /// <returns>Task.</returns>
        public async Task CancelMessage(string messageId)
        {
            if (string.IsNullOrWhiteSpace(messageId))
            {
                return;
            }

            string redisKey = $"{redisKeyPrefix}{messageId}";
            _ = await this.openAIRedisService.SetKey(redisKey, "cancelled");
        }
    }
}