import { Injectable } from '@angular/core';
import { SiteDaasInfo } from '../models/solution-metadata';
import { SiteInfoMetaData } from '../models/site';

@Injectable()
export class UriElementsService {
    private _resourceProviderPrefix: string = '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/';
    private _siteResource = this._resourceProviderPrefix + 'sites/{siteName}';
    private _hostingEnvironmentResource = this._resourceProviderPrefix + 'hostingEnvironments/{name}';
    private _slotResource = '/slots/{slot}';
    private _storageAccountsProviderPrefix: string = '/subscriptions/{subscriptionId}/providers/Microsoft.Storage';
    private _storageAccountResourceProviderPrefix: string = '/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Storage';

    private _listStorageAccounts: string = '/storageAccounts';
    private _listAccountSas: string = '/ListAccountSas';
    private _listStorageKeys: string = '/listKeys';
    private _createStorageAccountFormatUrl: string = '/storageAccounts/{accountName}';
    private _storageContainerFormatUrl: string = '/blobServices/default/containers/{containerName}';

    private _siteRestartUrlFormat: string = '/restart';
    private _listAppSettingsUrlFormat: string = '/config/appsettings/list';
    private _updateAppSettingsUrlFormat: string = '/config/appsettings';
    private _configWebUrlFormat: string = '/config/web';

    private _siteResourceDiagnosticsPrefix: string = '/diagnostics';
    private _diagnosticCategoryFormat: string = this._siteResourceDiagnosticsPrefix + '/{diagnosticCategory}';

    private _analysisResource: string = this._diagnosticCategoryFormat + '/analyses';
    private _analysisResourceFormat: string = this._analysisResource + '/{analysisName}/execute';

    private _detectorsUrlFormat: string = this._diagnosticCategoryFormat + '/detectors';
    private _detectorResourceFormat: string = this._detectorsUrlFormat + '/{detectorName}/execute';

    private _diagnosticProperties: string = this._siteResourceDiagnosticsPrefix + '/properties';
    private _virtualNetworkConnections: string = '/virtualNetworkConnections';

    private _queryStringParams = '?startTime={startTime}&endTime={endTime}';

    private _supportApi: string = 'https://support-bay-api.azurewebsites.net/';
    private _killw3wpUrlFormat: string = this._supportApi + 'sites/{subscriptionId}/{resourceGroup}/{siteName}/killsiteprocess';

    private _instances: string = "/instances"

    /*
        TODO : Need to add start time and end time parameters
    */

    private _daasApiPath = '/extensions/daas/api/';
    private _daasDatabaseTestPath = this._daasApiPath + 'databasetest';
    private _daasAppInfoPath = this._daasApiPath + 'appinfo';
    private _daasCpuMonitoringPath = this._daasApiPath + "CpuMonitoring";
    private _daasStdoutSettingPath = this._daasApiPath + 'settings/stdout';
    private _daasCpuMonitoringSessionActivePath = this._daasCpuMonitoringPath + "/active"
    private _daasCpuMonitoringSessionActivePathDetails = this._daasCpuMonitoringPath + "/activesessiondetails"
    private _daasCpuMonitoringStopPath = this._daasCpuMonitoringPath + "/stop"
    private _daasCpuMonitoringSingleSessionPath = this._daasCpuMonitoringPath + "/{sessionId}";
    private _daasCpuMonitoringAnalyzeSessionPath = this._daasCpuMonitoringPath + "/analyze?sessionId={sessionId}";
    private _daasSettingsPath = this._daasApiPath + 'settings';
    private _daasValidateSasUriPath = this._daasSettingsPath + "/validatesasuri";

    private _networkTraceStartPath = '/networkTrace/start';
    private _webjobsPath: string = '/webjobs';

    private _daasPath = '/extensions/daas';
    private _daasSessionsPath = this._daasPath + '/sessions';
    private _daasDiagnosersPath = this._daasPath + '/diagnosers';
    private _daasActiveSessionPath = this._daasSessionsPath + '/active';
    private _daasSingleSessionPath = this._daasSessionsPath + '/{sessionId}';

    // Linux DiagServer paths
    private _daasDiagServerPath = this._daasPath + "/v2";
    private _daasDiagServerSessionsPath = this._daasDiagServerPath + '/sessions';
    private _daasDiagServerSessionsPathForInstance = this._daasDiagServerSessionsPath + '?instance={instanceId}';
    private _daasDiagServerActiveSessionPath = this._daasDiagServerSessionsPath + '/active';
    private _daasDiagServerSingleSessionPath = this._daasDiagServerSessionsPath + '/{sessionId}';
    private _daasDiagServerSettingsPath = this._daasDiagServerSessionsPath + "/settings";
    private _daasDiagServerValidateStorageAccountPath = this._daasDiagServerSessionsPath + '/validatestorageaccount';

    private _commandPath = '/extensions/command';

    getSessionsUrl(site: SiteDaasInfo, useDiagnosticServerForLinux: boolean) {
        if (useDiagnosticServerForLinux) {
            return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerSessionsPath;
        }
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasSessionsPath;
    }

    getSessionUrl(site: SiteDaasInfo, sessionId: string, useDiagServerForLinux: boolean) {
        if (useDiagServerForLinux) {
            return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerSingleSessionPath
                .replace('{sessionId}', sessionId);
        }
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasSingleSessionPath
            .replace('{sessionId}', sessionId);
    }

    getSessionsForInstanceUrl(site: SiteDaasInfo, instanceId: string) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerSessionsPathForInstance
            .replace('{instanceId}', instanceId);
    }

    getActiveSessionUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasActiveSessionPath;
    }

    getActiveSessionLinuxUrl(site: SiteDaasInfo, useDiagnosticServerForLinux: boolean) {
        if (useDiagnosticServerForLinux) {
            return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerActiveSessionPath;
        }
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasActiveSessionPath;
    }

    getSingleSessionDeleteUrl(site: SiteDaasInfo, sessionId: string, isDiagServerSession: boolean) {
        if (isDiagServerSession) {
            return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerSingleSessionPath
                .replace('{sessionId}', sessionId);
        }

        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasSingleSessionPath
            .replace('{sessionId}', sessionId);
    }

    getDiagnosersUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagnosersPath;
    }

    getNetworkTraceUrl(site: SiteInfoMetaData) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._networkTraceStartPath;
    }

    getVirtualNetworkConnections(subscriptionId: string, resourceGroupName: string, siteName: string, slot: string = '') {
        return this._getSiteResourceUrl(subscriptionId, resourceGroupName, siteName, slot) + this._virtualNetworkConnections;
    }

    getDatabaseTestUrl(site: SiteInfoMetaData) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDatabaseTestPath;
    }

    getAppInfoUrl(site: SiteInfoMetaData) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasAppInfoPath;
    }

    getMonitoringSessionsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringPath;
    }

    getActiveMonitoringSessionUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringSessionActivePath;
    }

    getActiveMonitoringSessionDetailsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringSessionActivePathDetails;
    }
    stopMonitoringSessionUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringStopPath;
    }

    getMonitoringSessionUrl(site: SiteDaasInfo, sessionId: string) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringSingleSessionPath
            .replace('{sessionId}', sessionId);
    }

    getAnalyzeMonitoringSessionUrl(site: SiteDaasInfo, sessionId: string) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasCpuMonitoringAnalyzeSessionPath
            .replace('{sessionId}', sessionId);
    }

    getDaasSettingsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasSettingsPath;
    }

    getValidateBlobSasUriUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasValidateSasUriPath;
    }

    getValidateStorageAccountUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerValidateStorageAccountPath;
    }

    getLinuxDaasSettingsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._daasDiagServerSettingsPath;
    }

    getLinuxCommandUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._commandPath;
    }

    getStdoutSettingUrl(resourceUrl: string) {
        return resourceUrl + this._daasStdoutSettingPath;
    }

    getWebJobs(site: SiteInfoMetaData) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._webjobsPath;
    }

    getSiteRestartUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._siteRestartUrlFormat;
    }

    getRestartUri(resourceUri: string): string {
        return resourceUri + this._siteRestartUrlFormat;
    }

    getKillSiteProcessUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {

        let resource = siteName;
        if (slot !== '') {
            resource = `${siteName}(${slot})`;
        }

        return this._killw3wpUrlFormat
            .replace('{subscriptionId}', subscriptionId)
            .replace('{resourceGroup}', resourceGroup)
            .replace('{siteName}', resource);
    }

    getAnalysisResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, diagnosticCategory: string, analysisName: string, slot: string = '', startTime: string = '', endTime: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._analysisResourceFormat.replace('{diagnosticCategory}', diagnosticCategory).replace('{analysisName}', analysisName) +
            this._getQueryParams(startTime, endTime);
    }

    getDetectorsUrl(subscriptionId: string, resourceGroup: string, siteName: string, diagnosticCategory: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._detectorsUrlFormat.replace('{diagnosticCategory}', diagnosticCategory);
    }

    getDetectorResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '', diagnosticCategory: string, detectorName: string, startTime: string = '', endTime: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._detectorResourceFormat.replace('{diagnosticCategory}', diagnosticCategory).replace('{detectorName}', detectorName) +
            this._getQueryParams(startTime, endTime);
    }

    getHostingEnvironmentAnalysisResourceUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string, analysisName: string, startTime: string = '', endTime: string = ''): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) +
            this._analysisResourceFormat.replace('{diagnosticCategory}', diagnosticCategory).replace('{analysisName}', analysisName) +
            this._getQueryParams(startTime, endTime);
    }

    getHostingEnvironmentDetectorsUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) +
            this._detectorsUrlFormat.replace('{diagnosticCategory}', diagnosticCategory);
    }

    getHostingEnvironmentDetectorResourceUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string, detectorName: string, startTime: string = '', endTime: string = ''): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) +
            this._detectorResourceFormat.replace('{diagnosticCategory}', diagnosticCategory).replace('{detectorName}', detectorName) +
            this._getQueryParams(startTime, endTime);
    }

    getDiagnosticPropertiesUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._diagnosticProperties;
    }

    getListAppSettingsUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._listAppSettingsUrlFormat;
    }

    getUpdateAppSettingsUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._updateAppSettingsUrlFormat;
    }

    getUpdateSettingsUri(resourceUri: string): string {
        return resourceUri + this._updateAppSettingsUrlFormat;
    }

    getConfigWebUrl(site: SiteInfoMetaData): string {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._configWebUrlFormat;
    }

    getStorageAccountsUrl(subscriptionId: string): string {
        return this._storageAccountsProviderPrefix.replace('{subscriptionId}', subscriptionId) + this._listStorageAccounts;
    }

    createStorageAccountsUrl(subscriptionId: string, resourceGroup: string, accountName: string): string {
        return this._storageAccountResourceProviderPrefix.replace('{subscriptionId}', subscriptionId)
            .replace('{resourceGroup}', resourceGroup) + this._createStorageAccountFormatUrl.replace('{accountName}', accountName);
    }

    getStorageContainerUrl(storageAccountId: string, containerName: string): string {
        return storageAccountId + this._storageContainerFormatUrl.replace('{containerName}', containerName);
    }

    createSasUri(storageResourceUri: string): string {
        return storageResourceUri + this._listAccountSas;
    }

    getStorageAccountKeyUrl(storageAccountId: string): string {
        return storageAccountId + this._listStorageKeys;
    }

    getInstances(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._instances;
    }

    private _getSiteResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '') {
        let url = this._siteResource.replace('{subscriptionId}', subscriptionId)
            .replace('{resourceGroup}', resourceGroup)
            .replace('{siteName}', siteName);

        if (slot !== undefined && slot != '') {
            url += this._slotResource.replace('{slot}', slot);
        }

        return url;
    }

    private _getHostingEnvironmentResourceUrl(subscriptionId: string, resourceGroup: string, name: string) {
        return this._hostingEnvironmentResource.replace('{subscriptionId}', subscriptionId)
            .replace('{resourceGroup}', resourceGroup)
            .replace('{name}', name);
    }

    private _getQueryParams(startTime: string, endTime: string): string {
        return this._queryStringParams
            .replace('{startTime}', startTime)
            .replace('{endTime}', endTime);
    }
}
