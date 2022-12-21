using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Security.Cryptography.X509Certificates;
using System.Text;

namespace AppLensV3
{
    public class SupportObserverCertLoader
    {
        protected string SubjectName { get; set; }

        public X509Certificate2 Cert { get; private set; }

        public SupportObserverCertLoader(IConfiguration configuration, GenericCertLoader certLoader)
        {
            if (configuration.GetValue("Observer:clientCertEnabled", false))
            {
                SubjectName = configuration["Observer:certSubjectName"];
                Cert = !string.IsNullOrWhiteSpace(SubjectName) ? certLoader.GetCertBySubjectName(SubjectName) : throw new Exception("Null or whitespace SupportObserver:CertSubjectName");
            }
        }
    }
}
