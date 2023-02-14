using Backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Net;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Backend.Controllers
{
    [Route("api/bing")]
    [Produces("application/json")]
    public class BingAPIController : Controller
    {
        private IBingSearchService _bingSearchService;
        private ILogger<BingAPIController> _logger;
        public BingAPIController(IBingSearchService bingSearchService, ILogger<BingAPIController> logger)
        {
            _bingSearchService = bingSearchService;
            _logger = logger;
        }

        public HttpResponseMessage SendBadRequest(string message)
        {
            return new HttpResponseMessage()
            {
                StatusCode = HttpStatusCode.BadRequest,
                Content = new StringContent(message)
            };
        }

        [HttpGet("search")]
        public async Task<IActionResult> BingSearch(string q, int count)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest("Query parameter 'q' should not be empty");
                }
                else if (!(count > 0 && count < 20))
                {
                    return BadRequest("Result count parameter should be within 1-20 range");
                }
                var result = await _bingSearchService.RunBingSearch(q, count);
                if (result.IsSuccessStatusCode)
                {
                    var response = await result.Content.ReadAsStringAsync();
                    return Ok(JsonConvert.DeserializeObject(response));
                }
                else
                {
                    var errorMessage = await result.Content.ReadAsStringAsync();
                    _logger.LogError($"BingAPICallError: {result.StatusCode} -- {errorMessage}");
                    return NotFound(errorMessage);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"BingAPICallException: {ex.ToString()}");
                return StatusCode(500);
            }

        }
    }
}
