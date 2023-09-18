using System;
using CommonLibrary.Services;
using Microsoft.IdentityModel.Clients.ActiveDirectory;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services.DiagnosticClientService
{
    /// <summary>
    /// Class used to acquire auth token to connect with RuntimeHost
    /// </summary>
    public class DiagnosticClientToken : TokenServiceBase
    {
        private static readonly Lazy<DiagnosticClientToken> instance = new Lazy<DiagnosticClientToken>(() => new DiagnosticClientToken());
        public static DiagnosticClientToken Instance => instance.Value;
        protected override AuthenticationContext AuthenticationContext { get; set; }
        protected override ClientCredential ClientCredential { get; set; }
        protected override string Resource { get; set; }

        public void Initialize(IConfiguration configuration)
        {
            AuthenticationContext = new AuthenticationContext(configuration["DiagnosticRole:AADAuthority"]);
            ClientCredential = new ClientCredential(configuration["DiagnosticRole:ClientId"], configuration["DiagnosticRole:AppKey"]);
            Resource = configuration["DiagnosticRole:AADResource"];
            StartTokenRefresh();
        }
    }
}
