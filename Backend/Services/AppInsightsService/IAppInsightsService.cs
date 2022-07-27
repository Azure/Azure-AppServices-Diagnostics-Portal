using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IAppInsightsService
    { 
        Task<bool> Validate(string appInsightsAppId, string encryptedKey, string siteHostName);
    }
}
