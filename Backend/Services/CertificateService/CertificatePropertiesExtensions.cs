using Azure.Security.KeyVault.Certificates;
using System;

namespace Backend.Services
{
    public static class CertificatePropertiesExtensions
    {
        public static string GetThumbprint(this CertificateProperties certificateProperties)
        {
            return BitConverter.ToString(certificateProperties.X509Thumbprint).Replace("-", "");
        }
    }
}
