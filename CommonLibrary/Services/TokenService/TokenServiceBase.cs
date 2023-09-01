using CommonLibrary.Models.Constants;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace CommonLibrary.Services
{
    public abstract class TokenServiceBase
    {
        private Task<AuthenticationResult> acquireTokenTask;
        private bool tokenAcquiredAtleastOnce;

        /// <summary>
        /// Gets AAD issued auth token.
        /// </summary>
        public string AuthorizationToken { get; private set; }

        /// <summary>
        /// Gets or sets class used to retreive auth tokens from AAD.
        /// </summary>
        protected abstract AuthenticationContext AuthenticationContext { get; set; }

        /// <summary>
        /// Gets or sets AAD Client credentials that include client id and secret.
        /// </summary>
        protected abstract ClientCredential ClientCredential { get; set; }

        /// <summary>
        /// Gets or sets AAD Resource.
        /// </summary>
        protected abstract string Resource { get; set; }

        /// <summary>
        /// Acquires Security Token from AAD Authority for the given <see cref="ClientCredential"/> and <see cref="Resource"/>.
        /// </summary>
        public async Task StartTokenRefresh()
        {
            while (true)
            {
                DateTime invocationStartTime = DateTime.UtcNow;
                string exceptionType = string.Empty;
                string exceptionDetails = string.Empty;
                string message = string.Empty;

                try
                {
                    var items = AuthenticationContext.TokenCache.ReadItems();
                    var tokenServiceCacheItems = items.FirstOrDefault(x => x.Resource == Resource);
                    if (tokenServiceCacheItems != null)
                    {
                        AuthenticationContext.TokenCache.DeleteItem(tokenServiceCacheItems);
                    }

                    acquireTokenTask = AuthenticationContext.AcquireTokenAsync(Resource, ClientCredential);
                    AuthenticationResult authResult = await acquireTokenTask;
                    AuthorizationToken = GetAuthTokenFromAuthenticationResult(authResult);
                    tokenAcquiredAtleastOnce = true;
                    message = "Token Acquisition Status : Success";
                }
                catch (Exception ex)
                {
                    exceptionType = ex.GetType().ToString();
                    exceptionDetails = ex.ToString();
                    message = "Token Acquisition Status : Failed";
                }
                finally
                {
                    DateTime invocationEndTime = DateTime.UtcNow;
                    long latencyInMs = Convert.ToInt64((invocationEndTime - invocationStartTime).TotalMilliseconds);
                }

                await Task.Delay(TokenServiceConstants.TokenRefreshIntervalInMs);
            }
        }

        /// <summary>
        /// Gets AAD issued auth token.
        /// </summary>
        public async Task<string> GetAuthorizationTokenAsync()
        {
            if (!tokenAcquiredAtleastOnce)
            {
                var authResult = await acquireTokenTask;
                return GetAuthTokenFromAuthenticationResult(authResult);
            }

            return AuthorizationToken;
        }

        private string GetAuthTokenFromAuthenticationResult(AuthenticationResult authenticationResult)
        {
            return $"{authenticationResult.AccessTokenType} {authenticationResult.AccessToken}";
        }
    }
}
