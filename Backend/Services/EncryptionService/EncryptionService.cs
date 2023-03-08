using Backend.Models;
using Microsoft.ApplicationInsights;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.IO;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace Backend.Services
{
    public class EncryptionService : IEncryptionService
    {
        private readonly CertificateService? _certificateRefreshService;
        private readonly string _encryptionKey;
        private readonly TelemetryClient _telemetryClient;
        private readonly bool _useCertificates;

        public EncryptionService(IServiceProvider serviceProvider, IConfiguration configuration, TelemetryClient telemetryClient)
        {
            _certificateRefreshService = serviceProvider.GetService<CertificateService>();
            _encryptionKey = configuration["AppInsights:EncryptionKey"];
            _telemetryClient = telemetryClient;
            if (bool.TryParse(configuration["AppInsights:UseCertificates"], out bool useCertificates))
            {
                _useCertificates = useCertificates;
            }
        }

        public string EncryptString(string apiKey)
        {
            if (!_useCertificates)
            {
                return EncryptStringLegacy(apiKey);
            }

            if (_certificateRefreshService == null)
            {
                throw new NullReferenceException("Failed to get instance of CertificateRefreshService");
            }

            X509Certificate2? certificate = _certificateRefreshService.GetCertificate();
            if (certificate == null)
            {
                throw new NullReferenceException("Failed to get the certificate to encrypt");
            }

            using var rsa = certificate.GetRSAPublicKey();
            if (rsa == null)
            {
                throw new NullReferenceException("Failed to get the public key for the certificate");
            }

            var byteArray = rsa.Encrypt(Encoding.UTF8.GetBytes(apiKey), RSAEncryptionPadding.OaepSHA256);
            return Convert.ToBase64String(byteArray);
        }

        public AppInsightsDecryptionResponse DecryptString(string encryptedString)
        {
            if (!_useCertificates)
            {
                var legacyResponse = new AppInsightsDecryptionResponse()
                {
                    UsingExpiredKeyOrCertificate = false,
                    ApiKey = DecryptStringLegacy(encryptedString)
                };

                return legacyResponse;
            }

            if (_certificateRefreshService == null)
            {
                throw new NullReferenceException("Failed to get instance of CertificateRefreshService");
            }

            var response = new AppInsightsDecryptionResponse();
            var data = Convert.FromBase64String(encryptedString);
            X509Certificate2? cert = _certificateRefreshService.GetCertificate();

            //
            // Try decrypting the hash using the current certificate. If this succeeds,
            // then we have the hash encrypted using latest and we are good
            //

            string apiKey = DecryptUsingCertificate(cert, data);
            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                response.ApiKey = apiKey;
                return response;
            }

            //
            // If the current certificate fails, then try decrypting using the expired certs
            //

            foreach (var expiredCert in _certificateRefreshService.GetExpiredCertificates())
            {
                apiKey = DecryptUsingCertificate(expiredCert, data);
                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    response.ApiKey = apiKey;
                    response.UsingExpiredKeyOrCertificate = true;
                    break;
                }
            }

            //
            // If we fail to decrypt using all certs, try decrypting using the legacy
            // encryption technique. This should go away in a few months.
            //

            if (string.IsNullOrWhiteSpace(response.ApiKey))
            {
                response.UsingExpiredKeyOrCertificate = true;
                response.ApiKey = DecryptStringLegacy(encryptedString);
            }

            return response;
        }

        private string DecryptUsingCertificate(X509Certificate2? cert, byte[]? data)
        {
            if (cert == null)
            {
                throw new Exception("Failed to load the certificate to decrypt");
            }

            if (data == null)
            {
                throw new ArgumentNullException(nameof(data));
            }

            _telemetryClient.TrackTrace($"Trying to decrypt data using {cert.Thumbprint} {cert.Subject}");
            using var rsa = cert.GetRSAPrivateKey();
            try
            {
                if (rsa == null)
                {
                    throw new NullReferenceException("Failed to get the private key for the certificate");
                }

                var byteArray = rsa.Decrypt(data, RSAEncryptionPadding.OaepSHA256);
                _telemetryClient.TrackTrace($"Decrypted data successfully using {cert.Thumbprint} {cert.Subject}");
                return Encoding.UTF8.GetString(byteArray);
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackTrace($"Failed to decrypt using certificate {cert.Thumbprint} {cert.Subject}",
                    new Dictionary<string, string>()
                    {
                        {"exception", ex.ToString()}
                    }
                );
            }

            return string.Empty;
        }

        private string DecryptStringLegacy(string encryptedString)
        {
            try
            {
                byte[] iv = new byte[16];
                byte[] buffer = Convert.FromBase64String(encryptedString);

                using (Aes aes = Aes.Create())
                {
                    aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
                    aes.IV = iv;
                    ICryptoTransform decryptor = aes.CreateDecryptor(aes.Key, aes.IV);

                    using (MemoryStream memoryStream = new MemoryStream(buffer))
                    {
                        using (CryptoStream cryptoStream = new CryptoStream(memoryStream, decryptor, CryptoStreamMode.Read))
                        {
                            using (StreamReader streamReader = new StreamReader(cryptoStream))
                            {
                                return streamReader.ReadToEnd();
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _telemetryClient.TrackTrace("Failed to decrypt using legacy encryption method",
                    new Dictionary<string, string>()
                    {
                        {"exception", ex.ToString()}
                    });

                //
                // This is an expected exception if all the stored encryption methods fail to
                // decrypt the key. In this scenario, we must throw UnauthorizedAccessException
                // explicitly so that AppInsightsController can return a 403 instead of BAD request.
                // This will ensure that user will gets option to reconnect AppInsights integration
                // 

                throw new UnauthorizedAccessException("Failed to decrypt using legacy encryption method", ex);
            }
        }

        private string EncryptStringLegacy(string jsonPayload)
        {
            byte[] iv = new byte[16];
            byte[] array;

            using (Aes aes = Aes.Create())
            {
                aes.Key = Encoding.UTF8.GetBytes(_encryptionKey);
                aes.IV = iv;

                ICryptoTransform encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

                using (MemoryStream memoryStream = new MemoryStream())
                {
                    using (CryptoStream cryptoStream = new CryptoStream(memoryStream, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter streamWriter = new StreamWriter(cryptoStream))
                        {
                            streamWriter.Write(jsonPayload);
                        }

                        array = memoryStream.ToArray();
                    }
                }
            }
            return Convert.ToBase64String(array);
        }
    }
}
