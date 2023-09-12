using CommonLibrary.Models;
using CommonLibrary.Models.Constants;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace CommonLibrary.Services
{
    public class SemanticTokenService : TokenServiceBase
    {
        private static readonly Lazy<SemanticTokenService> instance = new Lazy<SemanticTokenService>(() => new SemanticTokenService());

        public static SemanticTokenService Instance => instance.Value;

        /// <inheritdoc/>
        protected override AuthenticationContext AuthenticationContext { get; set; }

        /// <inheritdoc/>
        protected override ClientCredential ClientCredential { get; set; }

        /// <inheritdoc/>
        protected override string Resource { get; set; }

        /// <summary>
        /// Initializes Graph Token Service with provided config.
        /// </summary>
        public void Initialize(SemanticServiceConfiguration configuration)
        {
            AuthenticationContext = new AuthenticationContext(TokenServiceConstants.MicrosoftTenantAuthorityUrl);
            ClientCredential = new ClientCredential(configuration.ClientId, configuration.ClientSecret);
            Resource = configuration.Resource;
            StartTokenRefresh();
        }
    }
}
