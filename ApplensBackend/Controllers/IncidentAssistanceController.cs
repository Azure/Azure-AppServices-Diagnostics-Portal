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
using System.IdentityModel.Tokens.Jwt;

namespace AppLensV3.Controllers
{
    [Route("api/icm/")]
    [Authorize(Policy = "ApplensAccess")]
    public class IncidentAssistanceController : Controller
    {
        private readonly IIncidentAssistanceService _incidentAssistanceService;

        public IncidentAssistanceController(IIncidentAssistanceService incidentAssistanceService)
        {
            _incidentAssistanceService = incidentAssistanceService;
        }

        private string GetUserId()
        {
            string authorization = Request.Headers["Authorization"].ToString();
            string accessToken = authorization.Split(" ")[1];
            var token = new JwtSecurityToken(accessToken);
            string upn = token.Payload.TryGetValue("upn", out var val) ? val.ToString() : null;
            if (upn != null)
            {
                string userId = upn.Split('@')[0];
                return userId;
            }
            else
            {
                return null;
            }
        }

        [HttpGet("isFeatureEnabled")]
        [HttpOptions("isFeatureEnabled")]
        public async Task<IActionResult> IsFeatureEnabled()
        {
            return Ok(await _incidentAssistanceService.IsEnabled());
        }

        [HttpGet("getIncident/{incidentId}")]
        [HttpOptions("getIncident/{incidentId}")]
        public async Task<IActionResult> GetIncident(string incidentId)
        {
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                return BadRequest("incidentId cannot be empty");
            }

            var response = await _incidentAssistanceService.GetIncidentInfo(incidentId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpPost("validateAndUpdateIncident")]
        [HttpOptions("validateAndUpdateIncident")]
        public async Task<IActionResult> ValidateAndUpdateIncident([FromBody] JToken body, string update)
        {
            string incidentId = null;
            if (body != null && body["IncidentId"] != null)
            {
                incidentId = body["IncidentId"].ToString();
            }
            if (string.IsNullOrWhiteSpace(incidentId))
            {
                return BadRequest("IncidentId cannot be empty");
            }

            var response = await _incidentAssistanceService.ValidateAndUpdateIncident(incidentId, body, update);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpGet("getOnboardedTeams")]
        [HttpOptions("getOnboardedTeams")]
        public async Task<IActionResult> GetOnboardedTeams()
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            var response = await _incidentAssistanceService.GetOnboardedTeams(userId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpGet("getTeamTemplate/{teamId}/{incidentType}")]
        [HttpOptions("getTeamTemplate/{teamId}/{incidentType}")]
        public async Task<IActionResult> GetTeamTemplate(string teamId, string incidentType)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            var response = await _incidentAssistanceService.GetTeamTemplate(teamId, incidentType, userId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpGet("getTeamIncidents/{teamId}/{incidentType}")]
        [HttpOptions("getTeamIncidents/{teamId}/{incidentType}")]
        public async Task<IActionResult> GetTopTeamIncidents(string teamId, string incidentType, int count)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            if (string.IsNullOrWhiteSpace(incidentType))
            {
                return BadRequest("incidentType cannot be empty");
            }
            switch (incidentType)
            {
                case "LSI":
                    incidentType = "LiveSite";
                    break;
                case "CRI":
                default:
                    incidentType = "CustomerReported";
                    break;
            }
            var response = await _incidentAssistanceService.GetTopIncidentsForTeam(teamId, incidentType, count > 0 ? count : 5);
            return StatusCode(200, response);
        }

        [HttpPost("updateTeamTemplate/{teamId}/{incidentType}")]
        [HttpOptions("updateTeamTemplate/{teamId}/{incidentType}")]
        public async Task<IActionResult> UpdateTeamTemplate([FromBody] JToken body, string teamId, string incidentType)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            if (string.IsNullOrWhiteSpace(teamId))
            {
                return BadRequest("teamId cannot be empty");
            }
            if (string.IsNullOrWhiteSpace(incidentType))
            {
                return BadRequest("incidentType cannot be empty");
            }
            if (body != null)
            {
                var response = await _incidentAssistanceService.UpdateTeamTemplate(teamId, incidentType, body, userId);
                var responseTask = response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, await responseTask);
            }
            else
            {
                return BadRequest("Request Body cannot be empty");
            }
        }

        [HttpPost("testTemplateWithIncident")]
        [HttpOptions("testTemplateWithIncident")]
        public async Task<IActionResult> TestTemplateWithIncident([FromBody] JToken body)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            if (body != null)
            {
                var response = await _incidentAssistanceService.TestTemplateWithIncident(body, userId);
                var responseTask = response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, await responseTask);
            }
            else
            {
                return BadRequest("Request Body cannot be empty");
            }
        }

        [HttpGet("getTeamTemplateAuthors/{teamId}/{incidentType}")]
        [HttpOptions("getTeamTemplateAuthors/{teamId}/{incidentType}")]
        public async Task<IActionResult> GetTeamTemplateAuthors(string teamId, string incidentType)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            var response = await _incidentAssistanceService.GetTeamTemplateAuthors(teamId, incidentType, userId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }

        [HttpPost("updateTeamTemplateAuthors/{teamId}/{incidentType}")]
        [HttpOptions("updateTeamTemplateAuthors/{teamId}/{incidentType}")]
        public async Task<IActionResult> UpdateTeamTemplateAuthors([FromBody] JToken body, string teamId, string incidentType)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            if (string.IsNullOrWhiteSpace(teamId))
            {
                return BadRequest("teamId cannot be empty");
            }
            if (string.IsNullOrWhiteSpace(incidentType))
            {
                return BadRequest("incidentType cannot be empty");
            }
            if (body != null)
            {
                var response = await _incidentAssistanceService.UpdateTeamTemplateAuthors(teamId, incidentType, body, userId);
                var responseTask = response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, await responseTask);
            }
            else
            {
                return BadRequest("Request Body cannot be empty");
            }
        }

        [HttpGet("getAvailableValidations/{teamId}/{incidentType}")]
        [HttpOptions("getAvailableValidations/{teamId}/{incidentType}")]
        public async Task<IActionResult> GetAvailableValidations(string teamId, string incidentType)
        {
            string userId = GetUserId();
            if (string.IsNullOrWhiteSpace(userId))
            {
                return StatusCode(401, "Invalid user. Does not contain valid upn.");
            }
            var response = await _incidentAssistanceService.GetAvailableValidations(teamId, incidentType, userId);
            var responseTask = response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, await responseTask);
        }
    }
}
