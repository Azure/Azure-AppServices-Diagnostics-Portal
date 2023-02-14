// <copyright file="IGithubClientService.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System.Collections.Generic;
using System.Threading.Tasks;
using AppLensV3.Models;

namespace AppLensV3
{
    /// <summary>
    /// Interface for github client service.
    /// </summary>
    public interface IGithubClientService
    {
        /// <summary>
        /// Get raw file.
        /// </summary>
        /// <param name="url">The url.</param>
        /// <returns>Task for getting raw file.</returns>
        Task<string> GetRawFile(string url);

        /// <summary>
        /// Get source file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting file.</returns>
        Task<string> GetSourceFile(string id);

        /// <summary>
        /// Get metadata file.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting metadata file.</returns>
        Task<string> GetMetadataFile(string id);

        /// <summary>
        /// Get package configuration.
        /// </summary>
        /// <param name="id">The id.</param>
        /// <returns>Task for getting configuration.</returns>
        Task<string> GetConfiguration(string id);

        /// <summary>
        /// Get all commits.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <returns>Task for getting all commits.</returns>
        Task<List<Commit>> GetAllCommits(string filePath);

        /// <summary>
        /// Get commit content.
        /// </summary>
        /// <param name="filePath">The file path.</param>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting commit content.</returns>
        Task<string> GetCommitContent(string filePath, string sha);

        /// <summary>
        /// Get changed files.
        /// </summary>
        /// <param name="sha">The commit sha.</param>
        /// <returns>Task for getting changed files.</returns>
        Task<IEnumerable<string>> GetChangedFiles(string sha);

        /// <summary>
        /// Get Resource configuration for search
        /// </summary>
        /// <returns>Resource Configuration JSON for search api</returns>
        Task<string> GetResourceConfigFile();

        /// <summary>
        /// Get the workflow json file.
        /// </summary>
        /// <param name="id">WorkflowId</param>
        /// <returns>Workflow client side json</returns>
        Task<string> GetWorkflow(string id);
    }
}
