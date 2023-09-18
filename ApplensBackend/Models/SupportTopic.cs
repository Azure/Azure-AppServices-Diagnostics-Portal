using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Models
{
    public class SupportTopic
    {
        public string ProductId { get; set; }

        public string SupportTopicId { get; set; }

        public string SapProductId { get; set; }

        public string SapSupportTopicId { get; set; }

        public string ProductName { get; set; }

        public string SupportTopicL2Name { get; set; }

        public string SupportTopicL3Name { get; set; }

        public string SupportTopicPath { get; set; }
    }
}
