using System;
using System.Collections.Generic;
using System.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// WorkflowUsersController.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Policy = "ApplensAccess")]
    public class WorkflowUsersController : ControllerBase
    {
        private readonly ICosmosDBWorkflowUsersHandler workflowUsersHandler;
        private readonly string[] allowedUsers;

        /// <summary>
        /// Initializes a new instance of the <see cref="WorkflowUsersController"/> class.
        /// </summary>
        /// <param name="cosmosDBWorkflowUsersHandler">Handler from DI.</param>
        /// <param name="configuration">Asp.net configuration object.</param>
        public WorkflowUsersController(ICosmosDBWorkflowUsersHandler cosmosDBWorkflowUsersHandler, IConfiguration configuration)
        {
            allowedUsers = configuration.GetValue("Workflow:Users", string.Empty).Split(';').Select(x => x.ToLower()).ToArray();
            workflowUsersHandler = cosmosDBWorkflowUsersHandler;
        }

        /// <summary>
        /// Get Workflow users.
        /// </summary>
        /// <returns>A <see cref="Task{TResult}"/> representing the result of the asynchronous operation.</returns>
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                if (!IsUserAllowed())
                {
                    return Unauthorized("User not allowed to call this method");
                }

                var userAliases = new List<string>();
                var users = await workflowUsersHandler.GetUsersAsync();
                if (users != null && users.Any())
                {
                    userAliases = users.Select(x => x.Alias.ToLower()).OrderBy(x => x).ToList();
                }

                return Ok(userAliases);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.ToString());
            }
        }

        /// <summary>
        /// Adds new users to the Workflow Users DB.
        /// </summary>
        /// <param name="userAlias">UserAlias of the user to add.</param>
        /// <returns>nothing.</returns>
        [HttpPost]
        public async Task<IActionResult> AddUser([FromBody] string userAlias)
        {
            //try
            //{
            //    if (string.IsNullOrWhiteSpace(userAlias))
            //    {
            //        return BadRequest("userAlias cannot be empty");
            //    }

            //    if (!IsUserAllowed())
            //    {
            //        return Unauthorized("User not allowed to call this method");
            //    }

            //    await workflowUsersHandler.AddUser(new UserAlias(userAlias));
            //    return Ok();
            //}
            //catch (Exception ex)
            //{
            //    return StatusCode(StatusCodes.Status500InternalServerError, ex.ToString());
            //}

            return new ObjectResult("The API is not supported until further notice.")
            {
                StatusCode = 415
            };
        }

        // For the time being, only allow users that are part of the app setting to add more users
        private bool IsUserAllowed()
        {
            string currentUser = GetCurrentUser();
            return allowedUsers.Contains(currentUser);
        }

        private string GetCurrentUser()
        {
            string authorization = HttpContext.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrWhiteSpace(authorization))
            {
                return string.Empty;
            }

            string accessToken = authorization.Split(" ")[1];
            var token = new JwtSecurityToken(accessToken);
            if (token.Payload.TryGetValue("upn", out object upn))
            {
                if (upn != null)
                {
                    return upn.ToString().Split('@')[0];
                }
            }

            return string.Empty;
        }
    }
}
