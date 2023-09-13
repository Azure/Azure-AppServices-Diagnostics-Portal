using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Controllers
{
    [Route("api")]
    [Authorize(Policy = "ApplensAccess")]
    public class SupportTopicController: ControllerBase
    {
        private readonly ISupportTopicService _supportTopicService;

        public SupportTopicController(ISupportTopicService supportTopicService)
        {
            _supportTopicService = supportTopicService;
        }

        [HttpGet("supporttopics/{pesId}")]
        [HttpOptions("supporttopics/{pesId}")]
        public async Task<IActionResult> GetSupportTopics(string pesId)
        {
            if (string.IsNullOrWhiteSpace(pesId) || !Int32.TryParse(pesId.Trim(), out int parsedProductId))
            {
                return BadRequest("Invalid Product Id");
            }

            List<SupportTopic> supportTopicsList = await _supportTopicService.GetSupportTopicsAsync(pesId);
            return Ok(supportTopicsList);
        }
    }
}
