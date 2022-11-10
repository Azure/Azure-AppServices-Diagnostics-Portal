using Backend.Models;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IAppInsightsService
    { 
        Task<AppInsightsValidationResponse> Validate(string appInsightsAppId, string encryptedKey, string siteHostName);
    }
}
