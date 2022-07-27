using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Backend.Services;
using Backend.Helpers;

namespace Backend.Controllers
{
    [Produces("application/json")]
    [Route("api/appinsights")]
    public class AppInsightsController : Controller
    {
        private readonly IAppInsightsService _appInsightsService;
        private readonly IEncryptionService _encryptionService;

        public AppInsightsController(IEncryptionService encryptionService, IAppInsightsService appInsightsService)
        {
            _encryptionService = encryptionService;
            _appInsightsService = appInsightsService;
        }

        [HttpGet("encryptkey")]
        [HttpOptions("encryptkey")]
        public IActionResult EncryptKey()
        {
            if (!Utility.TryGetHeaderValue(Request.Headers, "appinsights-key", out string appInsightsKey))
            {
                return BadRequest("Missing appinsights-key header");
            }

            var encryptedKey = _encryptionService.EncryptString(appInsightsKey);
            return Ok(encryptedKey);
        }

        [HttpGet("validate")]
        [HttpOptions("validate")]
        public async Task<IActionResult> Validate()
        {
            if (!Utility.TryGetHeaderValue(Request.Headers, "appinsights-app-id", out string appInsightsAppId))
            {
                return BadRequest("Missing appinsights-app-id");
            }

            if (!Utility.TryGetHeaderValue(Request.Headers, "appinsights-encryptedkey", out string encryptedKey))
            {
                return BadRequest("Missing authorization header");
            }

            try
            {
                string siteHostName = string.Empty;
                if (Request.Host.HasValue)
                {
                    siteHostName = Request.Host.Value;
                }

                var appInsightsEnabled = await _appInsightsService.Validate(appInsightsAppId, encryptedKey, siteHostName);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

            return Ok(true);
        }
    }
}