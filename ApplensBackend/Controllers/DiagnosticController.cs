// <copyright file="DiagnosticController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Services;
using AppLensV3.Services.AppSvcUxDiagnosticDataService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Extensions.Configuration;
using Microsoft.Net.Http.Headers;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Hosting;
using static AppLensV3.Helpers.HeaderConstants;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Diagnostic controller.
    /// </summary>
    [Route("api")]
    [Authorize(Policy = "ApplensAccess")]
    public class DiagnosticController : Controller
    {
        IConfiguration config;
        private readonly string[] forbiddenAscRegions;
        private readonly string forbiddenDiagAscHeaderValue;
        private readonly bool detectorDevelopmentEnabled;
        private readonly IList<string> apiEndpointsForDetectorDevelopment;

        private readonly string[] AllowedSections = new string[] { "ContentSearch", "DeepSearch", "ApplicationInsights", "AcceptOriginSuffix:Origins", "CodeCompletion", "DetectorDevelopmentEnabled", "DetectorDevelopmentEnv", "PPEHostname", "APPLENS_ENVIRONMENT", "APPLENS_HOST" };

        private class InvokeHeaders
        {
            public string Path { get; set; }
            public string Method { get; set; }
            public IEnumerable<string> DetectorAuthors { get; set; }
            public string ModifiedBy { get; set; }
            public bool InternalClient { get; set; }
            public bool InternalView { get; set; }
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="DiagnosticController"/> class.
        /// </summary>
        /// <param name="env">The environment.</param>
        /// <param name="diagnosticClient">Diagnostic client.</param>
        /// <param name="emailNotificationService">Email notification service.</param>
        public DiagnosticController(IWebHostEnvironment env, IDiagnosticClientService diagnosticClient, IEmailNotificationService emailNotificationService, IConfiguration configuration, IResourceConfigService resConfigService, IAppSvcUxDiagnosticDataService appSvcUxDiagnosticDataService)
        {
            Env = env;
            DiagnosticClient = diagnosticClient;
            EmailNotificationService = emailNotificationService;
            forbiddenAscRegions = configuration.GetValue<string>("ForbiddenAscRegions", string.Empty).Replace(" ", string.Empty).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            if (!forbiddenAscRegions.Any())
            {
                // will remove once production config is updated to use the more racially neutral term `ForbiddenAscRegions`
                forbiddenAscRegions = configuration.GetValue<string>("BlackListedAscRegions", string.Empty).Replace(" ", string.Empty).Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries);
            }

            forbiddenDiagAscHeaderValue = configuration.GetValue<string>("DiagAscHeaderValue");
            this.config = configuration;
            this.resourceConfigService = resConfigService;
            AppSvcUxDiagnosticDataService = appSvcUxDiagnosticDataService;

            if (!bool.TryParse(configuration["DetectorDevelopmentEnabled"], out detectorDevelopmentEnabled))
            {
                detectorDevelopmentEnabled = true;
            }

            apiEndpointsForDetectorDevelopment = new List<string>() { "/diagnostics/query?", "/diagnostics/publish" };
        }

        private IDiagnosticClientService DiagnosticClient { get; }

        private IEmailNotificationService EmailNotificationService { get; }

        private IWebHostEnvironment Env { get; }

        private IAppSvcUxDiagnosticDataService AppSvcUxDiagnosticDataService { get; }

        private IResourceConfigService resourceConfigService { get; }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return new OkResult();
        }

        [HttpGet("appsettings/{name}")]
        public IActionResult GetAppSettingValue(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("App setting name is empty");
            }

            if (AllowedSections != null && AllowedSections.Any(sectionName => name.StartsWith(sectionName)))
            {
                return Ok(config[name]);
            }
            else
            {
                return NotFound($"App setting with the name '{name}' is not found");
            }
        }

        [HttpGet("invoke")]
        public async Task<IActionResult> InvokeUsingGet(string path, string method = "POST")
        {
            IActionResult response;
            string reason;

            if (string.IsNullOrWhiteSpace(path))
            {
                reason = @"Expecting a URL encoded path as a query string parameter eg., https:\\applens.azurewebsites.net?path=%2Fsubscriptions%2F0000-0000-000000-00000000-0000000%2FresourceGroups%2Fexample-rg%2Fproviders%2FMicrosoft.Web%2Fsites%2Fexample_sites%2Fdetectors";
                return BadRequest(reason);
            }

            this.HttpContext.Request.Headers.Add(PathQueryHeader, path);
            this.HttpContext.Request.Headers.Add(MethodHeader, method);
            this.HttpContext.Request.Headers.Add(HeaderNames.ContentType, "application/json");

            try
            {
                response = await Invoke(null);
            }
            catch (Exception ex)
            {
                string errorResponse = $"Error encountered during API call\n{ex.ToString()}";
                response = StatusCode(500, errorResponse);
            }

            return response;
        }

        /// <summary>
        /// Action for invoke request.
        /// </summary>
        /// <param name="body">Request body.</param>
        /// <returns>Task for invoking request.</returns>
        [HttpPost("invoke")]
        [HttpOptions("invoke")]
        public async Task<IActionResult> Invoke([FromBody] JToken body)
        {
            var invokeHeaders = ProcessInvokeHeaders();

            if (string.IsNullOrWhiteSpace(invokeHeaders.Path))
            {
                return BadRequest($"Missing {PathQueryHeader} header");
            }

            if (!IsApiAllowed(invokeHeaders.Path))
            {
                throw new InvalidOperationException("The api is not allowed to be executed in this environment");
            }

            string detectorId = null;
            if (body?.GetType() != typeof(JArray))
            {
                detectorId = body?["id"] != null ? body["id"].ToString() : string.Empty;
            }

            string applensLink = "https://applens.azurewebsites.net/" + invokeHeaders.Path.Replace("resourcegroup", "resourceGroup").Replace("diagnostics/publish", string.Empty) + "detectors/" + detectorId;

            var detectorAuthorEmails = new List<EmailAddress>();
            if (invokeHeaders.DetectorAuthors.Any())
            {
                detectorAuthorEmails = invokeHeaders.DetectorAuthors
                    .Select(x => x.EndsWith("@microsoft.com") ? x : $"{x}@microsoft.com")
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Select(x => new EmailAddress(x)).ToList();
            }

            HttpRequestHeaders headers = new HttpRequestMessage().Headers;

            var locationPlacementId = await GetLocationPlacementId(invokeHeaders);
            if (!string.IsNullOrWhiteSpace(locationPlacementId))
            {
                headers.Add("x-ms-subscription-location-placementid", locationPlacementId);
            }

            foreach (var header in Request.Headers)
            {
                if ((header.Key.StartsWith("x-ms-") || header.Key.StartsWith("diag-")) && !headers.Contains(header.Key))
                {
                    headers.Add(header.Key, header.Value.ToString());
                }
            }

            headers.Add("x-ms-user-token", Request.Headers["Authorization"].ToString());
            
            // For Publishing Detector Calls, validate if user has access to publish the detector
            if (invokeHeaders.Path.EndsWith("/diagnostics/publish", StringComparison.OrdinalIgnoreCase))
            {
                if (!TryFetchPublishAcessParametersFromRequestBody(body, out string resourceType, out string detectorCode, out bool isOriginalCodeMarkedPublic, out string errMsg))
                {
                    return BadRequest(errMsg);
                }

                string userAlias = Utilities.GetUserIdFromToken(Request.Headers["Authorization"].ToString());
                var resourceConfig = await this.resourceConfigService.GetResourceConfig(resourceType);
                bool hasAccess = await Utilities.IsUserAllowedToPublishDetector(userAlias, resourceConfig, detectorCode, isOriginalCodeMarkedPublic);

                if (!hasAccess)
                {
                    return Unauthorized();
                }
            }

            var response = await DiagnosticClient.Execute(invokeHeaders.Method, invokeHeaders.Path, body?.ToString(), invokeHeaders.InternalClient, invokeHeaders.InternalView, headers);
            if (response == null)
            {
                return StatusCode(500, "Null response from DiagnosticClient");
            }

            var responseTask = response.Content.ReadAsStringAsync();
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, await responseTask);
            }

            if (response.Headers.Contains(ScriptEtagHeader))
            {
                Request.HttpContext.Response.Headers.Add(ScriptEtagHeader, response.Headers.GetValues(ScriptEtagHeader).First());
            }

            if (invokeHeaders.Path.EndsWith("/diagnostics/publish", StringComparison.OrdinalIgnoreCase) && detectorAuthorEmails.Count > 0 && Env.IsProduction())
            {
                EmailNotificationService.SendPublishingAlert(invokeHeaders.ModifiedBy, detectorId, applensLink, detectorAuthorEmails);
            }

            return Ok(JsonConvert.DeserializeObject(await responseTask));
        }

        private bool IsApiAllowed(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
            {
                return false;
            }

            return (detectorDevelopmentEnabled == true) || !apiEndpointsForDetectorDevelopment.Any(p => path.Contains(p));
        }

        private async Task<string> GetLocationPlacementId(InvokeHeaders invokeHeaders)
        {

            // fetch some subscription details that we log from app service diagnostics appsvcux kusto cluster
            var m = Regex.Match(invokeHeaders.Path, @"\/subscriptions\/(.*)\/resourceGroups", RegexOptions.IgnoreCase);
            var subscriptionId = m.Groups.Count >= 2 ? m.Groups[1].Value : null;

            Microsoft.Extensions.Primitives.StringValues locationHeaderValue;
            if (Request.Headers.TryGetValue("x-ms-location", out locationHeaderValue) && forbiddenAscRegions.Any(region => locationHeaderValue.Any(value => value.Contains(region))))
            {
                try
                {
                    var subscriptionLocationPlacementIdentifiersTask = AppSvcUxDiagnosticDataService.GetLocationPlacementIdAsync(subscriptionId);

                    // dont block request thread to wait on this.
                    if (subscriptionLocationPlacementIdentifiersTask != null && subscriptionLocationPlacementIdentifiersTask.IsCompleted)
                    {
                        var subscriptionLocationPlacementIdentifiers = await subscriptionLocationPlacementIdentifiersTask;
                        if (subscriptionLocationPlacementIdentifiers != null && subscriptionLocationPlacementIdentifiers.All(locationPlacementId => locationPlacementId.Equals(forbiddenDiagAscHeaderValue, StringComparison.CurrentCultureIgnoreCase) == false))
                        {
                            return string.Join(",", subscriptionLocationPlacementIdentifiers);
                        }
                    }
                }
                catch (LocationPlacementIdException ex)
                {
                    // silently ignore
                    Trace.TraceWarning($"Failed to get locationPlacementId subscription information. Defer to fallback method using region approach {ex.Message}");
                }

                return forbiddenDiagAscHeaderValue;
            }

            return null;
        }

        [HttpPost("publishingaccess")]
        [HttpOptions("publishingaccess")]
        public async Task<IActionResult> GetPublishingAccessControl([FromBody] JToken body)
        {
            if (body == null)
            {
                return BadRequest("Post body cannot be empty");
            }

            if (!TryFetchPublishAcessParametersFromRequestBody(body, out string resourceType, out string detectorCode, out bool isOriginalCodeMarkedPublic, out string errMsg))
            {
                return BadRequest(errMsg);
            }

            string userAlias = Utilities.GetUserIdFromToken(Request.Headers["Authorization"].ToString());
            var resourceConfig = await this.resourceConfigService.GetResourceConfig(resourceType);

            bool hasAccess = await Utilities.IsUserAllowedToPublishDetector(userAlias, resourceConfig, detectorCode, isOriginalCodeMarkedPublic);

            List<string> groupNames = new List<string>();
            if (resourceConfig != null && !resourceConfig.AllowedGroupsToPublish.IsNullOrEmpty())
            {
                groupNames = resourceConfig.AllowedGroupsToPublish.Select(p => p.Name).ToList();
            }

            return Ok(new
            {
                HasAccess = hasAccess,
                ServiceName = resourceConfig?.Name,
                ResourceType = resourceConfig?.ResourceType,
                ResourceOwners = resourceConfig?.ResourceOwners,
                allowedUsersToPublish = resourceConfig?.AllowedUsersToPublish,
                allowedGroupsToPublish = groupNames
            });
        }

        private static string GetHeaderOrDefault(IHeaderDictionary headers, string headerName, string defaultValue = "")
        {
            if (headers == null || headerName == null)
            {
                return defaultValue;
            }

            if (headers.TryGetValue(headerName, out var outValue))
            {
                return outValue;
            }

            return defaultValue;
        }

        private InvokeHeaders ProcessInvokeHeaders()
        {
            var authorization = Request.Headers["Authorization"].ToString();
            string userId = string.Empty;

            if (!string.IsNullOrWhiteSpace(authorization))
            {
                string accessToken = authorization.Split(" ")[1];
                var token = new JwtSecurityToken(accessToken);
                object upn;
                if (token.Payload.TryGetValue("upn", out upn))
                {
                    userId = upn.ToString().Replace("@microsoft.com", string.Empty);
                }
            }

            var path = GetHeaderOrDefault(Request.Headers, PathQueryHeader);
            var method = GetHeaderOrDefault(Request.Headers, MethodHeader, HttpMethod.Get.Method);
            var rawDetectorAuthors = GetHeaderOrDefault(Request.Headers, EmailRecipientsHeader);
            var detectorAuthors = rawDetectorAuthors.Split(new char[] { ' ', ',', ';', ':' }, StringSplitOptions.RemoveEmptyEntries);
            var modifiedBy = GetHeaderOrDefault(Request.Headers, ModifiedByHeader, userId);
            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalClientHeader, true.ToString()), out var internalClient);
            bool.TryParse(GetHeaderOrDefault(Request.Headers, InternalViewHeader, true.ToString()), out var internalView);

            return new InvokeHeaders()
            {
                Path = path,
                Method = method,
                DetectorAuthors = detectorAuthors,
                InternalClient = internalClient,
                InternalView = internalView,
                ModifiedBy = modifiedBy
            };
        }

        private bool TryFetchPublishAcessParametersFromRequestBody(JToken body, out string resourceType, out string detectorCode, out bool isOriginalCodeMarkedPublic, out string errorMessage)
        {
            resourceType = body?["resourceType"]?.ToString();
            detectorCode = body?["codeString"]?.ToString();
            errorMessage = string.Empty;
            isOriginalCodeMarkedPublic = false;
            bool.TryParse(body?["isOriginalCodeMarkedPublic"]?.ToString(), out isOriginalCodeMarkedPublic);

            if (string.IsNullOrWhiteSpace(resourceType))
            {
                errorMessage = "resourceType field cannot be null";
                return false;
            }

            if (string.IsNullOrWhiteSpace(detectorCode))
            {
                errorMessage = "detectorCode field cannot be null";
                return false;
            }

            return true;
        }
    }
}
