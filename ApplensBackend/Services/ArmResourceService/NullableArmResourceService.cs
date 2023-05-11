using System.Threading.Tasks;
using AppLensV3.Helpers;

namespace AppLensV3.Services
{
    public class NullableArmResourceService : IArmResourceService
    {
        public Task<string> GetArmResourceUrlAsync(string provider, string serviceName, string resourceName)
        {
            return Task.FromResult(FakeResource(provider, serviceName, resourceName));
        }

        private string FakeResource(string provider, string serviceName, string resourceName) =>
            string.Format(ResourceConstants.ArmUrlTemplate, "00000000-0000-0000-0000-000000000000", "Fake-RG", provider, serviceName, resourceName);
    }
}
