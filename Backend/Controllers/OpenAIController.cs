using CommonLibrary.Models;
using CommonLibrary.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Net;
using System;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Authorization;

namespace Backend.Controllers
{
    [Route("api/copilot")]
    [Produces("application/json")]
    [Authorize(AuthenticationSchemes = "ArmAuthentication")]
    public class OpenAIController : Controller
    {
        private IOpenAIService _openAIService;
        private ILogger<OpenAIController> _logger;
        private const string OpenAICacheHeader = "x-ms-openai-cache";
        private OpenAIServiceConfiguration _openAIServiceConfiguration;
        private readonly IConfiguration _configuration;
        private readonly DocsCopilotConfiguration _docsCopilotConfiguration;
        public OpenAIController(IConfiguration config, IOpenAIService openAIService, ILogger<OpenAIController> logger, OpenAIServiceConfiguration openAIServiceConfiguration)
        {
            _configuration = config;
            _docsCopilotConfiguration = config.GetSection("DocsCopilot").Get<DocsCopilotConfiguration>();
            _logger = logger;
            _openAIService = openAIService;
            _openAIServiceConfiguration = openAIServiceConfiguration;
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> IsEnabled()
        {
            return Ok(_openAIService.IsEnabled());
        }

        [HttpGet("docscopilot/enabled")]
        public async Task<IActionResult> IsDocsCopilotEnabled()
        {
            return Ok(_docsCopilotConfiguration.Enabled);
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
                bool cachingEnabled = bool.TryParse(GetHeaderOrDefault(Request.Headers, OpenAICacheHeader, true.ToString()), out var cacheHeader) ? cacheHeader : true;
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
