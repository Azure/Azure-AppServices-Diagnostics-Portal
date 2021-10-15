// <copyright file="GithubController.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Github controller.
    /// </summary>
    [Produces("application/json")]
    [Route("api/github")]
    [Authorize(Policy = "ApplensAccess")]
    public class GithubController : Controller
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GithubController"/> class.
        /// </summary>
        /// <param name="configuration">configuration object.</param>
        /// <param name="githubService">Github service.</param>
        public GithubController(IConfiguration configuration, IGithubClientService githubService)
        {
            GithubService = githubService;
            if (bool.TryParse(configuration["DetectorDevelopmentEnabled"], out bool detectorDevelopmentEnabled)
                && !detectorDevelopmentEnabled)
            {
                throw new InvalidOperationException("Calls to this controller are not allowed on this environment");
            }
        }

        /// <summary>
        /// Gets github service.
        /// </summary>
        private IGithubClientService GithubService { get; }

        /// <summary>
        /// Get template.
        /// </summary>
        /// <param name="name">File name.</param>
        /// <returns>Task for getting template.</returns>
        [HttpGet("template/{name}")]
        public async Task<IActionResult> GetTemplate(string name)
        {
            string content = await GithubService.GetRawFile(GithubConstants.TemplatePath.Replace("{filename}", name));
            return Ok(content);
        }

        /// <summary>
        /// Get template.
        /// </summary>
        /// <param name="name">File name.</param>
        /// <param name="fileExtension">File extension.</param>
        /// <returns>Task for getting template.</returns>
        [HttpGet("template/{name}/{fileExtension}")]
        public async Task<IActionResult> GetTemplate(string name, string fileExtension)
        {
            string content = await GithubService.GetRawFile(GithubConstants.TemplatePath.Replace("{filename}", name).Replace("csx", fileExtension));
            return Ok(content);
        }

        /// <summary>
        /// Get isSearchEnabled for product id.
        /// </summary>
        /// <param name="productId">The productId.</param>
        /// <returns>Boolean search enabled flag.</returns>
        [HttpGet("search/isEnabledForProductId/{productId}")]
        public async Task<IActionResult> GetSearchEnabledForProductId(string productId){
            if (string.IsNullOrWhiteSpace(productId))
            {
                return BadRequest("productId cannot be empty");
            }
            try{
                var resConf = await GithubService.GetResourceConfigFile();
                if (resConf.Contains(productId)){
                    return Ok(true);
                }
                else{
                    return Ok(false);
                }
            }
            catch (Exception ex) {
                throw new Exception("Exception while reading resource config from github: " + ex.ToString());
            }
        }

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        [HttpGet("package/{id}/configuration")]
        public async Task<IActionResult> GetConfiguration(string id)
        {
            try
            {
                var conf = await GithubService.GetConfiguration(id);
                return Ok(conf);
            }
            catch (Exception)
            {
                // To be compatible with current package.
                return Ok(string.Empty);
            }
        }

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting source file.</returns>
        [HttpGet("package/{id}")]
        public async Task<IActionResult> GetSourceFile(string id)
        {
            string content = await GithubService.GetSourceFile(id);
            return Ok(content);
        }

        /// <summary>
        /// Get metadata file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting metadata file.</returns>
        [HttpGet("package/{id}/metadata")]
        public async Task<IActionResult> GetMetadataFile(string id)
        {
            string content = await GithubService.GetMetadataFile(id);
            return Ok(content);
        }

        /// <summary>
        /// Get change list.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting change list.</returns>
        [HttpGet("package/{id}/changelist")]
        public async Task<IActionResult> GetChangelist(string id)
        {
            return Ok(await GithubService.GetAllCommits($"{id.ToLower()}"));
        }

        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changes files.</returns>
        [HttpGet("package/{sha}/changedfiles")]
        public async Task<IActionResult> GetChangedFiles(string sha)
        {
            return Ok(await GithubService.GetChangedFiles(sha));
        }

        /// <summary>
        /// Get configuration change list.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration changet list.</returns>
        [HttpGet("package/{id}/configuration/changelist")]
        public async Task<IActionResult> GetConfigurationChangelist(string id)
        {
            return Ok(await GithubService.GetAllCommits($"{id.ToLower()}/package.json"));
        }

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        [HttpGet("package/{id}/commit/{sha}")]
        public async Task<IActionResult> GetCommitContent(string id, string sha)
        {
            return Ok(await GithubService.GetCommitContent($"{id.ToLower()}/{id.ToLower()}.csx", sha));
        }

        /// <summary>
        /// Get commit configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        [HttpGet("package/{id}/configuration/commit/{sha}")]
        public async Task<IActionResult> GetCommitConfiguration(string id, string sha)
        {
            return Ok(await GithubService.GetCommitContent($"{id.ToLower()}/package.json", sha));
        }

        /// <summary>
        /// Get commit content by file path.
        /// </summary>
        /// <param name="sha">The sha.</param>
        /// <param name="filePath">File path.</param>
        /// <returns>Task for getting commit content.</returns>
        [HttpGet("package/commit/{sha}/{*filePath}")]
        public async Task<IActionResult> GetCommitContentByFilePath(string sha, string filePath)
        {
            return Ok(await GithubService.GetCommitContent(filePath, sha));
        }
    }
}