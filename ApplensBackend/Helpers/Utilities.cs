using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using AppLensV3.Authorization;
using AppLensV3.Models;
using Newtonsoft.Json;

namespace AppLensV3.Helpers
{
    /// <summary>
    /// Utilities Class.
    /// </summary>
    public static class Utilities
    {
        private static readonly Lazy<HttpClient> Client = new Lazy<HttpClient>(() =>
        {
            var client = new HttpClient();
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            return client;
        });

        private static HttpClient HttpClientObj
        {
            get
            {
                return Client.Value;
            }
        }

        /// <summary>
        /// Validates if a user belongs to a security or distribution group.
        /// </summary>
        /// <param name="userAlias">user Alias</param>
        /// <param name="groupObjectId">group object id.</param>
        /// <returns>True, if user is part of the group.</returns>
        public static async Task<bool> CheckUserGroupMembership(string userAlias, string groupObjectId)
        {
            string graphUrl = GraphConstants.GraphApiCheckMemberGroupsFormat;
            var requestUrl = string.Format(graphUrl, userAlias);
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            Dictionary<string, Array> requestParams = new Dictionary<string, Array>();
            string[] groupIds = groupObjectId.Split(",");
            requestParams.Add("groupIds", groupIds);
            string authorizationToken = await AuthorizationTokenService.Instance.GetAuthorizationTokenAsync();
            request.Headers.Add("Authorization", authorizationToken);
            request.Content = new StringContent(JsonConvert.SerializeObject(requestParams), Encoding.UTF8, "application/json");

            HttpResponseMessage responseMsg = await HttpClientObj.SendAsync(request);
            var res = await responseMsg.Content.ReadAsStringAsync();
            dynamic groupIdsResponse = JsonConvert.DeserializeObject(res);
            string[] groupIdsReturned = groupIdsResponse.value.ToObject<string[]>();

            return groupIdsReturned.Length > 0;
        }

        /// <summary>
        /// Checks if detector is marked public.
        /// </summary>
        /// <param name="detectorCodeString">Detector code string.</param>
        /// <returns>True, if detector is marked public.</returns>
        public static bool IsDetectorMarkedPublic(string detectorCodeString)
        {
            if (string.IsNullOrWhiteSpace(detectorCodeString))
            {
                throw new ArgumentNullException(nameof(detectorCodeString));
            }

            // Loose logic to figure out whether the detector is public or not.
            // The challenge is we dont expose this data in detector definition. Need to figure out a better way to know if detector is public or not.
            string trimmedCode = detectorCodeString.Replace(" ", string.Empty).ToLower();
            return trimmedCode.Contains("internalonly=false)") || trimmedCode.Contains("internalonly:false)");
        }

        /// <summary>
        /// Checks if user is allowed to publish a detector.
        /// </summary>
        /// <param name="userAlias">user Alias.</param>
        /// <param name="resourceConfig">resource Config.</param>
        /// <param name="detectorCode">detector Code.</param>
        /// <param name="isOriginalCodeMarkedPublic">if original detector is marked public or not.</param>
        /// <returns>True, if user has access to publish the detector.</returns>
        public static async Task<bool> IsUserAllowedToPublishDetector(string userAlias, ResourceConfig resourceConfig, string detectorCode, bool isOriginalCodeMarkedPublic)
        {
            if (resourceConfig == null || !resourceConfig.PublishAccessControlEnabled || (!isOriginalCodeMarkedPublic && !IsDetectorMarkedPublic(detectorCode)))
            {
                return true;
            }

            string userAliasTrimmed = userAlias.Trim().Split(new char[] { '@' }).FirstOrDefault();

            bool result = false;
            if (!resourceConfig.AllowedUsersToPublish.IsNullOrEmpty())
            {
                result = resourceConfig.AllowedUsersToPublish.Exists(p => p.Equals(userAliasTrimmed, StringComparison.OrdinalIgnoreCase));
            }

            if (!result && !resourceConfig.AllowedGroupsToPublish.IsNullOrEmpty())
            {
                foreach (var group in resourceConfig.AllowedGroupsToPublish)
                {
                    result = await CheckUserGroupMembership(userAlias, group.ObjectIds);
                    if (result)
                    {
                        return result;
                    }
                }
            }

            return result;
        }

        /// <summary>
        /// Gets User Id from Auth token.
        /// </summary>
        /// <param name="authorizationToken">Auth token.</param>
        /// <returns>User Id.</returns>
        public static string GetUserIdFromToken(string authorizationToken)
        {
            string userId = string.Empty;
            if (string.IsNullOrWhiteSpace(authorizationToken))
            {
                throw new ArgumentNullException(nameof(authorizationToken));
            }

            string accessToken = authorizationToken;
            if (authorizationToken.ToLower().Contains("bearer "))
            {
                accessToken = authorizationToken.Split(" ")[1];
            }

            var token = new JwtSecurityToken(accessToken);
            if (token.Payload.TryGetValue("upn", out object upn))
            {
                userId = upn.ToString();
            }

            return userId;
        }

        /// <summary>
        /// Get the common name of the certificate subject name that is the part that part in the subject name that starts with CN=.
        /// </summary>
        /// <param name="certificate">certificate.</param>
        /// <returns>Common Name</returns>
        public static string GetSubjectCommonName(this X509Certificate2 certificate)
        {
            return certificate.Subject.Split(new char[] { ',', '|' }).FirstOrDefault()?.Trim();
        }
    }
}
