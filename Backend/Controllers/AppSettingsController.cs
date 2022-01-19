using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Backend.Controllers
{
    [Produces("application/json")]
    [Route("api/appsettings")]
    [ResponseCache(CacheProfileName = "Default")]
    public class AppSettingsController : Controller
    {
        private IConfiguration config;
        private IWebHostEnvironment env;

        public AppSettingsController(IConfiguration configuration, IWebHostEnvironment env)
        {
            this.config = configuration;
            this.env = env;
        }

        [HttpGet("{name}")]
        public IActionResult GetAppSettingValue(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest("App setting name is empty");
            }

            return Ok(config[name]);
        }
    }
}