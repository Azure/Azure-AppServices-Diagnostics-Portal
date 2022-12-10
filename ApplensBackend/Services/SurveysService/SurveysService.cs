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
using System.Text;
using Microsoft.WindowsAzure.Storage;
using Microsoft.WindowsAzure.Storage.Blob;

namespace AppLensV3.Services
{
    public interface ISurveysService
    {
        Task<bool> IsEnabled();
        Task<string> GetSurveyInfo(string caseId);
        Task<string> SubmitSurveyResponse(string caseId, object payload);
    }

    public class SurveysService : ISurveysService
    {
        private bool isEnabled;
        private static string StorageConnectionString;
        private static string BlobContainerName = "surveys";
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

        public SurveysService(IConfiguration configuration)
        {
            if (!bool.TryParse(configuration["Surveys:IsEnabled"].ToString(), out isEnabled))
            {
                isEnabled = false;
            }
            if (isEnabled) {
                StorageConnectionString = configuration["Surveys:StorageConnectionString"].ToString();
            }
        }

        public async Task<bool> IsEnabled()
        {
            return isEnabled;
        }

        public async Task<string> GetSurveyInfo(string caseId)
        {
            if (string.IsNullOrWhiteSpace(caseId))
            {
                throw new ArgumentException("caseId");
            }
            var res = await DownloadFromBlob($"{caseId}.json");
            return res;
        }

        public async Task<string> SubmitSurveyResponse(string caseId, object payload)
        {
            if (string.IsNullOrWhiteSpace(caseId))
            {
                throw new ArgumentException("caseId");
            }
            
            await UploadToBlob(JsonConvert.SerializeObject(payload), $"{caseId}.json");
            return "Response submitted successfully";
        }

        public static async Task UploadToBlob(string content, string blobName) {
            if (CloudStorageAccount.TryParse(StorageConnectionString, out CloudStorageAccount account))
            {
                try
                {
                    var client = account.CreateCloudBlobClient();

                    // Create the blob container
                    var container = client.GetContainerReference(BlobContainerName);
                    await container.CreateIfNotExistsAsync();

                    var blob = container.GetBlockBlobReference(blobName);
                    await blob.UploadTextAsync(content);
                }
                catch (StorageException ex)
                {
                    throw ex;
                }
            }
            else {
                throw new Exception("Failed to parse connection string for surveys storage endpoint.");
            }
        }

        public static async Task<string> DownloadFromBlob(string blobName) {
            if (CloudStorageAccount.TryParse(StorageConnectionString, out CloudStorageAccount account))
            {
                try
                {
                    var client = account.CreateCloudBlobClient();

                    // Create the blob container
                    var container = client.GetContainerReference(BlobContainerName);
                    await container.CreateIfNotExistsAsync();

                    var blob = container.GetBlockBlobReference(blobName);
                    return await blob.DownloadTextAsync();
                }
                catch (StorageException ex)
                {
                    throw ex;
                }
            }
            else {
                throw new Exception("Failed to parse connection string for surveys storage endpoint.");
            }
        }
    }
}