using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
        public UserSettingsController(ICosmosDBUserSettingHandler cosmosDBUserSettingHandler)
        {
            _cosmosDBHandler = cosmosDBUserSettingHandler;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserInfo(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                return BadRequest("userId cannot be empty");
            }
            UserSetting user = await _cosmosDBHandler.GetItemAsync(userId);
            if (user == null) return NotFound("");
            return Ok(user);
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrUpdateResources([FromBody] JToken body)
        {
            var userSetting = body.ToObject<UserSetting>();
            var updatedUserSetting = await _cosmosDBHandler.UpdateRecentResources(userSetting);
            return Ok(updatedUserSetting);
        }
    }
}
