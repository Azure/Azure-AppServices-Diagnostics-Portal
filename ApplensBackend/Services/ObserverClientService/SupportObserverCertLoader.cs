using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace AppLensV3
{
    public class SupportObserverCertLoader
    {
        private static readonly Lazy<SupportObserverCertLoader> _instance = new Lazy<SupportObserverCertLoader>();

        public static SupportObserverCertLoader Instance => _instance.Value;
        protected string SubjectName { get; set; }
        public X509Certificate2 Cert { get; private set; }

        public void Initialize(IConfiguration configuration)
        {
            if (configuration.GetValue("Observer:clientCertEnabled", false))
            {
                SubjectName = configuration["Observer:certSubjectName"];
                Cert = !string.IsNullOrWhiteSpace(SubjectName) ? GenericCertLoader.Instance.GetCertBySubjectName(SubjectName) : throw new Exception("Null or whitespace SupportObserver:CertSubjectName");
            }
        }
    }
}
