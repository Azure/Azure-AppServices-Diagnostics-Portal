using System;
using AppLensV3.Helpers;
using CommonLibrary.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace AppLensV3.Authorization
{
    public class AuthorizationTokenService : TokenServiceBase
    {
        private static readonly Lazy<AuthorizationTokenService> instance = new Lazy<AuthorizationTokenService>(() => new AuthorizationTokenService());

        public static AuthorizationTokenService Instance => instance.Value;

        /// <inheritdoc/>
        protected override AuthenticationContext AuthenticationContext { get; set; }

        /// <inheritdoc/>
        protected override ClientCredential ClientCredential { get; set; }

        /// <inheritdoc/>
        protected override string Resource { get; set; }

        /// <summary>
        /// Initializes Graph Token Service with provided config.
        /// </summary>
        public void Initialize(IConfiguration configuration)
        {
            AuthenticationContext = new AuthenticationContext(GraphConstants.MicrosoftTenantAuthorityUrl);
            ClientCredential = new ClientCredential(configuration["ApplensAuthorization:ClientId"], configuration["ApplensAuthorization:ClientSecret"]);
            Resource = GraphConstants.DefaultGraphEndpoint;
            StartTokenRefresh();
        }
    }
}
