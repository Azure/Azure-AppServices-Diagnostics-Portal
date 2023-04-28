using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Controllers
{
    [Route("api/usersetting")]
    [Produces("application/json")]
    [Authorize(Policy = "ApplensAccess")]
    public class UserSettingsController : Controller
    {
        private ICosmosDBUserSettingHandler _cosmosDBHandler;
        private readonly bool _isEnabled;

        public UserSettingsController(ICosmosDBUserSettingHandler cosmosDBUserSettingHandler, IConfiguration configuration)
        {
            _cosmosDBHandler = cosmosDBUserSettingHandler;
            _isEnabled = configuration.GetValue("UserSetting:Enabled", false);
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserInfo(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }
            UserSetting user = await _cosmosDBHandler.GetUserSetting(userId);
            if (user == null) return NotFound("");
            return Ok(user);
        }

        [HttpPost("{userId}/favoriteDetectors/{detectorId}")]
        public async Task<IActionResult> PatchFavoriteDetector(string userId, string detectorId, [FromBody] JToken body)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(detectorId))
            {
                return BadRequest("userId and detectorId cannot be empty");
            }
            var prop = body.ToObject<FavoriteDetectorProp>();
            var userSetting = await _cosmosDBHandler.AddFavoriteDetector(userId, detectorId, prop);
            return Ok(userSetting);
        }

        [HttpPost("{userId}/landingInfo")]
        public async Task<IActionResult> PatchLandingInfo(string userId, [FromBody] JToken body)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }
            var resources = body?["resources"]?.ToObject<List<RecentResource>>();
            var defaultServiceType = body?["defaultServiceType"]?.ToString();

            var userSetting = await _cosmosDBHandler.PatchLandingInfo(userId, resources, defaultServiceType);
            return Ok(userSetting);
        }

        [HttpPost("{userId}/userPanelSetting")]
        public async Task<IActionResult> PathchUserPanelSettings(string userId, [FromBody] JToken body)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }

            var theme = body?["theme"]?.ToString();
            var viewMode = body?["viewMode"]?.ToString();
            var expandAnalysisCheckCard = body?["expandAnalysisCheckCard"]?.ToString();
            var codeCompletion = body?["codeCompletion"]?.ToString() ?? "on";

            var userSetting = await _cosmosDBHandler.PatchUserPanelSetting(userId, theme, viewMode, expandAnalysisCheckCard, codeCompletion);
            return Ok(userSetting);
        }

        [HttpGet("{userId}/userChatGPTSetting")]
        public async Task<IActionResult> GetUserChatGPTInfo(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }
            UserSetting user = await _cosmosDBHandler.GetUserSetting(userId, true, true);
            if (user == null) return NotFound("");
            return Ok(user);
        }

        [HttpPost("{userId}/userChatGPTSetting")]
        public async Task<IActionResult> PathchUserChatGPTSettings(string userId, [FromBody] JToken body)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }

            var userSetting = await _cosmosDBHandler.PatchUserChatGPTSetting(userId, body);
            return Ok(userSetting);
        }


        [HttpPost]
        public async Task<IActionResult> CreateOrUpdateResources([FromBody] JToken body)
        {
            var userSetting = body.ToObject<UserSetting>();
            var updatedUserSetting = await _cosmosDBHandler.UpdateUserSetting(userSetting);
            return Ok(updatedUserSetting);
        }


        [HttpDelete("{userId}/favoriteDetectors/{detectorId}")]
        public async Task<IActionResult> RemoveFavoriteDetector(string userId, string detectorId)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(detectorId))
            {
                return BadRequest("userId and detectorId cannot be empty");
            }
            var userSetting = await _cosmosDBHandler.RemoveFavoriteDetector(userId, detectorId);
            return Ok(userSetting);
        }
    }
}
