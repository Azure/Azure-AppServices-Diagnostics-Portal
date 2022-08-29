using Azure.Identity;
using Azure.Security.KeyVault.Certificates;
using Azure.Security.KeyVault.Secrets;
using Microsoft.ApplicationInsights;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class CertificateService : IHostedService, IDisposable
    {
        private const string ExceptionMessageFeatureDisabled = "The feature to use X509Certificates for encryption is not enabled yet";
        private readonly string _certificateName;
        private readonly string _certificateRefreshIntervalInMinutes;
        private readonly string _keyVaultUri;
        private readonly CertificateClient _certificateClient;
        private readonly SecretClient _secretClient;
        private readonly TelemetryClient _telemetryClient;
        private Timer? _timer = null;
        private X509Certificate2? _currentCertificate;
        private readonly bool _useCertificates = false;
        private readonly ConcurrentDictionary<string, X509Certificate2> _expiredCertificatesCache = new ConcurrentDictionary<string, X509Certificate2>();
        private readonly int _maxExpiredCertificateCount = 5;

        public CertificateService(IConfiguration configuration, IWebHostEnvironment env, TelemetryClient telemetryClient)
        {
            _certificateName = configuration["AppInsights:CertificateName"];
            _certificateRefreshIntervalInMinutes = configuration["AppInsights:CertificateRefreshIntervalInMinutes"];
            _keyVaultUri = configuration[GetKeyVaultforEnvironment(env.EnvironmentName)];
            _certificateClient = new CertificateClient(new Uri(_keyVaultUri), new DefaultAzureCredential());
            _secretClient = new SecretClient(new Uri(_keyVaultUri), new DefaultAzureCredential());
            _telemetryClient = telemetryClient;

            if (int.TryParse(configuration["AppInsights:MaxExpiredCertificateCount"], out int maxExpiredCertificateCount))
            {
                _maxExpiredCertificateCount = maxExpiredCertificateCount;
            }

            if (bool.TryParse(configuration["AppInsights:UseCertificates"], out bool useCertificates))
            {
                _useCertificates = useCertificates;
            }
        }

        public X509Certificate2? GetCertificate()
        {
            if (!_useCertificates)
            {
                throw new InvalidOperationException(ExceptionMessageFeatureDisabled);
            }

            return _currentCertificate;
        }

        public List<X509Certificate2> GetExpiredCertificates()
        {
            if (!_useCertificates)
            {
                throw new InvalidOperationException(ExceptionMessageFeatureDisabled);
            }

            return _expiredCertificatesCache
                .OrderByDescending(x => x.Value.NotAfter)
                .Take(_maxExpiredCertificateCount)
                .Select(x => x.Value)
                .ToList();
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            var refreshInterval = 60;
            if (int.TryParse(_certificateRefreshIntervalInMinutes, out int certificateRefreshIntervalInMinutes))
            {
                refreshInterval = certificateRefreshIntervalInMinutes;
            }

            if (_useCertificates)
            {
                _timer = new Timer(RefreshCertificates, null, TimeSpan.Zero, TimeSpan.FromMinutes(refreshInterval));
            }

            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _timer?.Change(Timeout.Infinite, 0);
            return Task.CompletedTask;
        }

        public void Dispose()
        {
            _timer?.Dispose();
        }

        private void RefreshCertificates(object? state)
        {
            try
            {
                _telemetryClient.TrackTrace("Fetching Certificates from KeyVault");
                var expiredCertificates = new List<X509Certificate2>();
                var certificateVersions = _certificateClient.GetPropertiesOfCertificateVersions(_certificateName).ToArray();
                _telemetryClient.TrackTrace($"Got {certificateVersions.Length} certificate versions in KeyVault for {_certificateName}");
                foreach (var certVersion in certificateVersions)
                {
                    if (certVersion.ExpiresOn <= DateTimeOffset.UtcNow)
                    {
                        string thumbprint = certVersion.GetThumbprint();
                        if (!_expiredCertificatesCache.ContainsKey(thumbprint))
                        {
                            X509Certificate2 x509Cert = CreateX509Certificate(certVersion);
                            expiredCertificates.Add(x509Cert);
                        }
                    }
                    else
                    {
                        if (_currentCertificate == null
                            || !IsMatchingCurrentCertificate(certVersion))
                        {
                            _currentCertificate = CreateX509Certificate(certVersion);
                            _telemetryClient.TrackTrace($"Updated currentCertificate as {_currentCertificate.Thumbprint} {_currentCertificate.Subject}");
                        }
                    }
                }

                if (expiredCertificates.Any())
                {
                    UpdateExpiredCertificates(expiredCertificates);
                }
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackException(ex);
            }
        }

        private bool IsMatchingCurrentCertificate(CertificateProperties certificate)
        {
            if (_currentCertificate == null)
            {
                return false;
            }

            return _currentCertificate.Thumbprint.Equals(certificate.GetThumbprint(), StringComparison.OrdinalIgnoreCase);
        }

        private void UpdateExpiredCertificates(List<X509Certificate2> expiredCertificates)
        {
            foreach (var cert in expiredCertificates)
            {
                if (!_expiredCertificatesCache.ContainsKey(cert.Thumbprint))
                {
                    _telemetryClient.TrackTrace($"Adding expired certificate {cert.Thumbprint} to cache");
                    _expiredCertificatesCache.TryAdd(cert.Thumbprint, cert);
                }
            }

            foreach (var expiredCertificate in _expiredCertificatesCache.Values)
            {
                _telemetryClient.TrackTrace($"Expired certificate {expiredCertificate.Thumbprint} {expiredCertificate.Subject}");
            }
        }

        private X509Certificate2 CreateX509Certificate(CertificateProperties certificateVersion)
        {
            _telemetryClient.TrackTrace($"Creating X509Certificate2 object for {certificateVersion.GetThumbprint()}");
            var certificateSecret = _secretClient.GetSecret(certificateVersion.Name, certificateVersion.Version).Value;
            var privateKey = Convert.FromBase64String(certificateSecret.Value);
            var x509Cert = new X509Certificate2(privateKey, null as string, X509KeyStorageFlags.EphemeralKeySet);
            return x509Cert;
        }

        private string GetKeyVaultforEnvironment(string hostingEnvironment)
        {
            switch (hostingEnvironment)
            {
                case "Production":
                    return "Secrets:ProdKeyVaultName";
                case "Staging":
                    return "Secrets:StagingKeyVaultName";
                case "Development":
                default:
                    return "Secrets:DevKeyVaultName";
            }
        }
    }
}
