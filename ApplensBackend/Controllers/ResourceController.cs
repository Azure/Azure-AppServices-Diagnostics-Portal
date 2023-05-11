using System;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AppLensV3.Services;
using Octokit;

namespace AppLensV3
{
    [Authorize(Policy = "ApplensAccess")]
    public class ResourceController : Controller
    {
        IObserverClientService _observerService;

        public ResourceController(IObserverClientService observerService)
        {
            _observerService = observerService;
        }

        [HttpGet("api/sites/{siteName}")]
        [HttpOptions("api/sites/{siteName}")]
        public async Task<IActionResult> GetSite(string siteName)
        {
            return await GetSiteInternal(null, siteName);
        }

        [HttpGet("api/containerapps/{containerAppName}")]
        [HttpOptions("api/containerapps/{containerAppName}")]
        public async Task<IActionResult> GetContainerApp(string containerAppName)
        {
            return await GetContainerAppInternal(containerAppName);
        }

        [HttpGet("api/staticwebapps/{defaultHostNameOrAppName}")]
        [HttpOptions("api/staticwebapps/{defaultHostNameOrAppName}")]
        public async Task<IActionResult> GetStaticWebApp(string defaultHostNameOrAppName)
        {
            return await GetStaticWebAppInternal(defaultHostNameOrAppName);
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}")]
        public async Task<IActionResult> GetSite(string stamp, string siteName)
        {
            return await GetSiteInternal(stamp, siteName);
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}/details")]
        public async Task<IActionResult> GetSiteDetails(string stamp, string siteName)
        {
            return await GetSiteInternal(stamp, siteName, details: true);
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}/postBody")]
        public async Task<IActionResult> GetSiteRequestBody(string stamp, string siteName)
        {
            var sitePostBody = await _observerService.GetSitePostBody(stamp, siteName);

            return Ok(new { Details = sitePostBody.Content });
        }

        [HttpGet]
        [Route("api/stamps/{stamp}/sites/{siteName}/sku")]
        public async Task<IActionResult> GetSiteSku(string stamp, string siteName)
        {
            var siteSku = await _observerService.GetSiteSku(stamp, siteName);
            return Ok(new { Details = siteSku.Content });
        }

        [HttpGet]
        [Route("api/hostingEnvironments/{hostingEnvironmentName}/postBody")]
        public async Task<IActionResult> GetHostingEnvironmentRequestBody(string hostingEnvironmentName)
        {
            var hostingEnvironmentPostBody = await _observerService.GetHostingEnvironmentPostBody(hostingEnvironmentName);

            return Ok(new { Details = hostingEnvironmentPostBody.Content });
        }

        [HttpGet("api/hostingEnvironments/{hostingEnvironmentName}")]
        [HttpOptions("api/hostingEnvironments/{hostingEnvironmentName}")]
        public async Task<IActionResult> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var hostingEnvironmentDetails = await _observerService.GetHostingEnvironmentDetails(hostingEnvironmentName);

            var details = new { Details = hostingEnvironmentDetails.Content };

            if (hostingEnvironmentDetails.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(details);
            }

            return Ok(details);
        }

        private async Task<IActionResult> GetSiteInternal(string stamp, string siteName, bool details = false)
        {
            var siteDetailsTask = stamp == null ? _observerService.GetSite(siteName) : _observerService.GetSite(stamp, siteName, details);
            var siteDetailsResponse = await siteDetailsTask;

            var response = new
            {
                SiteName = siteName,
                Details = siteDetailsResponse.Content
            };

            if (siteDetailsResponse.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        private async Task<IActionResult> GetContainerAppInternal(string containerAppName)
        {
            var containerAppsTask = _observerService.GetContainerApp(containerAppName);
            var containerAppsResponse = await containerAppsTask;

            var response = new
            {
                ContainerAppName = containerAppName,
                Details = containerAppsResponse.Content
            };

            if (containerAppsResponse.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        private async Task<IActionResult> GetStaticWebAppInternal(string defaultHostNameOrAppName)
        {
            var staticWebAppsTask = _observerService.GetStaticWebApp(defaultHostNameOrAppName);
            var staticWebAppsResponse = await staticWebAppsTask;

            var response = new
            {
                DefaultHostNameOrAppName = defaultHostNameOrAppName,
                Details = staticWebAppsResponse.Content
            };

            if (staticWebAppsResponse.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("api/stamps/{stampName}")]
        public async Task<IActionResult> GetStampBody(string stampName)
        {
            return await GetStampBodyInternal(stampName);
        }

        private async Task<IActionResult> GetStampBodyInternal(string stampName)
        {
            var stampDetailsTask = _observerService.GetStampBody(stampName);
            var stampDetailsResponse = await stampDetailsTask;

            var response = new
            {
                Name = stampName,
                Details = stampDetailsResponse.Content
            };

            if (stampDetailsResponse.StatusCode == HttpStatusCode.NotFound)
            {
                return NotFound(response);
            }

            return Ok(response);
        }

        [HttpGet]
        [Route("api/kustogeo/{geoRegionName}")]
        public async Task<IActionResult> GetKustoByGeo([FromServices] IKustoQueryService kustoQueryService, string geoRegionName)
        {
            return await GetKustoByGeoInternal(kustoQueryService, geoRegionName);
        }

        [HttpGet]
        [Route("api/armresourceurl/{providerName}/{serviceName}/{resourceName}")]
        public async Task<IActionResult> GetArmResourceUrl(string providerName, string serviceName, string resourceName, [FromServices] IArmResourceService resourceService)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(providerName) || string.IsNullOrWhiteSpace(serviceName) || string.IsNullOrWhiteSpace(resourceName))
                {
                    return BadRequest("arguments cannot be null or empty.");
                }

                var armID = await resourceService.GetArmResourceUrlAsync(providerName, serviceName, resourceName);
                return Ok(armID);
            }
            catch (NotFoundException ex)
            {
                return StatusCode(404, ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }

        private async Task<IActionResult> GetKustoByGeoInternal(IKustoQueryService kustoQueryService, string geoRegionName)
        {
            var kustoClusterName = await kustoQueryService.GetKustoClusterByGeoRegion(geoRegionName);
            if (kustoClusterName == null)
            {
                return NotFound(new { GeoRegionName = geoRegionName });
            }
            else
            {
                return Ok(new { GeoRegionName = geoRegionName, ClusterName = kustoClusterName });
            }
        }
    }
}
