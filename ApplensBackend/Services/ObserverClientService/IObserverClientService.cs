using System.Threading.Tasks;

namespace AppLensV3
{
    public interface IObserverClientService
    {
        Task<ObserverResponse> GetSite(string siteName);

        Task<ObserverResponse> GetWorkerApp(string workerAppName);

        Task<ObserverResponse> GetSite(string stamp, string siteName, bool details = false);

        Task<ObserverResponse> GetResourceGroup(string site);

        Task<ObserverResponse> GetStamp(string siteName);

        Task<ObserverResponse> GetHostingEnvironmentDetails(string hostingEnvironmentName);

        Task<ObserverResponse> GetHostingEnvironmentPostBody(string name);

        Task<ObserverResponse> GetSitePostBody(string stamp, string site);
    }
}