using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3
{
    [Route("api")]
    [Authorize(Policy = "ApplensAccess")]
    public class CommsController : Controller
    {
        private readonly IOutageCommunicationService _outageService;

        public CommsController(IOutageCommunicationService outageService)
        {
            _outageService = outageService;
        }

        [HttpGet("comms/{subscriptionId}")]
        [HttpOptions("comms/{subscriptionId}")]
        public async Task<IActionResult> Invoke(string subscriptionId, string startTime = null, string endTime = null, string impactedService = null, bool checkForEmergingIssues = false)
        {
            if (string.IsNullOrWhiteSpace(subscriptionId) || !Guid.TryParse(subscriptionId, out _))
            {
                return BadRequest("subscriptionId cannot be empty or invalid guid");
            }

            if (!DateTimeHelper.PrepareStartEndTimeWithTimeGrain(startTime, endTime, string.Empty, 30, out DateTime startTimeUtc, out DateTime endTimeUtc, out TimeSpan timeGrainTimeSpan, out string errorMessage))
            {
                return BadRequest(errorMessage);
            }

            List<Communication> comms = await _outageService.GetCommunicationsAsync(subscriptionId, startTimeUtc, endTimeUtc, checkForEmergingIssues, impactedService);
            return Ok(comms);
        }
    }
}
