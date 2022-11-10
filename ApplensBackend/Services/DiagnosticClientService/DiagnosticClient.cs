using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using System.Security.Cryptography.X509Certificates;
using Microsoft.Extensions.Hosting;

namespace AppLensV3.Services.DiagnosticClientService
{
    public class DiagnosticClient : IDiagnosticClientService
    {
        private IConfiguration _configuration;

        private IWebHostEnvironment environment;

        private HttpClient _client { get; set; }

        private X509Certificate2 Cert { get; set; }

        public string DiagnosticServiceEndpoint
        {
            get
            {
                return _configuration["DiagnosticRole:AppServiceEndpoint"];
            }
        }

        public string CertificateSubjectName
        {
            get
            {
                return _configuration["DiagnosticRole:CertSubjectName"];
            }
        }

        public DiagnosticClient(IConfiguration configuration, IWebHostEnvironment hostEnv)
        {
            _configuration = configuration;
            environment = hostEnv;
            _client = InitializeClient();     
        }

        private HttpClient InitializeClient()
        {
            var handler = new HttpClientHandler();
            var client = new HttpClient(handler)
            {
                BaseAddress = new Uri(DiagnosticServiceEndpoint),
                Timeout = TimeSpan.FromSeconds(5 * 60),
                MaxResponseContentBufferSize = int.MaxValue
            };

            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add("User-Agent", "AppLens");

            if ((environment.IsProduction() || environment.IsStaging()) && !environment.IsEnvironment("NationalCloud"))
            {
                LoadCert();
                byte[] certContent = Cert.Export(X509ContentType.Cert);
                client.DefaultRequestHeaders.Add("x-ms-diagcert", Convert.ToBase64String(certContent));
            }

            return client;
        }

        public async Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalClient = true, bool internalView = true, HttpRequestHeaders additionalHeaders = null)
        {
            HttpResponseMessage response;

            // If running locally or using App Service for Runtimehost, we can send requests directly.
            path = path.TrimStart('/');
            if (new Regex("^v[0-9]+/").Matches(path).Any())
            {
                path = path.Substring(path.IndexOf('/'));
            }

            var requestMessage = new HttpRequestMessage(method.Trim().ToUpper() == "POST" ? HttpMethod.Post : HttpMethod.Get, path)
            {
                Content = new StringContent(body ?? string.Empty, Encoding.UTF8, "application/json")
            };

            requestMessage.Headers.Add(HeaderConstants.InternalClientHeader, internalClient.ToString());
            requestMessage.Headers.Add(HeaderConstants.InternalViewHeader, internalView.ToString());

            if (additionalHeaders != null)
            {
                AddAdditionalHeaders(additionalHeaders, ref requestMessage);
            }

            if (environment.IsEnvironment("NationalCloud"))
            {
                var authToken = await DiagnosticClientToken.Instance.GetAuthorizationTokenAsync();
                requestMessage.Headers.Add("Authorization", authToken);
            }

            response = await _client.SendAsync(requestMessage);
            return response;
        }

        private void AddAdditionalHeaders(HttpRequestHeaders additionalHeaders, ref HttpRequestMessage request)
        {
            foreach (var header in additionalHeaders)
            {
                if (!request.Headers.Contains(header.Key))
                {
                    request.Headers.Add(header.Key, header.Value);
                }
            }
        }

        private void LoadCert()
        {
            X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            certStore.Open(OpenFlags.ReadOnly);

            try
            {
                string subjectNameToSearch = CertificateSubjectName;

                if (string.IsNullOrWhiteSpace(subjectNameToSearch))
                {
                    throw new ArgumentException("Certicate Subject name cannot be empty");
                }

                if (!string.IsNullOrWhiteSpace(subjectNameToSearch) && subjectNameToSearch.StartsWith("CN=", StringComparison.CurrentCultureIgnoreCase))
                {
                    subjectNameToSearch = subjectNameToSearch.Substring(3);
                }

                X509Certificate2Collection certCollection = certStore.Certificates.Find(
                                                            X509FindType.FindBySubjectName,
                                                            subjectNameToSearch,
                                                            true);

                // Get the first cert with the subject name
                if (certCollection.Count > 0)
                {
                    Cert = certCollection[0];
                } else
                {
                    throw new Exception("Certificate was not found");
                }
            }
            catch (Exception ex)
            {
                throw;
            }
            finally
            {
                certStore.Close();
            }
        }
    }
}
