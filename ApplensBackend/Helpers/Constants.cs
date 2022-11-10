// <copyright file="Constants.cs" company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See LICENSE in the project root for license information.
// </copyright>

using System;

namespace AppLensV3.Helpers
{
    /// <summary>
    /// Github constants.
    /// </summary>
    internal static class GithubConstants
    {
        internal const string RawFileHeaderMediaType = "application/vnd.github.VERSION.raw";
        internal const string TemplatePath = "https://raw.githubusercontent.com/Azure/Azure-AppServices-Diagnostics/main/data/templates/{filename}.csx";
        internal const string SourceFilePathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/{2}.csx?ref={3}";
        internal const string MetadataFilePathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/metadata.json?ref={3}";
        internal const string ConfigPathFormat = "https://api.github.com/repos/{0}/{1}/contents/{2}/package.json?ref={3}";
        internal const string ResourceConfigFormat = "https://api.github.com/repos/{0}/{1}/contents/resourceConfig/config.json?ref={2}";
    }

    /// <summary>
    /// Kusto constants.
    /// </summary>
    internal static class KustoConstants
    {
        internal const string MicrosoftTenantAuthorityId = "72f988bf-86f1-41af-91ab-2d7cd011db47";
        internal const int TokenRefreshIntervalInMs = 10 * 60 * 1000;   // 10 minutes
        internal const string DefaultKustoEndpoint = "https://wawswus.kusto.windows.net";
        internal const string KustoApiEndpointFormat = "https://{0}.kusto.windows.net:443/v1/rest/query";
        internal const string AADKustoResource = "https://wawswus.kusto.windows.net";
        internal const int DefaultQueryTimeoutInSeconds = 60;
        internal static readonly TimeSpan DefaultTimeGrain = TimeSpan.FromMinutes(5);
    }

    internal static class GraphConstants
    {
        internal static readonly TimeSpan DefaultTimeGrain = TimeSpan.FromMinutes(5);
        internal const string MicrosoftTenantAuthorityUrl = "https://login.windows.net/microsoft.com";
        internal const int TokenRefreshIntervalInMs = 10 * 60 * 1000;   // 10 minutes
        internal const string DefaultGraphEndpoint = "https://graph.microsoft.com/";
        internal const string GraphApiEndpointFormat = "https://graph.microsoft.com/v1.0/{0}";
        internal const string GraphUserApiEndpointFormat = "https://graph.microsoft.com/v1.0/users/{0}@microsoft.com";
        internal const string GraphApiCheckMemberGroupsFormat = "https://graph.microsoft.com/v1.0/users/{0}/checkMemberGroups";
        internal const string GraphUserImageApiEndpointFormat = "https://graph.microsoft.com/v1.0/users/{0}@microsoft.com/photo/$value";
    }

    internal static class SelfHelpConstants
    {
        internal const string RawFileHeaderMediaType = "application/vnd.github.VERSION.raw";
        internal const string ArticleTemplatePath = "https://api.github.com/repos/Azure/SelfHelpContent/contents/articles/{0}?ref=master";
    }

    internal static class InsightsConstants
    {
        internal const string SiteResourceTypeName = "sites";
        internal const string HostingEnvironmentResourceTypeName = "hostingEnvironments";
    }

    public static class HeaderConstants
    {
        public const string PathQueryHeader = "x-ms-path-query";
        public const string MethodHeader = "x-ms-method";
        public const string EmailRecipientsHeader = "x-ms-emailRecipients";
        public const string ModifiedByHeader = "x-ms-modifiedBy";
        public const string InternalClientHeader = "x-ms-internal-client";
        public const string InternalViewHeader = "x-ms-internal-view";
        public const string ScriptEtagHeader = "diag-script-etag";
        public const string VerbHeader = "x-ms-verb";
        public const string CustomerCaseNumberHeader = "x-ms-customer-casenumber";
        public const string UserTokenHeader = "x-ms-user-token";
    }

    public static class DetectorGistTemplateServiceConstants
    {
        public const int MaxDiskReadTimeInMilliseconds = 3 * 60 * 1000; // 3 minutes
        public const int ApiTimeoutInMilliseconds = 15 * 1000; // 15 seconds
        public const int MaxCacheTimeInDays = 30;
    }
}
