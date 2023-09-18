using System;
using AppLensV3.Helpers;
using CommonLibrary.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace AppLensV3.Services
{
    public class GraphTokenService : TokenServiceBase
    {
        private static readonly Lazy<GraphTokenService> instance = new Lazy<GraphTokenService>(() => new GraphTokenService());

        public static GraphTokenService Instance => instance.Value;

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
            ClientCredential = new ClientCredential(configuration["Graph:ClientId"], configuration["Graph:AppKey"]);
            Resource = GraphConstants.DefaultGraphEndpoint;
            StartTokenRefresh();
        }
    }
}
