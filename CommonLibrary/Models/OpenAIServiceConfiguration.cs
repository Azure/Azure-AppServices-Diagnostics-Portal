namespace CommonLibrary.Models
{
    public class OpenAIServiceConfiguration
    {
        public bool Enabled { get; set; }
        public string Endpoint { get; set; }
        public string GPT3DeploymentAPI { get; set; }
        public string GPT4DeploymentName { get; set; }
        public string GPT35DeploymentName { get; set; }
        public string APIKey { get; set; }
        public bool RedisEnabled { get; set; }
        public string RedisConnectionString { get; set; }
        public int DefaultCacheExpiryInDays { get; set; }
        public string SignalRConnectionString { get; set; }
    }
}
