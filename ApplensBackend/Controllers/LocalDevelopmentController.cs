// <copyright file="LocalDevelopmentController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Local development controller.
    /// </summary>
    [Route("api")]
    [Authorize]
    public class LocalDevelopmentController : Controller
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="LocalDevelopmentController"/> class.
        /// </summary>
        /// <param name="localDevelopmentClient">Local development client.</param>
        /// <param name="githubClientService">Github client.</param>
        public LocalDevelopmentController(ILocalDevelopmentClientService localDevelopmentClient, IGithubClientService githubClientService)
        {
            LocalDevelopmentClient = localDevelopmentClient;
            GithubClient = githubClientService;
        }

        private ILocalDevelopmentClientService LocalDevelopmentClient { get; }

        private IGithubClientService GithubClient { get; }

        /// <summary>
        /// Prepare local development environment.
        /// </summary>
        /// <param name="detectorId">Detector id.</param>
        /// <param name="body">Post body.</param>
        /// <returns>Task for preparing local development environment.</returns>
        [HttpPost("localdev")]
        public async Task<IActionResult> PrepareLocalDevEnvironementstring(string detectorId, [FromBody]JToken body)
        {
            //var scriptBody = string.Empty;
            //var resourceId = string.Empty;

            //if (Request.Headers.ContainsKey(HeaderConstants.PathQueryHeader))
            //{
            //    resourceId = Request.Headers[HeaderConstants.PathQueryHeader];
            //}

            //if (body == null || body["baseUrl"] == null)
            //{
            //    return BadRequest();
            //}

            //if (body["script"] != null)
            //{
            //    scriptBody = body["script"].ToString();
            //}

            //var gists = new List<string>();
            //if (body["gists"] != null)
            //{
            //    gists = body["gists"].ToObject<List<string>>();
            //}

            //var gistDef = new ConcurrentDictionary<string, IEnumerable<string>>();
            //var tasks = new List<Task>();

            //foreach (var gist in gists)
            //{
            //    tasks.Add(Task.Run(async () =>
            //    {
            //        var commits = await GithubClient.GetAllCommits($"{gist}/{gist}.csx");
            //        var sha = commits.Select(c => c.Sha);
            //        gistDef.AddOrUpdate(gist, sha, (k, v) => sha);
            //    }));
            //}

            //await Task.WhenAll(tasks);

            //var config = string.Empty;
            //var sourceReference = new ConcurrentDictionary<string, Tuple<string, string>>();

            //if (body["configuration"] != null)
            //{
            //    config = body["configuration"].ToString();

            //    tasks.Clear();

            //    var dependencies = body["configuration"]["dependencies"].ToObject<Dictionary<string, string>>();
            //    foreach (var p in dependencies)
            //    {
            //        tasks.Add(Task.Run(async () =>
            //        {
            //            var source = await GithubClient.GetCommitContent($"{p.Key.ToLower()}/{p.Key.ToLower()}.csx", p.Value);

            //            var configuration = await GithubClient.GetCommitContent($"{p.Key.ToLower()}/package.json", p.Value);
            //            var tuple = Tuple.Create(source, configuration);
            //            sourceReference.AddOrUpdate(p.Key.ToLower(), tuple, (k, v) => tuple);
            //        }));
            //    }

            //    await Task.WhenAll(tasks);
            //}

            //var baseUrl = new Uri(body["baseUrl"].ToString());

            //string zipBlobUri = await LocalDevelopmentClient.PrepareLocalDevelopment(detectorId, scriptBody?.ToString(), resourceId, config, baseUrl, gistDef, sourceReference);
            //return Ok(zipBlobUri);

            return new ObjectResult("The API is not supported until further notice.")
            {
                StatusCode = 415
            };
        }
    }
}
