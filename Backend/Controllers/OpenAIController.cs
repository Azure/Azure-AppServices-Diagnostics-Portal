using CommonLibrary.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Net;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/openai")]
    [Produces("application/json")]
    public class OpenAIController : Controller
    {
        private IOpenAIService _openAIService;
        private ILogger<OpenAIController> _logger;
        private const string OpenAICacheHeader = "x-ms-openai-cache";
        public OpenAIController(IOpenAIService openAIService, ILogger<OpenAIController> logger)
        {
            _logger = logger;
            _openAIService = openAIService;
        }

        [HttpGet("enabled")]
        public async Task<IActionResult> IsEnabled()
        {
            return Ok(_openAIService.IsEnabled());
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
