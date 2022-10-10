namespace Backend.Models
{
    public class AppInsightsValidationResponse
    {
        public bool IsValid { get; set; }
        public string UpdatedEncryptionBlob { get; set; } = "";
    }

    public class AppInsightsDecryptionResponse
    {
        public string ApiKey { get; set; } = "";
        public bool UsingExpiredKeyOrCertificate { get; set; } = false;
    }

    public class AppInsightsApiKeySettings
    {
        public string id { get; set; }
        public string name { get; set; }
        public string[] linkedReadProperties { get; set; }
        public string[] linkedWriteProperties { get; set; }
    }

    public class AppInsightsApiKeysResponse
    {
        public AppInsightsApiKeyResponse[] value { get; set; }
    }

    public class AppInsightsApiKeyResponse
    {
        public string id { get; set; }
        public string name { get; set; }
        public string[] linkedReadProperties { get; set; }
        public object[] linkedWriteProperties { get; set; }
        public string apiKey { get; set; }
        public string createdDate { get; set; }
        public object integrationType { get; set; }
        public object integrationProperty { get; set; }
    }

    public class AppInsightsTagValue
    {
        public string AppId { get; set; }
        public string ApiKey { get; set; }
    }

}
