using System;
using System.Collections.Generic;

namespace AppLensV3.Services
{
    public class ArmResourceServiceConfig
    {
        /// <summary>
        /// This dictionary contains the kusto query per azure service to give the Arm Id.
        /// Please note:
        /// The kusto query should take only one input : {0}. We will replace this with the resource name.
        /// The kusto query should output atleast one column with title 'armId'.
        /// </summary>
        public static Dictionary<string, Tuple<string, string, string>> ArmKustoQueryPerService = new Dictionary<string, Tuple<string, string, string>>()
        {
            { "microsoft.apimanagement/service:publicazure", new Tuple<string, string, string>("apim", "APIMProd", "GetApimServiceArmResourceId('{0}') | project armId") }
        };
    }
}
