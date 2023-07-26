using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace AppLensV3.Authorization
{
    /// <summary>
    /// Security Group Configuration.
    /// </summary>
    public class SecurityGroupConfig
    {
        /// <summary>
        /// Gets or sets Name of Security Group.
        /// </summary>
        public string GroupName { get; set; }

        /// <summary>
        /// Gets or sets Object Id of Security Group.
        /// </summary>
        public string GroupId { get; set; }
    }

    /// <summary>
    /// Security Group Requirement to be met.
    /// </summary>
    class SecurityGroupRequirement : IAuthorizationRequirement
    {
        public SecurityGroupRequirement(string securityGroupName, string securityGroupObjectId)
        {
            SecurityGroupName = securityGroupName;
            SecurityGroupObjectId = securityGroupObjectId;
        }

        public string SecurityGroupName { get; }

        public string SecurityGroupObjectId { get; }
    }

    class SecurityGroupHandlerNationalCloud : AuthorizationHandler<SecurityGroupRequirement>
    {
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SecurityGroupRequirement requirement)
        {
            // Not required in national cloud, so succeed the context always
            context.Succeed(requirement);
            return;
        }
    }

    class SecurityGroupHandlerLocalDevelopment : AuthorizationHandler<SecurityGroupRequirement>
    {
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SecurityGroupRequirement requirement)
        {
            //Not required in local development, succeed the context always
            context.Succeed(requirement);
            return;
        }
    }

    class DefaultAuthorizationRequirement : IAuthorizationRequirement { }

    class DefaultAuthorizationHandler : AuthorizationHandler<DefaultAuthorizationRequirement>
    {
        private readonly ILogger<DefaultAuthorizationHandler> _logger;
        private readonly IConfiguration config;
        private IHttpContextAccessor _httpContextAccessor = null;
        public DefaultAuthorizationHandler(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, ILogger<DefaultAuthorizationHandler> logger)
        {
            _logger = logger;
            _httpContextAccessor = httpContextAccessor;
            config = configuration;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, DefaultAuthorizationRequirement requirement)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            bool isAppIdAllowed = false;
            string appId = null;
            try
            {
                string authorization = httpContext.Request.Headers["Authorization"].ToString();
                string accessToken = authorization.Split(" ")[1];
                appId = AuthorizationHandlerUtilities.ExtractFromToken<string>(accessToken, "aud");

                var allowedAppIds = config["AzureAd:AllowedAppId"].Split(',');
                isAppIdAllowed = AuthorizationHandlerUtilities.ValidateAppId(appId, allowedAppIds, config.IsPublicAzure());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception occurred while checking user authorization status in DefaultAuthorizationHandler.AppId : {appId}");
                isAppIdAllowed = false;
            }

            if (isAppIdAllowed)
            {

                context.Succeed(requirement);
                return;
            }

            var filterContext = context.Resource as AuthorizationFilterContext;
            var response = filterContext?.HttpContext.Response;
            response?.OnStarting(async () =>
            {
                filterContext.HttpContext.Response.StatusCode = 403;
                byte[] message = Encoding.ASCII.GetBytes($"AppId is not allowed, {appId}");
                await response.Body.WriteAsync(message, 0, message.Length);
            });

            _logger.LogInformation($"AppId is not allowed, {appId}");
            context.Fail();
            return;
        }
    }

    class CachedUser
    {
        public DateTime UserSince { get; set; }
        public long ts { get; set; }
        public CachedUser(DateTime userSince, long timestamp)
        {
            this.ts = timestamp;
            this.UserSince = userSince;
        }
    }

    /// <summary>
    /// Security Group Authorization Handler.
    /// </summary>
    class SecurityGroupHandler : AuthorizationHandler<SecurityGroupRequirement>
    {
        private readonly int loggedInUserCacheClearIntervalInMs = 60 * 60 * 1000; // 1 hour
        private readonly int loggedInUserExpiryIntervalInSeconds = 6 * 60 * 60; // 6 hours
        private readonly ILogger<SecurityGroupHandler> _logger;
        private readonly IConfiguration config;
        private ConcurrentDictionary<string, CachedUser> loggedInUsersCache;

        public SecurityGroupHandler(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, ILogger<SecurityGroupHandler> logger)
        {
            _logger = logger;
            loggedInUsersCache = new ConcurrentDictionary<string, CachedUser>();
            var applensAccess = new SecurityGroupConfig();
            configuration.Bind("ApplensAccess", applensAccess);

            ClearLoggedInUserCache();
            _httpContextAccessor = httpContextAccessor;
            config = configuration;
        }

        private IHttpContextAccessor _httpContextAccessor = null;

        /// <summary>
        /// Task to clear expired users from cache at regular interval.
        /// </summary>
        /// <returns>Task.</returns>
        private async Task ClearLoggedInUserCache()
        {
            while (true)
            {
                _logger.LogInformation($"Clearing LoggedInUserCache to remove entries older than {loggedInUserExpiryIntervalInSeconds} seconds.");
                long now = (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
                foreach (KeyValuePair<string, CachedUser> user in loggedInUsersCache)
                {
                    if ((now - user.Value.ts) > loggedInUserExpiryIntervalInSeconds)
                    {
                        // Pop out user from logged in users list
                        loggedInUsersCache.TryRemove(user);
                    }
                }

                await Task.Delay(loggedInUserCacheClearIntervalInMs);
            }
        }

        /// <summary>
        /// Adds user to cached dictionary.
        /// </summary>
        /// <param name="userId">userId.</param>
        /// <param name="userSince">userSince.</param>
        private void AddUserToCache(string userId, DateTime userSince)
        {
            CachedUser user;
            long ts = (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
            if (loggedInUsersCache.TryGetValue(userId, out user))
            {
                loggedInUsersCache[userId].ts = ts;
            }
            else
            {
                loggedInUsersCache.TryAdd(userId, new CachedUser(userSince, ts));
            }
        }

        /// <summary>
        /// Checks cached dictionary to find if user exists.
        /// </summary>
        /// <param name="userId">userId.</param>
        /// <returns>boolean value.</returns>
        private bool IsUserInCache(string userId)
        {
            CachedUser user;
            if (loggedInUsersCache.TryGetValue(userId, out user))
            {
                return true;
            }

            return false;
        }

        /// <summary>
        /// Checks if a user is part of a security group
        /// </summary>
        /// <param name="userId">UserId.</param>
        /// <param name="securityGroupObjectId">Security Group Object Id.</param>
        /// <returns>Boolean.</returns>
        private async Task<bool> CheckSecurityGroupMembership(string userId, string securityGroupObjectId)
        {
            bool isUserPartOfSecurityGroup = await Utilities.CheckUserGroupMembership(userId, securityGroupObjectId);
            if (isUserPartOfSecurityGroup)
            {
                AddUserToCache(userId, DateTime.UtcNow);
                return true;
            }

            return false;
        }

        /// <summary>
        /// Handles authorization and checks if required policies are met.
        /// </summary>
        /// <param name="context">context.</param>
        /// <param name="requirement">requirement.</param>
        /// <returns>Authorization Status.</returns>
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SecurityGroupRequirement requirement)
        {
            HttpContext httpContext = _httpContextAccessor.HttpContext;
            bool isMember = false;
            bool isAppIdAllowed = false;
            string userId = null;
            string appId = null;
            try
            {
                string authorization = httpContext.Request.Headers["Authorization"].ToString();
                string accessToken = authorization.Split(" ")[1];
                //var token = new JwtSecurityToken(accessToken);
                //object upn;
                //if (token.Payload.TryGetValue("upn", out upn))
                //{
                //    userId = upn.ToString();
                //    DateTime userSince;
                //    if (userId != null)
                //    {
                //        if (IsUserInCache(userId))
                //        {
                //            isMember = true;
                //        }
                //        else
                //        {
                //            isMember = await CheckSecurityGroupMembership(userId, requirement.SecurityGroupObjectId);
                //        }
                //    }
                //}
                userId = AuthorizationHandlerUtilities.ExtractFromToken<string>(accessToken, "upn");
                appId = AuthorizationHandlerUtilities.ExtractFromToken<string>(accessToken, "aud");

                var allowedAppIds = config["AzureAd:AllowedAppId"].Split(',');
                isMember = await ValidateUserId(userId, requirement.SecurityGroupObjectId);
                isAppIdAllowed = AuthorizationHandlerUtilities.ValidateAppId(appId, allowedAppIds, config.IsPublicAzure());
            }
            catch (Exception ex)
            {
                _logger.LogError($"Exception occurred while checking user authorization status in SecurityGroupHandler. userId: {userId}, appId: {appId}. Exception: {ex.ToString()}");
                isMember = false;
                isAppIdAllowed = false;
            }

            if (isMember && isAppIdAllowed)
            {
                context.Succeed(requirement);
                return;
            }



            string responseMessage = string.Empty;
            if (!isMember)
            {
                responseMessage = responseMessage + $"User is not an authorized member of {requirement.SecurityGroupName} group.";
            }

            if (!isAppIdAllowed)
            {
                responseMessage = responseMessage + $"AppId is not allowed {appId}";
            }

            var filterContext = context.Resource as AuthorizationFilterContext;
            var response = filterContext?.HttpContext.Response;

            response?.OnStarting(async () =>
            {
                filterContext.HttpContext.Response.StatusCode = 403;
                byte[] message = Encoding.ASCII.GetBytes(responseMessage);
                await response.Body.WriteAsync(message, 0, message.Length);
            });

            string logMessage = string.Empty;
            if (!isMember)
            {
                logMessage = logMessage + $"Unauthorized User, {userId}.";
            }

            if (!isAppIdAllowed)
            {
                logMessage = logMessage + $"AppId not allowed, {appId}.";
            }

            _logger.LogInformation(logMessage);
            context.Fail();
            return;
        }



        private async Task<bool> ValidateUserId(string userId, string securityGroupObjectId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                throw new ArgumentNullException(nameof(userId));
            }

            bool isMember = false;
            if (IsUserInCache(userId))
            {
                isMember = true;
            }
            else
            {
                isMember = await CheckSecurityGroupMembership(userId, securityGroupObjectId);
            }

            return isMember;
        }
    }

    class AuthorizationHandlerUtilities
    {
        public static T ExtractFromToken<T>(string token, string key)
        {
            var jwtToken = new JwtSecurityToken(token);
            return (T)jwtToken.Payload.GetValueOrDefault(key);
        }

        public static bool ValidateAppId(string appId, string[] allowedAppIds, bool isPublicCloud)
        {
            if (!isPublicCloud) 
            { 
                return true; 
            }

            if (string.IsNullOrEmpty(appId))
            {
                throw new ArgumentNullException(nameof(appId));
            }

            bool isAppIdAllowed = false;
            isAppIdAllowed = allowedAppIds.Any(allowedAppId => allowedAppId.Equals(appId, StringComparison.OrdinalIgnoreCase));
            return isAppIdAllowed;
        }
    }
}
