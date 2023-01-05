using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Net.Http;
using System.Linq;
using System.Net.Http.Headers;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Services
{
    public interface IGraphClientService
    {
        Task<string> GetOrCreateUserImageAsync(string userId);
        Task<string> GetUserImageAsync(string userId);
        Task<IDictionary<string, string>> GetUsers(string[] users);
        Task<AuthorInfo> GetUserInfoAsync(string userId);

        Task<List<AuthorInfo>> GetSuggestionForAlias(string aliasFilter);
    }

    public class GraphClientService : IGraphClientService
    {
        private IMemoryCache _cache;

        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });

        private HttpClient _httpClient
        {
            get
            {
                return _client.Value;
            }
        }

        public GraphClientService(IMemoryCache cache, IConfiguration configuration)
        {
            _cache = cache;
        }

        public async Task<string> GetOrCreateUserImageAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            var userImage = await
                _cache.GetOrCreateAsync(userId, entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(14);
                    return GetUserImageAsync(userId);
                });

            return userImage;
        }

        public async Task<AuthorInfo> GetUserInfoAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            string authorizationToken = await GraphTokenService.Instance.GetAuthorizationTokenAsync();

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphUserApiEndpointFormat, userId));
            request.Headers.Add("Authorization", authorizationToken);

            CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

            string result = string.Empty;
            AuthorInfo userInfo = null;

            if (responseMsg.IsSuccessStatusCode)
            {
                result = await responseMsg.Content.ReadAsStringAsync();
                dynamic resultObject = JsonConvert.DeserializeObject(result);

                userInfo = new AuthorInfo(
                    resultObject.businessPhones.ToString(),
                    resultObject.displayName.ToString(),
                    resultObject.givenName.ToString(),
                    resultObject.jobTitle.ToString(),
                    resultObject.mail.ToString(),
                    resultObject.officeLocation.ToString(),
                    resultObject.userPrincipalName.ToString());
            }

            return userInfo;
        }

        public async Task<string> GetUserImageAsync(string userId)
        {
            if (string.IsNullOrWhiteSpace(userId))
            {
                throw new ArgumentException("userId");
            }

            var tasks = new List<Task>();

            string authorizationToken = await GraphTokenService.Instance.GetAuthorizationTokenAsync();
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphUserImageApiEndpointFormat, userId));
            request.Headers.Add("Authorization", authorizationToken);

            CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
            HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

            string result = string.Empty;

            // If the status code is 404 NotFound, it might because the user doesn't have a profile picture, or the user alias is invalid.
            // We set the image string to be empty if the response is not successful
            if (responseMsg.IsSuccessStatusCode)
            {
                var content = Convert.ToBase64String(await responseMsg.Content.ReadAsByteArrayAsync());
                result = string.Concat("data:image/jpeg;base64,", content);
            }

            return result;
        }

        public async Task<IDictionary<string, string>> GetUsers(string[] users)
        {

            var tasks = new List<Task>();
            var authorsDictionary = new ConcurrentDictionary<string, string>();

            foreach (var user in users)
            {
                tasks.Add(Task.Run(async () =>
                {
                    var userImage = await GetOrCreateUserImageAsync(user);
                    authorsDictionary.AddOrUpdate(user, userImage, (k, v) => userImage);
                }));
            }

            await Task.WhenAll(tasks);
            return authorsDictionary;
        }

        public async Task<List<AuthorInfo>> GetSuggestionForAlias(string aliasFilter)
        {
            List<AuthorInfo> returnValue = new List<AuthorInfo>();
            if (!string.IsNullOrWhiteSpace(aliasFilter) && !string.Equals(aliasFilter, "undefined", StringComparison.OrdinalIgnoreCase))
            {
                string authorizationToken = await GraphTokenService.Instance.GetAuthorizationTokenAsync();

                // Count will force 'eventual' type processing on the request and orderBy will work.
                string orderByDirective = "$orderBy=displayName%20asc&$count=true";
                string filterDirective = $"$filter=startswith(userPrincipalName,'{System.Web.HttpUtility.UrlEncode(aliasFilter)}')%20and%20endswith(userPrincipalName,'@microsoft.com')";
                string topDirective = "$top=5";

                HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, string.Format(GraphConstants.GraphApiEndpointFormat,
                    $"users?{filterDirective}&{orderByDirective}&{topDirective}"));
                request.Headers.Add("Authorization", authorizationToken);
                request.Headers.Add("ConsistencyLevel", "eventual");

                CancellationTokenSource tokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60));
                HttpResponseMessage responseMsg = await _httpClient.SendAsync(request, tokenSource.Token);

                string result = string.Empty;


                if (responseMsg.IsSuccessStatusCode)
                {
                    string str = "";
                    result = await responseMsg.Content.ReadAsStringAsync();
                    JToken jt = JToken.Parse(result);
                    var searchResults = jt["value"];
                    if (searchResults != null && searchResults.Type == JTokenType.Array)
                    {
                        foreach (dynamic resultObject in searchResults)
                        {
                            returnValue.Add(new AuthorInfo(
                                resultObject.businessPhones.ToString(),
                                resultObject.displayName.ToString(),
                                resultObject.givenName.ToString(),
                                resultObject.jobTitle.ToString(),
                                resultObject.mail.ToString(),
                                resultObject.officeLocation.ToString(),
                                resultObject.userPrincipalName.ToString()));
                        }
                    }
                }
            }

            return returnValue;
        }
    }
}