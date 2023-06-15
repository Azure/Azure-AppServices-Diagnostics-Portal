using System;
using System.Linq;
using System.Net;
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

        public OpenAIController(IOpenAIService openAIService, ILogger<OpenAIController> logger, IConfiguration config, IHubContext<OpenAIChatCompletionHub> hubContext)
        {
            _logger = logger;
            _openAIService = openAIService;
            _configuration = config;
            _hubContext = hubContext;
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
                var response = await _openAIService.RunTextCompletion(completionModel, cachingEnabled);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadAsStringAsync();
                    return Ok(JsonConvert.DeserializeObject(result));
                }
                else
                {
                    _logger.LogError($"OpenAICallError: {response.StatusCode} {await response.Content.ReadAsStringAsync()}");
                    switch (response.StatusCode)
                    {
                        case HttpStatusCode.Unauthorized:
                        case HttpStatusCode.Forbidden:
                        case HttpStatusCode.NotFound:
                        case HttpStatusCode.InternalServerError:
                            return new StatusCodeResult(500);
                        case HttpStatusCode.BadRequest:
                            return BadRequest("Malformed request");
                        default:
                            return new StatusCodeResult((int)response.StatusCode);
                    }
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
                var chatCompletions = await _openAIService.RunChatCompletion(chatPayload.Messages.ToList(), chatPayload.MetaData);

                if (chatCompletions != null)
                {
                    return Ok(chatCompletions);
                }
                else
                {
                    _logger.LogError("OpenAIChatCompletionError: chatCompletions are null.");
                    return StatusCode(500, "chatCompletions are null");
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
