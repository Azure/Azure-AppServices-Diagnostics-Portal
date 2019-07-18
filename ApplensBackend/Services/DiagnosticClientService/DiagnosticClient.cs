﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services.DiagnosticClientService
{
    public class DiagnosticClient : IDiagnosticClientService
    {
        private IConfiguration _configuration;
        private IEmailNotificationService _emailService;
        private HttpClient _client { get; set; }

        private List<string> _nonPassThroughResourceProviderList { get; set; }

        public string AuthCertThumbprint
        {
            get
            {
                return _configuration["DiagnosticsService:authCertThumbprint"];
            }
        }

        public string DiagnosticsServiceEndpoint
        {
            get
            {
                return IsRunTimeHostEnabled
                    ? _configuration["DiagnosticsService:RuntimeHostEndpoint"]
                    : _configuration["DiagnosticsService:endpoint"];
            }
        }

        public bool IsLocalDevelopment
        {
            get
            {
                if (bool.TryParse(_configuration["DiagnosticsService:isLocalDevelopment"], out bool retVal))
                {
                    return retVal;
                }

                return false;
            }
        }

        public bool IsRunTimeHostEnabled
        {
            get
            {
                return _configuration.GetValue<bool>("DiagnosticsService:UseRuntimeHost");
            }
        }

        public DiagnosticClient(IConfiguration configuration)
        {
            _configuration = configuration;
            _client = InitializeClient();
            _nonPassThroughResourceProviderList = new List<string>() { "microsoft.web/sites", "microsoft.web/hostingenvironments" };
        }

        private HttpClient InitializeClient()
        {
            var handler = new HttpClientHandler();

            // For production and runtimehost not enabled, use Cert Auth to talk to DiagnosticsService.
            if (!this.IsLocalDevelopment && !_configuration.GetValue<bool>("DiagnosticsService:UseRuntimeHost"))
            {
                X509Certificate2 certificate = GetMyX509Certificate();
                handler.ClientCertificates.Add(certificate);
                handler.ClientCertificateOptions = ClientCertificateOption.Manual;
                handler.SslProtocols = SslProtocols.Tls12;
                handler.ServerCertificateCustomValidationCallback = (request, cert, chain, errors) =>
                {
                    return true;
                };
            } 

            var client = new HttpClient(handler)
            {
                BaseAddress = new Uri(DiagnosticsServiceEndpoint),
                Timeout = TimeSpan.FromSeconds(5 * 60),
                MaxResponseContentBufferSize = int.MaxValue
            };

            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            return client;
        }

        public async Task<HttpResponseMessage> Execute(string method, string path, string body = null, bool internalClient = true, bool internalView = true, HttpRequestHeaders additionalHeaders = null)
        {
            try
            {
                HttpResponseMessage response;

                if (!IsLocalDevelopment)
                {
                    if (!HitPassThroughApi(path))
                    {
                        var requestMessage = new HttpRequestMessage(method == "POST" ? HttpMethod.Post : HttpMethod.Get, path);
                        requestMessage.Headers.Add("x-ms-internal-client", internalClient.ToString());
                        requestMessage.Headers.Add("x-ms-internal-view", internalView.ToString());
                        if (IsRunTimeHostEnabled)
                        {
                            var authToken = await DiagnosticClientToken.Instance.GetAuthorizationTokenAsync();
                            requestMessage.Headers.Add("Authorization", authToken);
                        }
                        if (method.ToUpper() == "POST")
                        {
                            requestMessage.Content = new StringContent(body ?? string.Empty, Encoding.UTF8, "application/json");
                        }

                        if (additionalHeaders != null)
                        {
                            AddAdditionalHeaders(additionalHeaders, ref requestMessage);
                        }

                        response = await _client.SendAsync(requestMessage);
                    }
                    else
                    {
                        var requestMessage = new HttpRequestMessage(HttpMethod.Post, "api/invoke");
                        requestMessage.Headers.Add("x-ms-path-query", path);
                        requestMessage.Headers.Add("x-ms-internal-client", internalClient.ToString());
                        requestMessage.Headers.Add("x-ms-internal-view", internalView.ToString());
                        requestMessage.Headers.Add("x-ms-verb", method);
                        requestMessage.Content = new StringContent(body ?? string.Empty, Encoding.UTF8, "application/json");
                        if (IsRunTimeHostEnabled)
                        {
                            var authToken = await DiagnosticClientToken.Instance.GetAuthorizationTokenAsync();
                            requestMessage.Headers.Add("Authorization", authToken);
                        }

                        if (additionalHeaders != null)
                        {
                            AddAdditionalHeaders(additionalHeaders, ref requestMessage);
                        }

                        response = await _client.SendAsync(requestMessage);
                    }
                }
                else
                {
                    path = path.TrimStart('/');
                    if (new Regex("^v[0-9]+/").Matches(path).Any())
                    {
                        path = path.Substring(path.IndexOf('/'));
                    }

                    var requestMessage = new HttpRequestMessage(method.Trim().ToUpper() == "POST" ? HttpMethod.Post : HttpMethod.Get, path)
                    {
                        Content = new StringContent(body ?? string.Empty, Encoding.UTF8, "application/json")
                    };

                    if (additionalHeaders != null)
                    {
                        AddAdditionalHeaders(additionalHeaders, ref requestMessage);
                    }

                    if (IsRunTimeHostEnabled)
                    {
                        var authToken = await DiagnosticClientToken.Instance.GetAuthorizationTokenAsync();
                        requestMessage.Headers.Add("Authorization", authToken);
                    }

                    requestMessage.Headers.Add("x-ms-internal-client", internalClient.ToString());
                    requestMessage.Headers.Add("x-ms-internal-view", internalView.ToString());

                    response = await _client.SendAsync(requestMessage);
                }

                return response;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        private bool HitPassThroughApi(string path)
        {
            return !_nonPassThroughResourceProviderList.Exists(p => path.ToLower().Contains(p))
                || new Regex("/detectors/[^/]*/statistics").IsMatch(path.ToLower())
                || path.ToLower().Contains("/diagnostics/publish");
        }

        private X509Certificate2 GetMyX509Certificate()
        {
            X509Store certStore = new X509Store(StoreName.My, StoreLocation.CurrentUser);
            X509Certificate2 cert = null;

            certStore.Open(OpenFlags.ReadOnly);

            try
            {
                X509Certificate2Collection certCollection = certStore.Certificates.Find(
                    X509FindType.FindByThumbprint,
                    AuthCertThumbprint,
                    false);

                // Get the first cert with the thumbprint
                if (certCollection.Count > 0)
                {
                    cert = certCollection[0];
                }
            }
            catch (Exception)
            {
                throw;
            }
            finally
            {
                certStore.Close();
            }

            if (cert == null)
            {
                throw new Exception(string.Format("Certificate with thumbprint {0} could not be found", AuthCertThumbprint));
            }

            return cert;
        }

        private void AddAdditionalHeaders(HttpRequestHeaders additionalHeaders, ref HttpRequestMessage request)
        {
            foreach (var header in additionalHeaders)
            {
                request.Headers.Add(header.Key, header.Value);
            }
        }
    }
}
