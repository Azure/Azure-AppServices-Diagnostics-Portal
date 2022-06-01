using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IObserverClientService
    {
        Task<ObserverResponse> GetSite(string siteName);

        Task<ObserverResponse> GetContainerApp(string containerAppName);

        Task<ObserverResponse> GetStaticWebApp(string defaultHostNameOrAppName);

        Task<ObserverResponse> GetSite(string stamp, string siteName, bool details = false);

        Task<ObserverResponse> GetResourceGroup(string site);

        Task<ObserverResponse> GetStamp(string siteName);

        Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName);

        Task<ObserverResponse> GetHostingEnvironmentPostBody(string name);

        Task<ObserverResponse> GetSitePostBody(string stamp, string site);

        Task<ObserverResponse> GetStampBody(string stampName);

        Task<ObserverResponse> GetSiteSku(string stamp, string site);
    }
}