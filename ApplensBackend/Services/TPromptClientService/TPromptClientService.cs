using AppLensV3.Models;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class TPromptClientService : ITPromptClientService
    {
        private readonly Lazy<HttpClient> _client = new Lazy<HttpClient>(() =>
        {
            var handler = new HttpClientHandler()
            {
                ClientCertificateOptions = ClientCertificateOption.Manual,
                ServerCertificateCustomValidationCallback =
                       (httpRequestMessage, cert, cetChain, policyErrors) => { return true; }
            };

            var client = new HttpClient(handler);
            client.DefaultRequestHeaders.Accept.Clear();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "Ic5uesGrxCyIKzwBH9CwQn860g6W96af");
            client.BaseAddress = new Uri("https://applens-generate-kusto.eastus2.inference.ml.azure.com/score");
            client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            client.DefaultRequestHeaders.Add("azureml-model-deployment", "blue");
            return client;
        });

        public async Task<List<TPromptMatchResponseModel>> GetSuggestions(string queryName)
        {
            TPromptRequestModel requestContent = new TPromptRequestModel() { inputs = new List<string>() { queryName } };
            var requestBody = JsonConvert.SerializeObject(new
            {
                inputs = new List<string>() { queryName },
                topK = 1
            });

            var content = new StringContent(requestBody);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            HttpResponseMessage response = await _client.Value.PostAsync("", content);
            List<TPromptMatchResponseModel> tPromptResponse = new List<TPromptMatchResponseModel>();
            if (response.IsSuccessStatusCode)
            {
                string result = await response.Content.ReadAsStringAsync();
                dynamic resultObject = JsonConvert.DeserializeObject(result);
                string context = resultObject.prompts[0].context.ToString();
                string matchPattern = @"{'completion':\s?'(?<completion>.*)',\s?'context':\s?'(?<context>.*)'\s?}";
                var matches = Regex.Matches(context, matchPattern);
                foreach (Match match in matches)
                {
                    //webhookdeploy--Continuous deployment operations--Get Query
                    string[] contextSplitted = match.Groups["context"].Value.Split("--");
                    try
                    {
                        tPromptResponse.Add(new TPromptMatchResponseModel()
                        {
                            detectorId =  contextSplitted[0],
                            detectorName = contextSplitted[1],
                            description = contextSplitted.Length == 4 ? contextSplitted[2] : string.Empty,
                            queryName = contextSplitted.Length == 4 ? contextSplitted[3] : contextSplitted[2],
                            codeText = match.Groups.ContainsKey("completion") ? match.Groups["completion"]?.Value : string.Empty
                        });
                    }
                    catch(Exception ex)
                    {
                        _ = 1;
                    }
                }
            }

            return tPromptResponse;
        }
    }

    public interface ITPromptClientService
    {
        public Task<List<TPromptMatchResponseModel>> GetSuggestions(string queryName);
    }
}
