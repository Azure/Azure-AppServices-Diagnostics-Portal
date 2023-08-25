namespace CommonLibrary.Models
{
    public class SemanticServiceConfiguration
    {
        public bool Enabled { get; set; }
        public string Endpoint { get; set; }
        public string Resource { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public bool UseCertAuth { get; set; }
        public string CertSubjectName { get; set; }
    }
}
