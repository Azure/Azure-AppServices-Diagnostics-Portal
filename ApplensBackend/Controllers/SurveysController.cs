using System;
using System.Threading.Tasks;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AppLensV3.Services;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Microsoft.Extensions.Caching.Memory;

namespace AppLensV3.Controllers
{
    [Route("api/surveys/")]
    [Authorize(Policy = "ApplensAccess")]
    public class SurveysController : Controller
    {
        private readonly ISurveysService _surveysService;

        public SurveysController(ISurveysService surveysService)
        {
            _surveysService = surveysService;
        }

        [HttpGet("isFeatureEnabled")]
        [HttpOptions("isFeatureEnabled")]
        public async Task<IActionResult> IsFeatureEnabled()
        {
            return Ok(await _surveysService.IsEnabled());
        }

        [HttpGet("getSurvey/{caseId}")]
        [HttpOptions("getSurvey/{caseId}")]
        public async Task<IActionResult> GetSurvey(string caseId)
        {
            if (string.IsNullOrWhiteSpace(caseId))
            {
                return BadRequest("caseId cannot be empty");
            }

            var response = await _surveysService.GetSurveyInfo(caseId);
            return StatusCode(200, response);
        }

        [HttpPost("submitSurvey")]
        [HttpOptions("submitSurvey")]
        public async Task<IActionResult> SubmitSurvey([FromBody] JToken body)
        {
            string caseId = null;
            if (body != null && body["caseId"] != null)
            {
                caseId = body["caseId"].ToString();
            }
            if (string.IsNullOrWhiteSpace(caseId))
            {
                return BadRequest("caseId cannot be empty");
            }

            var response = await _surveysService.SubmitSurveyResponse(caseId, body);
            return StatusCode(204, response);
        }
    }
}
