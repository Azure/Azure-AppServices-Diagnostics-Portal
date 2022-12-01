using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;
using System.Net.Http;

namespace AppLensV3.Services
{
    public class NullableSurveysService : ISurveysService
    {
        public async Task<bool> IsEnabled()
        {
            return false;
        }
        Task<string> ISurveysService.GetSurveyInfo(string caseId)
        {
            return null;
        }

        Task<string> ISurveysService.SubmitSurveyResponse(string caseId, object payload)
        {
            return null;
        }
    }
}
