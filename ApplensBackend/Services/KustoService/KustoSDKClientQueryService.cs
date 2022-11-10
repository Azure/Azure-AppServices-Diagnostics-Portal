using System;
using System.Collections.Concurrent;
using System.Data;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Kusto.Cloud.Platform.Data;
using Kusto.Data;
using Kusto.Data.Common;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace AppLensV3.Services
{
    public class KustoSDKClientQueryService : IKustoQueryService
    {
        private readonly IKustoAuthProvider authProvider = null;

        private static ConcurrentDictionary<Tuple<string, string>, ICslQueryProvider> QueryProviderMapping;

        private static ConcurrentDictionary<string, string> KustoClusterGeoMapping;

        private string aadKustoResource = string.Empty;

        private string kustoApiQueryEndpoint = string.Empty;

        private string KustoApiEndpoint
        {
            get
            {
                var m = Regex.Match(aadKustoResource, @"https://(?<cluster>\w+).");
                if (m.Success)
                {
                    return aadKustoResource.Replace(m.Groups["cluster"].Value, "{cluster}");
                }
                else
                {
                    throw new ArgumentException(nameof(aadKustoResource) + " not correctly formatted.");
                }
            }
        }

        private bool IsRunningLocal
        {
            get
            {
                return string.IsNullOrWhiteSpace(System.Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME"));
            }
        }

        public KustoSDKClientQueryService(IConfiguration configuration, IKustoAuthProvider kustoAuthProvider)
        {
            authProvider = kustoAuthProvider;

            aadKustoResource = $"{configuration["Kusto:AADKustoResource"]}";
            if (string.IsNullOrWhiteSpace(aadKustoResource))
            {
                aadKustoResource = KustoConstants.AADKustoResource;
            }

            kustoApiQueryEndpoint = KustoApiEndpoint + ":443";

            if (QueryProviderMapping == null)
            {
                QueryProviderMapping = new ConcurrentDictionary<Tuple<string, string>, ICslQueryProvider>();
            }

            if (KustoClusterGeoMapping == null)
            {
                KustoClusterGeoMapping = new ConcurrentDictionary<string, string>();
            }
        }

        /// <inheritdoc/>
        public async Task<DataTable> ExecuteQueryAsync(string cluster, string database, string query, string operationName, DateTime? startTime = null, DateTime? endTime = null, int timeoutSeconds = KustoConstants.DefaultQueryTimeoutInSeconds)
        {
            if (string.IsNullOrWhiteSpace(cluster))
            {
                throw new ArgumentNullException(paramName: nameof(cluster), message: "Kusto cluster name against which the query must be executed cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(database))
            {
                throw new ArgumentNullException(paramName: nameof(database), message: "Kusto database name against which the query must be executed cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                throw new ArgumentNullException(paramName: nameof(query), message: "Query text to execute cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(operationName))
            {
                throw new ArgumentNullException(paramName: nameof(operationName), message: "Please specify an operation name to idetify this query.");
            }

            DataSet dataSet = null;
            try
            {
                ClientRequestProperties clientRequestProperties = new ClientRequestProperties();
                var kustoClientId = $"Diagnostics.{operationName};AppLensUI;{startTime?.ToString() ?? "UnknownStartTime"};{endTime?.ToString() ?? "UnknownEndTime"}##{0}_{Guid.NewGuid().ToString()}";
                clientRequestProperties.ClientRequestId = kustoClientId;
                clientRequestProperties.SetOption("servertimeout", new TimeSpan(0, 0, timeoutSeconds));
                if (cluster.StartsWith("waws", StringComparison.OrdinalIgnoreCase) && cluster.EndsWith("follower", StringComparison.OrdinalIgnoreCase))
                {
                    clientRequestProperties.SetOption(ClientRequestProperties.OptionQueryConsistency, ClientRequestProperties.OptionQueryConsistency_Weak);
                }

                var kustoClient = Client(cluster, database);
                var result = await kustoClient.ExecuteQueryAsync(database, query, clientRequestProperties);
                dataSet = result.ToDataSet();
            }
            catch (Exception ex)
            {
                // TODO: Log exception details here.
                throw;
            }

            DataTable datatable = dataSet?.Tables?[0];
            if (datatable == null)
            {
                datatable = new DataTable();
            }

            return datatable;
        }

        public async Task<string> GetKustoClusterByGeoRegion(string geoRegionName)
        {
            geoRegionName = geoRegionName.ToLower();
            if (KustoClusterGeoMapping.Count == 0)
            {
                await LoadKustoClusterGeoMapping();
            }
            if (KustoClusterGeoMapping.ContainsKey(geoRegionName))
            {
                return KustoClusterGeoMapping[geoRegionName];
            }
            else
            {
                return await GetKustoClusterByGeo(geoRegionName);
            }
        }

        private async Task<string> GetKustoClusterByGeo(string geoRegionName)
        {
            string clusterQuery = @$"WawsAn_regionsincluster
                                    | where pdate >= ago(2d)
                                    | where tolower(Region) =~ '{geoRegionName}'
                                    | take 1
                                    | project ClusterName";
            var clusterResult = await ExecuteQueryAsync("wawseusfollower", "wawsprod", clusterQuery, "GetKustoClusterByGeoRegion");
            if (clusterResult.Rows.Count > 0)
            {
                return clusterResult.Rows[0]["ClusterName"].ToString();
            }
            return null;
        }

        private async Task LoadKustoClusterGeoMapping()
        {
            string clusterGeoQuery = @$"WawsAn_regionsincluster
                                    | where pdate >= ago(2d)
                                    | distinct ClusterName, Region";
            var clusterGeoResult = await ExecuteQueryAsync("wawseusfollower", "wawsprod", clusterGeoQuery, "GetKustoClusterGeoMapping");
            if (clusterGeoResult.Rows.Count > 0)
            {
                foreach (DataRow row in clusterGeoResult.Rows)
                {
                    var clusterName = row["ClusterName"].ToString();
                    var geoRegion = row["Region"].ToString().ToLower();
                    if (!KustoClusterGeoMapping.TryAdd(geoRegion, clusterName))
                    {
                        KustoClusterGeoMapping[geoRegion] = clusterName;
                    }
                }
            }
        }

        private string GetClientIdentifyingName()
        {
            return IsRunningLocal ? $"LocalMachine|{System.Environment.MachineName}" : $"{System.Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME")}|{System.Environment.GetEnvironmentVariable("COMPUTERNAME") ?? System.Environment.MachineName}";
        }

        private ICslQueryProvider Client(string cluster, string database)
        {
            var key = Tuple.Create(cluster, database);
            if (!QueryProviderMapping.ContainsKey(key))
            {
                KustoConnectionStringBuilder connectionStringBuilder = new KustoConnectionStringBuilder(kustoApiQueryEndpoint.Replace("{cluster}", cluster), database)
                {
                    ApplicationNameForTracing = GetClientIdentifyingName()
                };
                if (authProvider.AuthDetails.AuthScheme == KustoAuthSchemes.UserAssignedManagedIdentity)
                {
                    connectionStringBuilder = connectionStringBuilder.WithAadUserManagedIdentity(authProvider.AuthDetails.ClientId);
                }
                else
                {
                    if (authProvider.AuthDetails.AuthScheme == KustoAuthSchemes.CertBasedToken)
                    {
                        connectionStringBuilder = connectionStringBuilder.WithAadApplicationSubjectAndIssuerAuthentication(
                            applicationClientId: authProvider.AuthDetails.ClientId,
                            applicationCertificateSubjectDistinguishedName: GenericCertLoader.Instance.GetCertBySubjectName(authProvider.AuthDetails.TokenRequestorCertSubjectName).Subject,
                            applicationCertificateIssuerDistinguishedName: GenericCertLoader.Instance.GetCertBySubjectName(authProvider.AuthDetails.TokenRequestorCertSubjectName).IssuerName.Name,
                            authority: authProvider.AuthDetails.TenantId);
                    }
                    else
                    {
                        if (authProvider.AuthDetails.AuthScheme == KustoAuthSchemes.AppKey)
                        {
                            connectionStringBuilder = connectionStringBuilder.WithAadApplicationKeyAuthentication(
                                applicationClientId: authProvider.AuthDetails.ClientId,
                                applicationKey: authProvider.AuthDetails.AppKey,
                                authority: authProvider.AuthDetails.TenantId);
                        }
                        else
                        {
                            throw new InvalidOperationException("Attempt to create kusto client with invalid configuration. At least one of the auth configuration (User assigned MSI, SN+I, AppKey) must be configured.");
                        }
                    }
                }

                var queryProvider = Kusto.Data.Net.Client.KustoClientFactory.CreateCslQueryProvider(connectionStringBuilder);
                if (!QueryProviderMapping.TryAdd(key, queryProvider))
                {
                    queryProvider.Dispose();
                }
            }

            return QueryProviderMapping[key];
        }
    }
}
