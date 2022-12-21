using System;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;

namespace AppLensV3
{
    public class TokenRequestorFromPFXService
    {
        private IConfiguration _config;
        private GenericCertLoader _certLoader;

        public static readonly string TokenServiceName = "PFXTokenRequestorService";

        public TokenRequestorFromPFXService(IConfiguration config, GenericCertLoader certLoader)
        {
            // Empty for now, keeping it here for any startup operation that may be required later.
            // e.g.. Prefetch the token for any specific provider based ont the config.
            _config = config;
            _certLoader = certLoader;
        }

        /// <summary>
        /// Retrieves a ConfidentialClientApplication corresponding to the certificate.
        /// </summary>
        /// <param name="certificateSubjectName">Subject name of the certificate that is configured as trusted on the AAD app.</param>
        /// <returns>IConfidentialClientApplication that can be used to request tokens.</returns>
        public IConfidentialClientApplication GetClientApp(string certificateSubjectName)
            => string.IsNullOrWhiteSpace(certificateSubjectName) ? null
            : certToClientAppMap.TryGetValue(certificateSubjectName, out IConfidentialClientApplication cApp) ? cApp : null;

        /// <summary>
        /// Gets the authorization token from AAD by passing it the certificate.
        /// Pre-requisite, AAD app must be configured to trust the certificate for subject name + issuer authentication. Configuration to be set in the manifest of the AAD app.
        /// </summary>
        /// <param name="clientId">Client Id of the AAD app that is to be contacted to issue the token.</param>
        /// <param name="aadTenantAuthorityUri">Domain URI of the tenant in which the AAD app resides.
        /// E.g.. https://login.microsoftonline.com/microsoft.onmicrosoft.com for the Microsoft tenant.</param>
        /// <param name="audience">Target resource to whom the token will be sent to. Ensure the audience also includes required scope. The default scope is "{ResourceIdUri/.default}".
        /// <br/>e.g.. https://msazurecloud.onmicrosoft.com/azurediagnostic/.default </param>
        /// <param name="certificateSubjectName">Subject name of the certificate that is configured as trusted on the AAD app.</param>
        /// <param name="isTokenForHTTPRequest">If true, return value is a bearer token that can be directly used in an HTTP header. If false, returned value is the raw token value.</param>
        /// <returns>Returns authorization token indented to be passed to the specified audience if successful.
        /// Empty string if there was an error trying to retreve the token object from the collection.
        /// Exception in case there were errors connecting to AAD to retrieve/refresh the token.</returns>
        public async Task<string> GetAuthorizationTokenAsync(string clientId, Uri aadTenantAuthorityUri, string audience, string certificateSubjectName, bool isTokenForHTTPRequest = true)
        {
            TokenCacheKey cacheKey = new TokenCacheKey(clientId, aadTenantAuthorityUri, audience);
            if (tokenCache.ContainsKey(cacheKey))
            {
                await TryAddTokenCacheItemAsync(cacheKey, certificateSubjectName);
            }

            if (tokenCache.TryGetValue(cacheKey, out TokenCacheValue token))
            {
                return isTokenForHTTPRequest ? await token.GetAuthorizationTokenAsync() : await token.GetAuthorizationTokenRawAsync();
            }

            return string.Empty;
        }

        /// <summary>
        /// Holds the ConfidentialClientApplication per AAD app.
        /// The assumption is that a certificate is not reused with multiple AAD apps (i.e.. a certficate is configured against only one AAD app as trusted).
        /// </summary>
        private ConcurrentDictionary<string, IConfidentialClientApplication> certToClientAppMap = new ConcurrentDictionary<string, IConfidentialClientApplication>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Holds the token cache.
        /// </summary>
        private ConcurrentDictionary<TokenCacheKey, TokenCacheValue> tokenCache = new ConcurrentDictionary<TokenCacheKey, TokenCacheValue>();

        /// <summary>
        /// Adds a new entry in the token cache if one does not already exist for the token.
        /// Also creates and configures a ConfidentialClientApplicationBuilder for the corresponding CertificateSubjectName if one is not already present.
        /// </summary>
        /// <param name="cacheKey">Object of type TokenCacheKey that uniquely identifies a token.</param>
        /// <param name="certificateSubjectName">Subject name of the certificate that is configured as trusted on the AAD app.</param>
        /// <returns>true if the item was successfully added, false otherwise.</returns>
        private async Task<bool> TryAddTokenCacheItemAsync(TokenCacheKey cacheKey, string certificateSubjectName)
        {
            try
            {
                await AddTokenCacheItemAsync(cacheKey, certificateSubjectName);
            }
            catch (Exception)
            {
                return false;
            }

            return true;
        }

        /// <summary>
        /// Adds a new entry in the token cache if one does not already exist for the token.
        /// Also creates and configures a ConfidentialClientApplicationBuilder for the corresponding CertificateSubjectName if one is not already present.
        /// </summary>
        /// <param name="cacheKey">Object of type TokenCacheKey that uniquely identifies a token.</param>
        /// <param name="certificateSubjectName">Subject name of the certificate that is configured as trusted on the AAD app.</param>
        /// <returns>Returns a 2-tuple. First element being the token cache key and the second is the token cache value. These are the objects that were added to the token cache collection.</returns>
        private async Task<Tuple<TokenCacheKey, TokenCacheValue>> AddTokenCacheItemAsync(TokenCacheKey cacheKey, string certificateSubjectName)
        {
            #region Validate params
            if (cacheKey == null)
            {
                throw new ArgumentNullException(paramName: nameof(cacheKey), message: "Please supply a valid token cache key.");
            }

            if (string.IsNullOrWhiteSpace(certificateSubjectName))
            {
                throw new ArgumentNullException(paramName: nameof(certificateSubjectName), message: "Certificate subject name is null or empty. Please supply a valid subject name to lookup.");
            }
            #endregion

            if (!certificateSubjectName.StartsWith("CN=", StringComparison.CurrentCultureIgnoreCase))
            {
                certificateSubjectName = $"CN={certificateSubjectName}";
            }

            certificateSubjectName = certificateSubjectName.ToUpperInvariant();

            if (certToClientAppMap.ContainsKey(certificateSubjectName))
            {
                try
                {
                    IConfidentialClientApplication cApp = ConfidentialClientApplicationBuilder.Create(cacheKey.ClientId)
                                                      .WithCertificate(_certLoader.GetCertBySubjectName(certificateSubjectName))
                                                      .WithAuthority(cacheKey.AadTenantDomainUri, validateAuthority: true)
                                                      .Build();

                    certToClientAppMap.TryAdd(certificateSubjectName, cApp);
                }
                catch (Exception)
                {
                    throw;
                }
            }

            TokenCacheValue cacheValue = new TokenCacheValue(cacheKey.ClientId, cacheKey.Audience, certificateSubjectName, this);
            tokenCache.TryAdd(cacheKey, cacheValue);
            return new Tuple<TokenCacheKey, TokenCacheValue>(cacheKey, cacheValue);
        }
    }

    public class TokenCacheValue
    {
        private TokenRequestorFromPFXService _pfxService;

        /// <summary>
        /// Initializes a new instance of the <see cref="TokenCacheValue"/> class. Provides methods to acquire AAD tokens with support for in-memory token caching and auto referesh.</summary>
        /// <param name="clientId">Client Id of the AAD app that is to be contacted to issue the token.</param>
        /// <param name="audience">Target resource to whom the token will be sent to. Ensure the audience also includes required scope. The default scope is "{ResourceIdUri/.default}".
        /// <br/>e.g.. https://msazurecloud.onmicrosoft.com/azurediagnostic/.default </param>
        /// <param name="certificateSubjectName">Subject name of the certificate that is configured as trusted on the AAD app.</param>
        public TokenCacheValue(string clientId, string audience, string certificateSubjectName, TokenRequestorFromPFXService pfxService)
        {
            _pfxService = pfxService;

            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new ArgumentNullException(paramName: nameof(clientId), message: "Failed to create TokenCacheValue. Please supply a client id for the AAD app from where the token should be requested.");
            }

            if (string.IsNullOrWhiteSpace(audience))
            {
                throw new ArgumentNullException(paramName: nameof(audience), message: "Failed to create TokenCacheValue. Please supply a resource id to whom the token will be sent to.");
            }

            if (string.IsNullOrWhiteSpace(certificateSubjectName))
            {
                throw new ArgumentNullException(paramName: nameof(certificateSubjectName), message: "Failed to create TokenCacheValue. Certificate subject name is null or empty. Please supply a valid subject name to lookup.");
            }

            ClientId = clientId;
            Audience = audience;

            if (!certificateSubjectName.StartsWith("CN=", StringComparison.CurrentCultureIgnoreCase))
            {
                certificateSubjectName = $"CN={certificateSubjectName}";
            }

            CertificateSubjectName = certificateSubjectName.ToUpperInvariant();
        }

        /// <summary>
        /// Gets or Sets Client Id of the AAD app that is to be contacted to issue the token.
        /// </summary>
        private string ClientId { get; set; }

        /// <summary>
        /// Gets or Sets the Audience of the target resource to whom the token will be sent to. Ensure the audience also includes required scope. The default scope is "{ResourceIdUri/.default}".
        /// <br/>e.g.. https://msazurecloud.onmicrosoft.com/azurediagnostic/.default
        /// </summary>
        private string Audience { get; set; }

        /// <summary>
        /// Gets or Sets the Subject name of the certificate that is configured as trusted on the AAD app.
        /// </summary>
        private string CertificateSubjectName { get; set; }

        /// <summary>
        /// Gets or Sets raw result after contacting AAD and acquiring the auth token.
        /// </summary>
        private AuthenticationResult AuthResult { get; set; }

        /// <summary>
        /// Get the raw authorization token string.
        /// </summary>
        /// <returns>Raw authoization token string.</returns>
        public async Task<string> GetAuthorizationTokenRawAsync() => (await this.GetAuthenticationResultRawAsync()).AccessToken;

        /// <summary>
        /// Get the authorization token string that can be directly used in an HTTP call. The returned value is appended with a Bearer idnetifier.
        /// </summary>
        /// <returns>Auth token string formatted to use in HTTP authorization header without any additional manipulations.</returns>
        public async Task<string> GetAuthorizationTokenAsync() => (await this.GetAuthenticationResultRawAsync()).CreateAuthorizationHeader();

        /// <summary>
        /// Retrieves the correct ConfidentialClientApplication corresponding to the certificate and contacts AAD to acquire a new auth token.
        /// If the auth token is valid, AAD is not contacted and the auth token is served from an in-memory cache. In-memory auth tokens are auto refreshed.
        /// </summary>
        /// <returns>Raw result after contacting AAD and acquiring the auth token.</returns>
        private async Task<AuthenticationResult> GetAuthenticationResultRawAsync()
        {
            IConfidentialClientApplication cApp = _pfxService.GetClientApp(this.CertificateSubjectName);
            if (cApp == null)
            {
                throw new Exception("AAD token builder must be setup before trying to acquire a token.");
            }

            DateTime invocationStartTime = DateTime.UtcNow;

            try
            {
                // This method should auto use token cache. As long as the token is valid, calls will not go out to AAD. Tokens are auto refreshed.
                AuthResult = await cApp.AcquireTokenForClient(new string[] { this.Audience })
                    .WithSendX5C(true)
                    .ExecuteAsync().ConfigureAwait(true);

                return this.AuthResult;
            }
            catch (Exception)
            {
                // TODO: Add logging
                throw;
            }
        }
    }

    /// <summary>
    /// Class to uniquely identify a token. A combination of AAD client id + AAD Tenant + Audience is considered unique.
    /// </summary>
    public class TokenCacheKey : IEquatable<TokenCacheKey>
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TokenCacheKey"/> class.
        /// </summary>
        /// <param name="clientId">Client Id of the AAD app that is to be contacted to issue the token.</param>
        /// <param name="aadTenantDomainUri">URI of the AAD tenant in which the AAD app resides.
        /// E.g. https://login.microsoftonline.com/microsoft.onmicrosoft.com for Microsoft domain.</param>
        /// <param name="audience">Target resource to whom the token will be sent to. Ensure the audience also includes required scope. The default scope is "{ResourceIdUri/.default}".
        /// <br/>e.g.. https://msazurecloud.onmicrosoft.com/azurediagnostic/.default </param>
        public TokenCacheKey(string clientId, Uri aadTenantDomainUri, string audience)
        {
            if (string.IsNullOrWhiteSpace(clientId))
            {
                throw new ArgumentNullException(paramName: nameof(clientId), message: "Failed to create TokenCacheKey. Please supply a client id for the AAD app from where the token should be requested.");
            }

            if (string.IsNullOrWhiteSpace(audience))
            {
                throw new ArgumentNullException(paramName: nameof(audience), message: "Failed to create TokenCacheKey. Please supply a resource id to whom the token will be sent to along with the scope of access required.");
            }

            if (aadTenantDomainUri == null)
            {
                throw new ArgumentNullException(paramName: nameof(aadTenantDomainUri), message: "Failed to create TokenCacheKey. Please supply an AAD domain uri where the AAD app is located.");
            }

            ClientId = clientId;
            Audience = audience;
            AadTenantDomainUri = aadTenantDomainUri;
        }

        /// <summary>
        /// Gets client Id of the AAD app that is to be contacted to issue the token.
        /// </summary>
        public string ClientId { get; private set; }

        /// <summary>
        /// Gets domain Uri for the AAD Tenant.
        /// </summary>
        public Uri AadTenantDomainUri { get; private set; }

        /// <summary>
        /// Gets target resource to whom the token will be sent to. Ensure the audience also includes required scope. The default scope is "{ResourceIdUri/.default}".
        /// <br/>e.g.. https://msazurecloud.onmicrosoft.com/azurediagnostic/.default
        /// </summary>
        public string Audience { get; private set; } // Implement this as a List<string> instead of a single string entry.

        public static bool operator ==(TokenCacheKey obj1, TokenCacheKey obj2)
        {
            if (ReferenceEquals(obj1, obj2))
            {
                return true;
            }

            if (ReferenceEquals(obj1, null))
            {
                return false;
            }

            return obj1.Equals(obj2);
        }

        public static bool operator !=(TokenCacheKey obj1, TokenCacheKey obj2) => !(obj1 == obj2);

        public static bool Equals(TokenCacheKey left, TokenCacheKey right)
        {
            return left == right;
        }

        /// <inheritdoc/>
        bool IEquatable<TokenCacheKey>.Equals(TokenCacheKey other)
        {
            return this.Equals(other);
        }

        /// <inheritdoc/>
        public override bool Equals(object other)
        {
            try
            {
                if (ReferenceEquals(this, other))
                {
                    return true;
                }

                if (ReferenceEquals(other, null))
                {
                    return false;
                }

                if (other is TokenCacheKey)
                {
                    TokenCacheKey castedOther = other as TokenCacheKey;

                    return ClientId.Equals(castedOther.ClientId, StringComparison.OrdinalIgnoreCase)
                        && AadTenantDomainUri.Equals(castedOther.AadTenantDomainUri)
                        && Audience.Equals(castedOther.Audience, StringComparison.OrdinalIgnoreCase);
                }
                else
                {
                    return false;
                }
            }
            catch (Exception)
            {
                return false;
            }
        }

        /// <inheritdoc/>
        public override int GetHashCode()
        {
            return ClientId.GetHashCode(StringComparison.OrdinalIgnoreCase) & AadTenantDomainUri.GetHashCode() & Audience.GetHashCode(StringComparison.OrdinalIgnoreCase);
        }
    }
}
