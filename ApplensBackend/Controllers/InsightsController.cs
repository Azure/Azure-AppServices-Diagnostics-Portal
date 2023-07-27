// <copyright file="InsightsController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Controller to surface ASC insights.
    /// </summary>
    [Route("api/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers")]
    [Authorize(Policy = "ApplensAccess")]
    public class InsightsController
    {
        private IDiagnosticClientService diagnosticClientService;
        private IObserverClientService observerService;

        /// <summary>
        /// Initializes a new instance of the <see cref="InsightsController"/> class.
        /// </summary>
        /// <param name="diagnosticClientService">DiagnosticRole service.</param>
        /// <param name="observer">Observer service.</param>
        public InsightsController(IDiagnosticClientService diagnosticClientService, IObserverClientService observer)
        {
            this.diagnosticClientService = diagnosticClientService;
            this.observerService = observer;
        }

        [HttpGet]
        [Route("{provider}/{resourceType}/{resourceName}/insights")]
        public async Task<object> GetInsights(string subscriptionId, string resourceGroupName, string provider, string resourceType, string resourceName, string pesId = null, string supportTopicId = null, string supportTopic = null, string startTime = null, string endTime = null)
        {
            Task<ObserverResponse> getResourceTask = null;
            var appServiceResources = new string[] { ResourceConstants.SiteResourceTypeName, ResourceConstants.HostingEnvironmentResourceTypeName };

            if (appServiceResources.Contains(resourceType))
            {
                switch (resourceType)
                {
                    case ResourceConstants.SiteResourceTypeName:
                        getResourceTask = observerService.GetSite(resourceName);
                        break;
                    case ResourceConstants.HostingEnvironmentResourceTypeName:
                        getResourceTask = observerService.GetHostingEnvironmentDetails(resourceName);
                        break;
                }

                var resource = await getResourceTask;
                if (resource.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return new NotFoundResult();
                    throw new Exception($"Could not find resource with resource path {resourceName}");
                }
            }

            if (string.IsNullOrWhiteSpace(supportTopicId) && !string.IsNullOrWhiteSpace(supportTopic))
            {
                if (SupportCenterMapping.Mapping.TryGetValue(supportTopic, out Tuple<string, string> info))
                {
                    pesId = info.Item1;
                    supportTopicId = info.Item2;
                }
                else
                {
                    pesId = "xxx";
                    supportTopicId = "xxx";
                }
            }

            var diagnosticPath = $"subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/{provider}/{resourceType}/{resourceName}/insights?pesId={pesId}&supportTopicId={supportTopicId}&startTime={startTime}&endTime={endTime}";
            var insights = await diagnosticClientService.Execute(HttpMethod.Post.Method, diagnosticPath, null, true, false);

            if (insights.IsSuccessStatusCode)
            {
                var content = await insights.Content.ReadAsStringAsync();
                var jsonContent = JsonConvert.DeserializeObject<JToken>(content);
                return jsonContent;
            }

            return null;
        }
    }
}
