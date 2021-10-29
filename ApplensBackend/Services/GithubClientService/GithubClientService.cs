// <copyright file="GithubClientService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Microsoft.Extensions.Configuration;
using Octokit;

namespace AppLensV3
{
    /// <summary>
    /// Github client service.
    /// </summary>
    public class GithubClientService : IGithubClientService
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="GithubClientService"/> class.
        /// </summary>
        /// <param name="configuration">The configuration.</param>
        public GithubClientService(IConfiguration configuration)
        {
            GitHubCache = new ConcurrentDictionary<string, Tuple<string, object>>();
            UserName = configuration["Github:UserName"];
            RepoName = configuration["Github:RepoName"];
            Branch = configuration["Github:Branch"];
            AccessToken = configuration["Github:AccessToken"];
            InitializeHttpClient();

            OctokitClient = new GitHubClient(new Octokit.ProductHeaderValue(UserName))
            {
                Credentials = new Credentials(AccessToken)
            };
        }

        private ConcurrentDictionary<string, Tuple<string, object>> GitHubCache { get; }

        private GitHubClient OctokitClient { get; }

        private HttpClient HttpClient { get; set; }

        private string UserName { get; }

        private string RepoName { get; }

        private string Branch { get; }

        private string AccessToken { get; }

        /// <summary>
        /// Get raw file.
        /// </summary>
        /// <param name="url">The url.</param>
        /// <returns>Task for getting raw file.</returns>
        public async Task<string> GetRawFile(string url)
        {
            TryGetETAGAndCacheValue(url, out string etag, out object cachedValue, out bool isEntryInCache);

            List<KeyValuePair<string, string>> additionalHeaders = new List<KeyValuePair<string, string>>();
            additionalHeaders.Add(new KeyValuePair<string, string>("Accept", GithubConstants.RawFileHeaderMediaType));
            HttpResponseMessage response = await GetInternal(url, etag, additionalHeaders);
            if (response.StatusCode == HttpStatusCode.NotModified)
            {
                if (isEntryInCache)
                {
                    return cachedValue.ToString();
                }

                throw new Exception($"url content not found in cache : {url}");

                // TODO : If entry is not in cache for some reason, we need to fetch it again from github without etag header to refresh the cache
            }

            response.EnsureSuccessStatusCode();
            cachedValue = await response.Content.ReadAsStringAsync();
            etag = GetHeaderValue(response, "ETag").Replace("W/", string.Empty);
            Tuple<string, object> cachedInfo = new Tuple<string, object>(etag, cachedValue);
            GitHubCache.AddOrUpdate(url, cachedInfo, (key, oldvalue) => cachedInfo);

            return cachedValue.ToString();
        }

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting source file.</returns>
        public async Task<string> GetSourceFile(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id));
            }

            var gistFileUrl = string.Format(
                GithubConstants.SourceFilePathFormat,
                UserName,
                RepoName,
                id,
                Branch);

            return await GetRawFile(gistFileUrl);
        }

        /// <summary>
        /// Get metadata file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting metadata file.</returns>
        public async Task<string> GetMetadataFile(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id));
            }

            var gistFileUrl = string.Format(
                GithubConstants.MetadataFilePathFormat,
                UserName,
                RepoName,
                id,
                Branch);

            return await GetRawFile(gistFileUrl);
        }

        /// <summary>
        /// Get Resource configuration for search.
        /// </summary>
        /// <returns>Resource Configuration JSON for search api.</returns>
        public async Task<string> GetResourceConfigFile()
        {
            var resourceConfigFileUrl = string.Format(
                GithubConstants.ResourceConfigFormat,
                UserName,
                RepoName,
                Branch);

            return await GetRawFile(resourceConfigFileUrl);
        }

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        public async Task<string> GetConfiguration(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                throw new ArgumentNullException(nameof(id));
            }

            var gistFileUrl = string.Format(
                GithubConstants.ConfigPathFormat,
                UserName,
                RepoName,
                id,
                Branch);

            return await GetRawFile(gistFileUrl);
        }

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        public async Task<string> GetCommitContent(string filePath, string sha)
        {
            try
            {
                var commitContent = await OctokitClient.Repository.Content.GetAllContentsByRef(UserName, RepoName, filePath, sha);
                return commitContent?[0].Content;
            }
            catch (NotFoundException)
            {
                // Ignore exception and return empty string.
                return string.Empty;
            }
        }

        /// <summary>
        /// Get commit configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit configuration.</returns>
        public async Task<string> GetCommitConfiguration(string id, string sha)
        {
            var filePath = $"{id.ToLower()}/package.json";

            var commitContent = await OctokitClient.Repository.Content.GetAllContentsByRef(UserName, RepoName, filePath, sha);
            return commitContent?[0].Content;
        }

        /// <summary>
        /// Task for getting all commits.
        /// </summary>
        /// <param name="filePath">The filePath.</param>
        /// <returns>Task for getting commits.</returns>
        public async Task<List<Models.Commit>> GetAllCommits(string filePath)
        {
            CommitRequest request = new CommitRequest
            {
                Path = filePath,
                Sha = Branch
            };

            var options = new ApiOptions()
            {
                PageSize = 2,
                PageCount = 30
            };

            var allCommits = await OctokitClient.Repository.Commit.GetAll(UserName, RepoName, request, options);
            var res = new List<Models.Commit>();

            var commits = allCommits
                .Select(p => new Tuple<string, DateTimeOffset, string>(p.Sha, p.Commit.Committer.Date, p.Commit.Message))
                .OrderByDescending(o => o.Item2);

            var previousSha = string.Empty;
            var currentSha = string.Empty;

            var tasks = new List<Task<IEnumerable<string>>>();
            foreach (var c in commits)
            {
                tasks.Add(Task.Run(() => GetChangedFiles(c.Item1)));
            }

            var changedFiles = await Task.WhenAll(tasks);

            for (int i = commits.Count() - 1; i >= 0; i--)
            {
                if (!changedFiles[i].Any())
                {
                    continue;
                }

                var commit = commits.ElementAt(i);
                previousSha = currentSha;
                currentSha = commit.Item1;

                if (commit.Item3.Contains("CommittedBy"))
                {
                    string author = commit.Item3.Split(new string[] { "CommittedBy :" }, StringSplitOptions.RemoveEmptyEntries).Last();
                    author = author.Replace("@microsoft.com", string.Empty, StringComparison.OrdinalIgnoreCase);
                    string date = commit.Item2.ToString().Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).First();

                    res.Add(new Models.Commit(currentSha, author, date, previousSha, changedFiles[i]));
                }
            }

            return res;
        }

        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changed files.</returns>
        public async Task<IEnumerable<string>> GetChangedFiles(string sha)
        {
            var allCommits = await OctokitClient.Repository.Commit.Get(UserName, RepoName, sha);
            return allCommits.Files
                .Where(f =>
                    f.Filename.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ||
                    f.Filename.EndsWith(".csx", StringComparison.OrdinalIgnoreCase))
                .Select(f => f.Filename);
        }

        private async Task<HttpResponseMessage> GetInternal(string url, string etag, List<KeyValuePair<string, string>> additionalHeaders = null)
        {
            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, url);
            if (!string.IsNullOrWhiteSpace(etag))
            {
                request.Headers.Add("If-None-Match", etag);
            }

            if (additionalHeaders != null && additionalHeaders.Any())
            {
                additionalHeaders.ForEach(item => request.Headers.Add(item.Key, item.Value));
            }

            HttpResponseMessage response = await HttpClient.SendAsync(request);

            if (response.StatusCode >= HttpStatusCode.NotFound)
            {
                string exceptionDetails = await response.Content.ReadAsStringAsync();
                throw new Exception($"Github call failed. Http Status Code : {response.StatusCode}, Exception : {exceptionDetails}");
            }

            return response;
        }

        private void TryGetETAGAndCacheValue(string url, out string etag, out object cachedValue, out bool isEntryInCache)
        {
            etag = string.Empty;
            cachedValue = null;
            isEntryInCache = GitHubCache.TryGetValue(url, out Tuple<string, object> cachedInfo);

            if (isEntryInCache)
            {
                etag = cachedInfo.Item1;
                cachedValue = cachedInfo.Item2;
            }
        }

        private void InitializeHttpClient()
        {
            HttpClient = new HttpClient
            {
                MaxResponseContentBufferSize = int.MaxValue,
                Timeout = TimeSpan.FromSeconds(30)
            };

            HttpClient.DefaultRequestHeaders.Add("Authorization", $@"token {AccessToken}");
            HttpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            HttpClient.DefaultRequestHeaders.Add("User-Agent", "applensv3");
        }

        private string GetHeaderValue(HttpResponseMessage responseMsg, string headerName)
        {
            if (responseMsg.Headers.TryGetValues(headerName, out IEnumerable<string> values))
            {
                return values.FirstOrDefault() ?? string.Empty;
            }

            return string.Empty;
        }
    }
}
