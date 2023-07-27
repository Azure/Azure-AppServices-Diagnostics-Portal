using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using AppLensV3.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Services
{
    public class OutageCommunicationService : IOutageCommunicationService
    {
        private IKustoQueryService _kustoQueryService;

        private TimeSpan _commAlertWindow = TimeSpan.FromDays(2);
        private TimeSpan _commExpandedWindow = TimeSpan.FromDays(1);

        private string commsQuery = @"
        set query_results_cache_max_age = time(4h);
        cluster('Icmcluster').database('ACM.Backend'). 
        GetCommunicationsBySubIdAndDateRange(@'{SUBSCRIPTION}', ago(15d), now()) 
        | where CommunicationType == 'Outage'
        | project CommunicationId, PublishedTime, Title, RichTextMessage, Status, Severity, IncidentId, CommunicationType, ImpactedServices, ExternalIncidentId
        | order by PublishedTime asc
        ";

        public OutageCommunicationService(IKustoQueryService kustoQueryService)
        {
            _kustoQueryService = kustoQueryService;
        }

        public async Task<List<Communication>> GetCommunicationsAsync(string subscription, DateTime startTime, DateTime endTime, bool checkEmergingIssues = false, string impactedService = "appservice")
        {
            return await GetAzCommsAsyncInternal(subscription, startTime, endTime, impactedService);
        }

        private async Task<List<Communication>> GetAzCommsAsyncInternal(string subscription, DateTime startTime, DateTime endTime, string impactedService = "appservice")
        {
            if (string.IsNullOrWhiteSpace(subscription))
            {
                throw new ArgumentNullException("subscription");
            }

            if (!Guid.TryParse(subscription, out _))
            {
                throw new ArgumentException("invalid subscription guid");
            }

            if (string.IsNullOrWhiteSpace(impactedService))
            {
                impactedService = "appservice";
            }

            DateTime currentTimeUTC = DateTime.UtcNow;

            string startTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(startTime).ToString("yyyy-MM-dd HH:mm:ss");
            string endTimeStr = DateTimeHelper.GetDateTimeInUtcFormat(endTime).ToString("yyyy-MM-dd HH:mm:ss");

            string kustoQuery = commsQuery
                .Replace("{START_TIME}", startTimeStr)
                .Replace("{END_TIME}", endTimeStr)
                .Replace("{SUBSCRIPTION}", subscription);

            DataTable dt = await _kustoQueryService.ExecuteQueryAsync("Icmcluster", "ACM.Backend", kustoQuery, "GetOutageForSubscription", startTime, endTime);

            List<Communication> commsList = new List<Communication>();

            if (dt == null || dt.Rows == null || dt.Rows.Count == 0)
            {
                return commsList;
            }

            foreach (DataRow row in dt.Rows)
            {
                Communication comm = new Communication
                {
                    CommunicationId = row["CommunicationId"].ToString(),
                    PublishedTime = DateTimeHelper.GetDateTimeInUtcFormat(DateTime.Parse(row["PublishedTime"].ToString())),
                    Title = row["Title"].ToString(),
                    RichTextMessage = row["RichTextMessage"].ToString(),
                    Status = row["Status"].ToString().Equals("Active", StringComparison.OrdinalIgnoreCase) ? CommunicationStatus.Active : CommunicationStatus.Resolved,
                    IncidentId = row["IncidentId"].ToString(),
                    IcmId = row["ExternalIncidentId"].ToString()
                };

                comm.ImpactedServices = GetImpactedRegions(row["ImpactedServices"].ToString());
                commsList.Add(comm);
            }

            commsList = commsList.OrderByDescending(p => p.PublishedTime).ToList();

            Communication mostRecentComm = null;
            Communication latestCommContainingImpactedService = commsList.FirstOrDefault(p => p.ImpactedServices.Exists(q => q.Name.ToLower().Contains(impactedService.ToLower())));

            if (latestCommContainingImpactedService != null)
            {
                // Sometimes Communications belonging to same IncidentId may have different Impacted Services.
                // To accurately identify the latest update:
                // 1) Figure out the latest communication containing impacted service as your service (object : latestCommContainingImpactedService)
                // 2) Now find out the latest communication with the same Incident Id as the first one (object : mostRecentCommWithSameIncidentId)
                mostRecentComm = commsList.FirstOrDefault(p => p.IncidentId.Equals(latestCommContainingImpactedService.IncidentId, StringComparison.OrdinalIgnoreCase));
            }

            // After finding the most recent communication for the impacted Service, show the alert only:
            // a) If the alert is still active, or
            // b) If the published time of the comm is within the _commAlertWindow
            if (mostRecentComm != null
                && (mostRecentComm.Status == CommunicationStatus.Active
                    ||
                    (currentTimeUTC - mostRecentComm.PublishedTime) <= _commAlertWindow))
            {
                mostRecentComm.IsAlert = true;
                mostRecentComm.IsExpanded = mostRecentComm.Status == CommunicationStatus.Active;
            }

            return commsList;
        }

        private List<ImpactedService> GetImpactedRegions(string jsonStr)
        {
            var impactedServices = new List<ImpactedService>();
            if (string.IsNullOrWhiteSpace(jsonStr))
            {
                return impactedServices;
            }

            JToken obj = JsonConvert.DeserializeObject<JToken>(jsonStr);

            foreach (var entry in obj)
            {
                ImpactedService service = new ImpactedService
                {
                    Name = entry["ServiceName"].Value<string>()
                };

                JToken regions = entry["ImpactedRegions"].Value<JToken>();
                foreach (var region in regions)
                {
                    service.Regions.Add(region["RegionName"].Value<string>());
                }

                impactedServices.Add(service);
            }

            return impactedServices;
        }
    }
}