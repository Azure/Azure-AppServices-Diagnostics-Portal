using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace AppLensV3
{
    public class DiagnosticObserverClientService : IObserverClientService
    {
        private readonly IDiagnosticClientService _diagnosticClientService;

        /// <summary>
        /// Initializes a new instance of the <see cref="DiagnosticObserverClientService"/> class.
        /// Primary class to get site and stamp information from diagnostic service.
        /// </summary>
        /// <param name="diagnosticService">Injected DiagnosticService instance.</param>
        public DiagnosticObserverClientService(IDiagnosticClientService diagnosticService)
        {
            _diagnosticClientService = diagnosticService;
        }

        public async Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName)
        {
            var hostingEnvironmentDetails = await ExecuteDiagCall($"hostingEnvironments/{hostingEnvironmentName}");
            var contentJson = await hostingEnvironmentDetails.Content.ReadAsStringAsync();
            var content = JsonConvert.DeserializeObject(contentJson);

            return new ObserverResponse
            {
                StatusCode = hostingEnvironmentDetails.StatusCode,
                Content = content
            };
        }

        public Task<ObserverResponse> GetHostingEnvironmentPostBody(string name)
        {
            throw new NotImplementedException();
        }

        public Task<ObserverResponse> GetHostnames(string siteName)
        {
            throw new NotImplementedException();
        }

        public Task<ObserverResponse> GetResourceGroup(string site)
        {
            throw new NotImplementedException();
        }

        public Task<ObserverResponse> GetSite(string siteName)
        {
            return GetSiteInternal(null, siteName);
        }

        public async Task<ObserverResponse> GetContainerApp(string containerAppName)
        {
            return await GetContainerAppInternal(containerAppName);
        }

        public Task<ObserverResponse> GetSite(string stamp, string siteName, bool details = false)
        {
            return GetSiteInternal(stamp, siteName);
        }

        public Task<ObserverResponse> GetSiteSku(string stamp, string siteName)
        {
            var path = $"stamps/{stamp}/sites/{siteName}/sku";
            return GetAppInternal(path);
        }

        public async Task<ObserverResponse> GetStaticWebApp(string defaultHostNameOrAppName)
        {
            return await GetStaticWebAppInternal(defaultHostNameOrAppName);
        }

        private Task<ObserverResponse> GetSiteInternal(string stamp, string siteName)
        {
            var path = stamp != null ? $"stamps/{stamp}/sites/{siteName}" : $"sites/{siteName}";
            return GetAppInternal(path);
        }

        private Task<ObserverResponse> GetContainerAppInternal(string containerAppName)
        {
            var path = $"partner/containerapp/{containerAppName}";
            return GetAppInternal(path);
        }

        private Task<ObserverResponse> GetStaticWebAppInternal(string defaultHostNameOrAppName)
        {
            var path = $"partner/jamstack/{defaultHostNameOrAppName}";
            return GetAppInternal(path);
        }

        private async Task<ObserverResponse> GetAppInternal(string path)
        {
            var siteDetailsResponse = await ExecuteDiagCall(path);
            var contentJson = await siteDetailsResponse.Content.ReadAsStringAsync();
            var content = JsonConvert.DeserializeObject(contentJson);
            return new ObserverResponse
            {
                StatusCode = siteDetailsResponse.StatusCode,
                Content = content
            };
        }

        public Task<ObserverResponse> GetStampBody(string stampName)
        {
            return GetStampInternal(stampName);
        }

        private async Task<ObserverResponse> GetStampInternal(string stampName)
        {
            var path = $"stamps/{stampName}";
            var stampDetailsResponse = await ExecuteDiagCall(path);
            var contentJson = await stampDetailsResponse.Content.ReadAsStringAsync();
            var content = JsonConvert.DeserializeObject(contentJson);
            return new ObserverResponse
            {
                StatusCode = stampDetailsResponse.StatusCode,
                Content = content
            };
        }


        private async Task<HttpResponseMessage> ExecuteDiagCall(string path)
        {
            var response = await _diagnosticClientService.Execute(HttpMethod.Get.Method, "observer/" + path);
            return response;
        }

        public Task<ObserverResponse> GetSitePostBody(string stamp, string site)
        {
            throw new NotImplementedException();
        }

        public Task<ObserverResponse> GetStamp(string siteName)
        {
            throw new NotImplementedException();
        }
    }
}
