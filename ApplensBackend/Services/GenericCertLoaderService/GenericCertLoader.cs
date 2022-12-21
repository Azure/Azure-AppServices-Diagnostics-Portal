using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Logging;

namespace AppLensV3
{
    public class GenericCertLoader
    {
        private readonly ILogger _logger;

        private ConcurrentDictionary<string, X509Certificate2> _certCollection = new ConcurrentDictionary<string, X509Certificate2>(StringComparer.OrdinalIgnoreCase);

        public GenericCertLoader(ILogger<GenericCertLoader> logger)
        {
            _logger = logger;
            LoadCertsFromFromUserStore();
        }

        /// <summary>
        /// Load certificates from current-user store in memory.
        /// </summary>
        private void LoadCertsFromFromUserStore()
        {
            X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            certStore.Open(OpenFlags.ReadOnly);
            try
            {
                // Look up only valid certificates that have not expired.
                ProcessCertCollection(certStore.Certificates.Find(X509FindType.FindByTimeValid, DateTime.UtcNow, true));
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error: {ex.Message} occurred while trying to load certs. Stack Trace: {ex.StackTrace} ");
                throw;
            }
            finally
            {
                if (certStore.IsOpen)
                {
                    certStore.Close();
                }

                certStore.Dispose();
            }
        }

#pragma warning disable CA1303 // Do not pass literals as localized parameters
        /// <summary>
        /// Lookup a certificate matching the supplied subject name from in-memory collection.
        /// </summary>
        /// <param name="subjectName">Subject name to match</param>
        /// <returns>X509Certificate2 object matching the supplied subject name. KeyNotFoundException if none is found.</returns>
        public X509Certificate2 GetCertBySubjectName(string subjectName)
        {
            if (!string.IsNullOrWhiteSpace(subjectName))
            {
                if (!subjectName.StartsWith("CN=", StringComparison.CurrentCultureIgnoreCase))
                {
                    subjectName = $"CN={subjectName}";
                }

                if (_certCollection.TryGetValue(subjectName, out X509Certificate2 requestedCert))
                {
                    return requestedCert;
                }

                RetryLoadRequestedCertBySubjectName(subjectName);

                return _certCollection.TryGetValue(subjectName, out X509Certificate2 requestedCertRetry) ? requestedCertRetry : throw new KeyNotFoundException($"Certificate matching {subjectName} subject name was not found. Please validate the subject name.");
            }
            else
            {
                throw new ArgumentNullException(paramName: nameof(subjectName), message: "Subject name is null or empty. Please supply a valid subject name to lookup");
            }
        }
#pragma warning restore CA1303

#pragma warning disable CA1303 // Do not pass literals as localized parameters
        /// <summary>
        /// Lookup a certificate matching the supplied thumbprint from in-memory collection.
        /// </summary>
        /// <param name="thumbprint">Thumbprint to match.</param>
        /// <returns>X509Certificate2 object matching the supplied subject name.
        /// Throws a KeyNotFoundException if no certificate matching the thumbprint is found.</returns>
        public X509Certificate2 GetCertByThumbprint(string thumbprint)
        {
            if (string.IsNullOrWhiteSpace(thumbprint))
            {
                throw new ArgumentNullException(paramName: nameof(thumbprint), message: "Thumbprint is null or empty. Please supply a valid thumbprint to lookup");
            }

            var certToRetrun = _certCollection.Values.Where(cert => cert.Thumbprint.Equals(thumbprint, StringComparison.OrdinalIgnoreCase))?.FirstOrDefault();
            if (certToRetrun == null)
            {
                RetryLoadRequestedCertByThumbprint(thumbprint);
            }

            return _certCollection.Values.Where(cert => cert.Thumbprint.Equals(thumbprint, StringComparison.OrdinalIgnoreCase))?.First() ?? throw new KeyNotFoundException(message: $"Certificate matching the {thumbprint} thumbprint was not found. Please validate the thumbprint.");
        }
#pragma warning restore CA1303

        private string GetSubjectNameForSearchInStore(string subjectName)
        {
            if (string.IsNullOrWhiteSpace(subjectName))
            {
                return string.Empty;
            }

            if (subjectName.StartsWith("CN=", StringComparison.CurrentCultureIgnoreCase))
            {
                return subjectName.Substring(3);
            }

            return subjectName;
        }

        private void ProcessCertCollection(X509Certificate2Collection certCollection, bool isRetry = false)
        {
            if (certCollection != null)
            {
                foreach (X509Certificate2 currCert in certCollection)
                {
                    if (!_certCollection.ContainsKey(currCert.Subject))
                    {
                        _certCollection.TryAdd(currCert.Subject, currCert);
                        _logger.LogInformation($"Successfully loaded cert SubjectName:{currCert.Subject} CertType:{(currCert.HasPrivateKey ? "PFX" : "CER")} isRetry:{isRetry}");
                    }
                }
            }
        }

        private void RetryLoadRequestedCertBySubjectName(string subjectName)
        {
            if (!string.IsNullOrWhiteSpace(subjectName))
            {
                using (X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser))
                {
                    certStore.Open(OpenFlags.ReadOnly);

                    ProcessCertCollection(
                        certCollection: certStore.Certificates.Find(X509FindType.FindBySubjectName, GetSubjectNameForSearchInStore(subjectName), validOnly: true),
                        isRetry: true);
                    certStore.Close();
                }
            }
        }

        private void RetryLoadRequestedCertByThumbprint(string thumbprint)
        {
            if (!string.IsNullOrWhiteSpace(thumbprint))
            {
                using (X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser))
                {
                    certStore.Open(OpenFlags.ReadOnly);

                    ProcessCertCollection(
                        certCollection: certStore.Certificates.Find(X509FindType.FindByThumbprint, thumbprint, validOnly: true),
                        isRetry: true);
                    certStore.Close();
                }
            }
        }
    }
}
