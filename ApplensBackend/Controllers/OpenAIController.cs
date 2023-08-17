using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Hubs;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace AppLensV3.Controllers
{
    [Route("api/openai")]
    [Produces("application/json")]
    [Authorize(Policy = "ApplensAccess")]
    public class OpenAIController : Controller
    {
        private IOpenAIService _openAIService;
        private ILogger<OpenAIController> _logger;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<OpenAIChatCompletionHub> _hubContext;
        private readonly ICosmosDBOpenAIChatFeedbackHandler _chatFeedbackCosmosDBHandler;
        private CopilotsConfiguration _copilotsconfiguration;

        public OpenAIController(IOpenAIService openAIService, ILogger<OpenAIController> logger, IConfiguration config, IHubContext<OpenAIChatCompletionHub> hubContext, ICosmosDBOpenAIChatFeedbackHandler chatFeedbackCosmosDBHandler, IOptions<CopilotsConfiguration> copilotsConfiguration)
        {
            _logger = logger;
            _openAIService = openAIService;
            _configuration = config;
            _hubContext = hubContext;
            _chatFeedbackCosmosDBHandler = chatFeedbackCosmosDBHandler;
            _copilotsconfiguration = copilotsConfiguration.Value;
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> IsEnabled()
        {
            return Ok(_openAIService.IsEnabled());
        }

        [HttpPost("runTextCompletion")]
        public async Task<IActionResult> RunTextCompletion([FromBody] CompletionModel completionModel)
        {
            if (!_openAIService.IsEnabled())
            {
                return StatusCode(422, "Text Completion Feature is currently disabled.");
            }

            if (completionModel == null || completionModel.Payload == null)
            {
                return BadRequest("Please provide completion payload in the request body");
            }

            try
            {
                // Check if client has requested cache to be disabled
                bool cachingEnabled = bool.TryParse(GetHeaderOrDefault(Request.Headers, HeaderConstants.OpenAICacheHeader, true.ToString()), out var cacheHeader) ? cacheHeader : true;
                var chatResponse = await _openAIService.RunTextCompletion(completionModel, cachingEnabled);

                return Ok(chatResponse);
            }
            catch (HttpRequestException reqEx)
            {
                _logger.LogError($"OpenAICallError: {reqEx.StatusCode} {reqEx.Message}");
                switch (reqEx.StatusCode)
                {
                    case HttpStatusCode.Unauthorized:
                    case HttpStatusCode.Forbidden:
                    case HttpStatusCode.NotFound:
                    case HttpStatusCode.InternalServerError:
                        return new StatusCodeResult(500);
                    case HttpStatusCode.BadRequest:
                        return BadRequest("Malformed request");
                    default:
                        return new StatusCodeResult((int)reqEx.StatusCode);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.ToString());
                return StatusCode(500, "An error occurred while processing the text completion request.");
            }
        }

        [HttpPost("runChatCompletion")]
        public async Task<IActionResult> RunChatCompletion([FromBody] RequestChatPayload chatPayload)
        {
            if (!_openAIService.IsEnabled())
            {
                return StatusCode(422, "Chat Completion Feature is currently disabled.");
            }

            if (chatPayload == null)
            {
                return BadRequest("Request body cannot be null or empty");
            }

            if (chatPayload.Messages == null || chatPayload.Messages.Length == 0)
            {
                return BadRequest("Please provide list of chat messages in the request body");
            }

            try
            {
                var chatResponse = await _openAIService.RunChatCompletion(chatPayload.Messages.ToList(), chatPayload.MetaData);

                if (chatResponse != null)
                {
                    return Ok(chatResponse);
                }
                else
                {
                    _logger.LogError("OpenAIChatCompletionError: chatResponse is null.");
                    return StatusCode(500, "chatResponse is null");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"OpenAIChatCompletionError: {ex}");
                return StatusCode(500, "An error occurred while processing the chat completion request.");
            }
        }

        [HttpGet("detectorcopilot/enabled")]
        public async Task<IActionResult> IsDetectorCopilotEnabled()
        {
            try
            {
                if (!bool.TryParse(_configuration["DetectorCopilot:Enabled"], out bool isCopilotEnabled))
                {
                    isCopilotEnabled = false;
                }

                var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
                var allowedUsers = _configuration["DetectorCopilot:AllowedUserAliases"].Trim()
                    .Split(new string[] { "," }, StringSplitOptions.RemoveEmptyEntries);
                isCopilotEnabled &= allowedUsers.Length == 0 || allowedUsers.Any(p => p.Trim().ToLower().Equals(userAlias));

                return Ok(isCopilotEnabled);
            }
            catch (Exception ex)
            {
                _logger.LogError($"IsDetectorCopilotEnabled() Failed. Exception : {ex}");
                return Ok(false);
            }
        }

        [HttpGet("isCopilotEnabled/{resourceProviderName}/{resourceTypeName}/{chatIdentifier}")]
        public async Task<IActionResult> IsCopilotEnabled(string resourceProviderName, string resourceTypeName, string chatIdentifier)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(chatIdentifier) && !string.IsNullOrWhiteSpace(resourceProviderName) && !string.IsNullOrWhiteSpace(resourceTypeName))
                {
                    var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
                    return Ok(_copilotsconfiguration.IsUserAllowedAccess(chatIdentifier, userAlias, resourceProviderName, resourceTypeName));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"IsCopilotEnabled() Failed. Exception : {ex}");
            }

            return Ok(false);
        }

        [HttpGet("isFeedbackSubmissionEnabled/{resourceProviderName}/{resourceTypeName}/{chatIdentifier}")]
        public async Task<IActionResult> IsFeedbackSubmissionEnabled(string resourceProviderName, string resourceTypeName, string chatIdentifier)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(chatIdentifier) && !string.IsNullOrWhiteSpace(resourceProviderName) && !string.IsNullOrWhiteSpace(resourceTypeName))
                {
                    var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
                    return Ok(_copilotsconfiguration.IsUserAllowedToSubmitFeedback(chatIdentifier, userAlias, resourceProviderName, resourceTypeName));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"IsFeedbackSubmissionEnabled() Failed. Exception : {ex}");
            }

            return Ok(false);
        }

        [HttpPost("saveChatFeedback")]
        [HttpOptions("saveChatFeedback")]
        public async Task<IActionResult> SaveChatFeedback([FromBody] ChatFeedback feedbackPayload)
        {
            var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
            if (feedbackPayload.SubmittedBy?.Equals(userAlias, StringComparison.OrdinalIgnoreCase) == false)
            {
                _logger.LogWarning($"Feedback submittedBy and logged-in user are different. {feedbackPayload.SubmittedBy} vs {userAlias}");
                return BadRequest("Feedback submission prohibited for user.");
            }

            if (_copilotsconfiguration.IsUserAllowedToSubmitFeedback(feedbackPayload.ChatIdentifier, userAlias, feedbackPayload.Provider, feedbackPayload.ResourceType))
            {
                return Ok(await _chatFeedbackCosmosDBHandler.SaveFeedback(feedbackPayload));
            }
            else
            {
                return Unauthorized("Feedback submission is not allowed for user.");
            }
        }

        [HttpPost("getRelatedFeedbackListFromChatHistory")]
        [HttpOptions("getRelatedFeedbackListFromChatHistory")]
        public async Task<IActionResult> GetRelatedFeedbackListFromChatHistory([FromBody] RequestChatPayload chatPayload)
        {
            var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
            if (_copilotsconfiguration.IsUserAllowedToSubmitFeedback(chatPayload?.MetaData?.ChatIdentifier, userAlias, chatPayload?.MetaData?.Provider, chatPayload?.MetaData?.ResourceType))
            {
                return Ok(await _openAIService.GetChatFeedbackRaw(chatPayload.MetaData, chatPayload.Messages.ToList()));
            }
            else
            {
                return Unauthorized("Feedback retrieval is not allowed for user.");
            }
        }

        [HttpPost("purgeFeedbackList")]
        [HttpOptions("purgeFeedbackList")]
        public async Task<IActionResult> PurgeFeedbackList([FromBody] ChatPurgeModel feedbackPurgeModel)
        {
            if (feedbackPurgeModel.FeedbackIds?.Count < 1)
            {
                return Ok(new Tuple<bool, List<string>>(true, new List<string>()));
            }

            var userAlias = Utilities.GetUserIdFromToken(Request.Headers.Authorization).Split(new char[] { '@' }).FirstOrDefault();
            if (!_copilotsconfiguration.IsUserAllowedToSubmitFeedback(feedbackPurgeModel.ChatIdentifier, userAlias, feedbackPurgeModel.Provider, feedbackPurgeModel.ResourceType))
            {
                return Unauthorized("User not allowed to delete feedback");
            }

            if (string.IsNullOrWhiteSpace(feedbackPurgeModel.ChatIdentifier) || string.IsNullOrWhiteSpace(feedbackPurgeModel.Provider) || string.IsNullOrWhiteSpace(feedbackPurgeModel.ResourceType))
            {
                return BadRequest("Missing required parameters.");
            }

            return Ok(await _chatFeedbackCosmosDBHandler.DeleteFeedbacks(feedbackPurgeModel.ChatIdentifier, feedbackPurgeModel.Provider, feedbackPurgeModel.ResourceType, feedbackPurgeModel.FeedbackIds));
        }

        private static string GetHeaderOrDefault(IHeaderDictionary headers, string headerName, string defaultValue = "")
        {
            if (headers == null || headerName == null)
            {
                return defaultValue;
            }

            if (headers.TryGetValue(headerName, out var outValue))
            {
                return outValue;
            }

            return defaultValue;
        }
    }
}
