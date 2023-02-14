using AppLensV3.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace AppLensV3.Controllers
{
    [Route("api/tprompt/")]
    [Authorize(Policy = "ApplensAccess")]
    public class TPromptController : Controller
    {
        private readonly ITPromptClientService _tPromptClientService;

        public TPromptController(ITPromptClientService tPromptClientService, IDiagnosticClientService diagnosticClient)
        {
            _tPromptClientService = tPromptClientService;
        }

        [HttpGet("getCodeSuggestions/{queryName}")]
        [HttpOptions("getCodeSuggestions/{queryName}")]
        public async Task<IActionResult> GetCodeSuggestions(string queryName)
        {
            string matchingPattern = "([^A-Za-z0-9\\.\\$]+)|([A-Z])(?=[A-Z][a-z])|([A-Za-z])(?=\\$?[0-9]+(?:\\.[0-9]+)?)|([0-9])(?=[^\\.0-9])|([a-z])(?=[A-Z])";
            string replacementPattern = "$2$3$4$5 "; // Space is important here
            string stringifiedQueryName = Regex.Replace(queryName, matchingPattern, replacementPattern);
            return Ok(await _tPromptClientService.GetSuggestions(stringifiedQueryName));
        }
    }
}
