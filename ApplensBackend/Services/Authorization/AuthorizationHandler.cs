using AppLensV3.Helpers;
using AppLensV3.Models;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Headers;
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
        public string GroupName {get; set; }

        /// <summary>
        /// Gets or sets Object Id of Security Group.
        /// </summary>
        public string GroupId {get; set; }
    }

    /// <summary>
    /// Security Group Requirement to be met.
    /// </summary>
    class SecurityGroupRequirement: IAuthorizationRequirement
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

    class DefaultAuthorizationRequirement : IAuthorizationRequirement{}

    class DefaultAuthorizationHandler : AuthorizationHandler<DefaultAuthorizationRequirement>
    {
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, DefaultAuthorizationRequirement requirement)
        {
            context.Succeed(requirement);
            return;
        }
    }

    class CachedUser{
        public DateTime UserSince {get; set;}
        public long ts {get; set;}
        public CachedUser(DateTime userSince, long timestamp){
            this.ts = timestamp;
            this.UserSince = userSince;
        }
    }

    /// <summary>
    /// Security Group Authorization Handler.
    /// </summary>
    class SecurityGroupHandler : AuthorizationHandler<SecurityGroupRequirement>
    {
        private readonly string graphUrl = "https://graph.microsoft.com/v1.0/users/{0}/checkMemberGroups";
        private readonly int loggedInUserCacheClearIntervalInMs = 60 * 60 * 1000; // 1 hour
        private readonly int loggedInUserExpiryIntervalInSeconds = 6 * 60 * 60; // 6 hours
        private ICosmosDBHandlerBase<TemporaryAccessUser> _cosmosDBHandler;
        private readonly long temporaryAccessExpiryInSeconds;
        private readonly int temporaryAccessDays = 7;

        public SecurityGroupHandler(IHttpContextAccessor httpContextAccessor, IConfiguration configuration, ICosmosDBHandlerBase<TemporaryAccessUser> cosmosDBHandler)
        {
            loggedInUsersCache = new Dictionary<string, Dictionary<string, CachedUser>>();
            var applensAccess = new SecurityGroupConfig();
            var applensTesters = new SecurityGroupConfig();
            configuration.Bind("ApplensAccess", applensAccess);
            configuration.Bind("ApplensTesters", applensTesters);
            loggedInUsersCache.Add(applensAccess.GroupId, new Dictionary<string, CachedUser>());
            loggedInUsersCache.Add(applensTesters.GroupId, new Dictionary<string, CachedUser>());
            loggedInUsersCache.Add("TemporaryAccess", new Dictionary<string, CachedUser>());

            ClearLoggedInUserCache();
            _httpContextAccessor = httpContextAccessor;
            
            var accessDurationInDays = configuration["ApplensTemporaryAccess:AccessDurationInDays"];
            int.TryParse(accessDurationInDays.ToString(), out temporaryAccessDays);
            temporaryAccessExpiryInSeconds = temporaryAccessDays * 24 * 60* 60;
            _cosmosDBHandler = cosmosDBHandler;

        }

        private IHttpContextAccessor _httpContextAccessor = null;
        private Dictionary<string, Dictionary<string, CachedUser>> loggedInUsersCache;

        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        /// <summary>
        /// Task to clear expired users from cache at regular interval.
        /// </summary>
        /// <returns>Task.</returns>
        private async Task ClearLoggedInUserCache()
        {
            while (true)
            {
                long now = (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
                foreach (KeyValuePair<string, Dictionary<string, CachedUser>> securityGroupCache in loggedInUsersCache)
                {
                    foreach (KeyValuePair<string, CachedUser> user in securityGroupCache.Value)
                    {
                        if ((now - user.Value.ts) > loggedInUserExpiryIntervalInSeconds)
                        {
                            // Pop out user from logged in users list
                            securityGroupCache.Value.Remove(user.Key);
                        }
                    }
                }

                await Task.Delay(loggedInUserCacheClearIntervalInMs);
            }
        }

        /// <summary>
        /// Adds user to cached dictionary.
        /// </summary>
        /// <param name="groupId">groupId.</param>
        /// <param name="userId">userId.</param>
        private void AddUserToCache(string groupId, string userId, DateTime userSince)
        {
            Dictionary<string, CachedUser> securityGroup;
            if (loggedInUsersCache.TryGetValue(groupId, out securityGroup))
            {
                CachedUser user;
                long ts = (long)DateTime.UtcNow.Subtract(new DateTime(1970, 1, 1)).TotalSeconds;
                if (securityGroup.TryGetValue(userId, out user))
                {
                    securityGroup[userId].ts = ts;
                }
                else
                {
                    securityGroup.Add(userId, new CachedUser(userSince, ts));
                }
            }
        }

        /// <summary>
        /// Checks cached dictionary to find if user exists.
        /// </summary>
        /// <param name="groupId">groupId.</param>
        /// <param name="userId">userId.</param>
        /// <returns>boolean value.</returns>
        private bool IsUserInCache(string groupId, string userId, out DateTime userSince)
        {
            Dictionary<string, CachedUser> securityGroup;
            if (loggedInUsersCache.TryGetValue(groupId, out securityGroup))
            {
                CachedUser user;
                if (securityGroup.TryGetValue(userId, out user))
                {
                    userSince = user.UserSince;
                    return true;
                }
            }

            userSince = DateTime.UtcNow;
            return false;
        }

        private bool IsUserInCache(string groupId, string userId)
        {
            Dictionary<string, CachedUser> securityGroup;
            if (loggedInUsersCache.TryGetValue(groupId, out securityGroup))
            {
                CachedUser user;
                if (securityGroup.TryGetValue(userId, out user))
                {
                    return true;
                }
            }

            return false;
        }

        private async Task<Boolean> CheckTemporaryAccess(string userId)
        {
            var result = await _cosmosDBHandler.GetItemAsync(userId, "TemporaryAccessUser");
            if (result != null && ((long)DateTime.UtcNow.Subtract(result.AccessStartDate).TotalSeconds) < temporaryAccessExpiryInSeconds)
            {
                HttpContext context = _httpContextAccessor.HttpContext;
                context.Response.Headers["IsTemporaryAccess"] = "true";
                context.Response.Headers["TemporaryAccessExpires"] = (result.AccessStartDate.AddDays(temporaryAccessDays) - DateTime.UtcNow).Days.ToString();
                AddUserToCache("TemporaryAccess", userId, result.AccessStartDate);
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
                AddUserToCache(securityGroupObjectId, userId, DateTime.UtcNow);
                return true;
            }

            return await CheckTemporaryAccess(userId);
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
            string userId = null;
            try
            {
                string authorization = httpContext.Request.Headers["Authorization"].ToString();
                string accessToken = authorization.Split(" ")[1];
                var token = new JwtSecurityToken(accessToken);
                object upn;
                if (token.Payload.TryGetValue("upn", out upn))
                {
                    userId = upn.ToString();
                    DateTime userSince;
                    if (userId != null)
                    {
                        if (IsUserInCache(requirement.SecurityGroupObjectId, userId))
                        {
                            isMember = true;
                        }
                        else if (IsUserInCache("TemporaryAccess", userId, out userSince)) {
                            httpContext.Response.Headers["IsTemporaryAccess"] = "true";
                            httpContext.Response.Headers["TemporaryAccessExpires"] = (userSince.AddDays(temporaryAccessDays) - DateTime.UtcNow).Days.ToString();
                            isMember = true;
                        }
                        else
                        {
                            isMember = await CheckSecurityGroupMembership(userId, requirement.SecurityGroupObjectId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                isMember = false;
            }

            if (isMember)
            {
                context.Succeed(requirement);
                return;
            }

            var filterContext = context.Resource as AuthorizationFilterContext;
            var response = filterContext?.HttpContext.Response;
            response?.OnStarting(async () =>
            {
                filterContext.HttpContext.Response.StatusCode = 403;
                byte[] message = Encoding.ASCII.GetBytes("User is not an authorized member of " + requirement.SecurityGroupName + " group.");
                await response.Body.WriteAsync(message, 0, message.Length);
            });
            context.Fail();
            return;
        }
    }
}
