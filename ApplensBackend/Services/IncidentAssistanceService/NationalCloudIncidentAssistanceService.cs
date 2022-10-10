using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Models;
using System.Net.Http;

namespace AppLensV3.Services
{
    public class NationalCloudIncidentAssistanceService : IIncidentAssistanceService
    {
        public async Task<bool> IsEnabled()
        {
            return false;
        }
        Task<HttpResponseMessage> IIncidentAssistanceService.GetIncidentInfo(string incidentId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.ValidateAndUpdateIncident(string incidentId, object payload, string update)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.GetOnboardedTeams(string userId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.GetTeamTemplate(string teamId, string incidentType, string userId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.UpdateTeamTemplate(string teamId, string incidentType, object payload, string userId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.GetTeamTemplateAuthors(string teamId, string incidentType, string userId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.UpdateTeamTemplateAuthors(string teamId, string incidentType, object payload, string userId)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.GetAvailableValidations(string teamId, string incidentType, string userId)
        {
            return null;
        }

        Task<List<IncidentInfo>> IIncidentAssistanceService.GetTopIncidentsForTeam(string teamId, string incidentType, int num = 5)
        {
            return null;
        }

        Task<HttpResponseMessage> IIncidentAssistanceService.TestTemplateWithIncident(object payload, string userId)
        {
            return null;
        }
    }
}
