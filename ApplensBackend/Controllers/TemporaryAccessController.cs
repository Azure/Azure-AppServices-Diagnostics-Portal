using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AppLensV3.Services;
using AppLensV3.Models;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Controllers
{
    [Route("temporaryAccess")]
    [Authorize(Policy = "DefaultAccess")]
    public class TemporaryAccessController : Controller
    {
        ICosmosDBHandlerBase<TemporaryAccessUser> _cosmosDBHandler;
        long temporaryAccessDurationInSeconds = 7 * 24 * 60 * 60;

        public TemporaryAccessController(ICosmosDBHandlerBase<TemporaryAccessUser> cosmosDBHandler, IConfiguration configuration)
        {
            _cosmosDBHandler = cosmosDBHandler;
            var accessDurationInDays = configuration["ApplensTemporaryAccess:AccessDurationInDays"];
            int temporaryAccessDays = 7;
            int.TryParse(accessDurationInDays.ToString(), out temporaryAccessDays);
            temporaryAccessDurationInSeconds = temporaryAccessDays * 24 * 60 * 60;
        }

        [HttpPost("requestAccess")]
        public async Task<IActionResult> RequestAccess()
        {
            string userId = null;
            var authorization = Request.Headers["Authorization"].ToString();
            string accessToken = authorization.Split(" ")[1];
            var token = new JwtSecurityToken(accessToken);
            object upn;
            if (token.Payload.TryGetValue("upn", out upn))
            {
                userId = upn.ToString();
                if (userId != null)
                {
                    var result = await _cosmosDBHandler.GetItemAsync(userId, "TemporaryAccessUser");
                    if (result == null)
                    {
                        TemporaryAccessUser newUser = new TemporaryAccessUser()
                        {
                            Id = userId,
                            AccessStartDate = DateTime.UtcNow,
                            PartitionKey = "TemporaryAccessUser"
                        };
                        await _cosmosDBHandler.CreateItemAsync(newUser);
                        return Ok("Temporary access approved!");
                    }
                    else
                    {
                        if ((long)DateTime.UtcNow.Subtract(result.AccessStartDate).TotalSeconds >= temporaryAccessDurationInSeconds)
                        {
                            return BadRequest("One-time temporary access already used! Please request for AppLens Access on MyAccess.");
                        }
                        else
                        {
                            return Ok("User already has temporary access to AppLens.");
                        }
                    }
                }
            }

            return BadRequest("Access token is missing user principal name.");
        }
    }
}
