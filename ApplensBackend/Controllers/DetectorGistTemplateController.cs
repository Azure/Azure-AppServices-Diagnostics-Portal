using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// API to deliever templates for detector and gists.
    /// </summary>
    [Produces("application/json")]
    [Route("api/templates")]
    [Authorize(Policy = "ApplensAccess")]
    public class DetectorGistTemplateController : Controller
    {
        private IDetectorGistTemplateService templateService;

        public DetectorGistTemplateController(IDetectorGistTemplateService templateService)
        {
            this.templateService = templateService;
        }

        /// <summary>
        /// Get template.
        /// </summary>
        /// <param name="name">File name.</param>
        /// <returns>Task for getting template.</returns>
        [HttpGet("{name}")]
        public async Task<IActionResult> GetTemplate(string name)
        {
            var cTokenSource = new CancellationTokenSource(TimeSpan.FromMilliseconds(DetectorGistTemplateServiceConstants.ApiTimeoutInMilliseconds));
            string content = await templateService.GetTemplate($"{name}.csx", cTokenSource.Token);
            return Ok(content);
        }

        /// <summary>
        /// Get template.
        /// </summary>
        /// <param name="name">File name.</param>
        /// <param name="fileExtension">File extension.</param>
        /// <returns>Task for getting template.</returns>
        [HttpGet("{name}/{fileExtension}")]
        public async Task<IActionResult> GetTemplate(string name, string fileExtension)
        {
            var cTokenSource = new CancellationTokenSource(TimeSpan.FromMilliseconds(DetectorGistTemplateServiceConstants.ApiTimeoutInMilliseconds));
            string content = await templateService.GetTemplate($"{name}.{fileExtension}", cTokenSource.Token);
            return Ok(content);
        }
    }
}
