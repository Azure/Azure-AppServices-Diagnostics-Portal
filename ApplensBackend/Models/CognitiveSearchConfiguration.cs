namespace AppLensV3.Models
{
    public class CognitiveSearchConfiguration
    {
        public bool Enabled { get; set; }
        public string EndPoint { get; set; }
        public string AdminApiKey { get; set; }
        public string QueryApiKey { get; set; }
    }
}
