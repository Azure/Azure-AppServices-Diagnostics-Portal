using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Models
{
    public class TPromptRequestModel
    {
        public List<string> inputs { get; set; } = new List<string>();
        public int topK { get; set; } = 1;
    }

    public class TPromptMatchResponseModel
    {
       public string detectorId { get; set; }
       public string detectorName { get; set; }
       public string description { get; set; }
       public string queryName { get; set; }
       public string codeText { get; set; }
    }
}
