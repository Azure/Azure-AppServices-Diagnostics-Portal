using System;

namespace Microsoft.Extensions.Configuration
{
    public static class MultiCloudExtensions
    {
        private const string AzureCloud = "PublicAzure";
        private const string AzureChinaCloud = "Mooncake";
        private const string AzureUSGovernment = "Fairfax";
        private const string AzureUSSec = "USSec";
        private const string AzureUSNat = "USNat";

        /// <summary>
        /// Determines if this cloud is Public Azure cloud.
        /// </summary>
        /// <param name="configuration"></param>
        /// <returns></returns>
        public static bool IsPublicAzure(this IConfiguration configuration)
        {
            return configuration.GetValue<string>("CloudDomain").Equals(AzureCloud, StringComparison.CurrentCultureIgnoreCase);
        }

        /// <summary>
        /// Determines if this cloud is an airgapped cloud.
        /// </summary>
        /// <param name="configuration"></param>
        /// <returns></returns>
        public static bool IsAirGappedCloud(this IConfiguration configuration)
        {
            return configuration.GetValue<string>("CloudDomain").Equals(AzureUSSec, StringComparison.CurrentCultureIgnoreCase) || configuration.GetValue<string>("CloudDomain").Equals(AzureUSNat, StringComparison.CurrentCultureIgnoreCase);
        }

        /// <summary>
        /// Determines if this cloud is mooncake
        /// </summary>
        /// <param name="configuration"></param>
        /// <returns></returns>
        public static bool IsAzureChinaCloud(this IConfiguration configuration)
        {
            return configuration.GetValue<string>("CloudDomain").Equals(AzureChinaCloud, StringComparison.CurrentCultureIgnoreCase);
        }

        /// <summary>
        /// Determines if this cloud is US Gov (Fairfax)
        /// </summary>
        /// <param name="configuration"></param>
        /// <returns></returns>
        public static bool IsAzureUSGovernment(this IConfiguration configuration)
        {
            return configuration.GetValue<string>("CloudDomain").Equals(AzureUSGovernment, StringComparison.CurrentCultureIgnoreCase);
        }

        public static string GetCloudDomain(this IConfiguration configuration)
        {
            return configuration.GetValue<string>("CloudDomain");
        }

    }
}
