import { Injectable } from '@angular/core';
import { SiteDaasInfo } from '../models/solution-metadata';
import { SiteInfoMetaData } from '../models/site';

@Injectable()
export class UriElementsService {
    private _resourceProviderPrefix: string = "/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/";
    private _siteResource = this._resourceProviderPrefix + "sites/{siteName}";
    private _hostingEnvironmentResource = this._resourceProviderPrefix + "hostingEnvironments/{name}";
    private _slotResource = "/slots/{slot}";

    private _siteRestartUrlFormat: string = "/restart";
    private _listAppSettingsUrlFormat: string = "/config/appsettings/list";
    private _updateAppSettingsUrlFormat: string = "/config/appsettings";

    private _siteResourceDiagnosticsPrefix: string = "/diagnostics";    
    private _diagnosticCategoryFormat: string = this._siteResourceDiagnosticsPrefix + "/{diagnosticCategory}"

    private _analysisResource: string = this._diagnosticCategoryFormat + "/analyses";
    private _analysisResourceFormat: string = this._analysisResource + "/{analysisName}/execute";

    private _detectorsUrlFormat: string = this._diagnosticCategoryFormat + "/detectors";
    private _detectorResourceFormat: string = this._detectorsUrlFormat + "/{detectorName}/execute";

    private _diagnosticProperties: string = this._siteResourceDiagnosticsPrefix + "/properties";
    private _virtualNetworkConnections: string = "/virtualNetworkConnections";

    private _queryStringParams = "?startTime={startTime}&endTime={endTime}";

    private _supportApi: string = 'https://support-bay-api.azurewebsites.net/';
    private _killw3wpUrlFormat: string = this._supportApi + 'sites/{subscriptionId}/{resourceGroup}/{siteName}/killsiteprocess';
    /*
        TODO : Need to add start time and end time parameters
    */

    
    private _diagnosticsPath = "/extensions/daas/api/";
    private _diagnosticsSessionsAllPath = this._diagnosticsPath + "sessions/all";
    private _diagnosticsSessionsPath = this._diagnosticsPath + "sessions";
    private _diagnosticsSessionsDetailsPath = this._diagnosticsPath + "sessions" + "/{type}/{details}";
    private _diagnosticsDiagnosersPath = this._diagnosticsPath + "diagnosers";
    private _diagnosticsInstancesPath = this._diagnosticsPath + "instances";
    private _diagnosticsSingleSessionPath = this._diagnosticsPath + "session/{sessionId}/{details}";
    private _diagnosticsDatabaseTestPath = this._diagnosticsPath + "databasetest";
    private _networkTraceStartPath = "/networkTrace/start"
    private _diagnosticsWebJobStatePath:string = this._supportApi + 'diagnostics/{subscriptionId}/{resourceGroup}/{siteName}/daaswebjobstate';
    private _diagnosticsWebJobStartPath:string = this._supportApi + 'diagnostics/{subscriptionId}/{resourceGroup}/{siteName}/daaswebjobstart';

    getDiagnosticsDiagnosersUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsDiagnosersPath;
    };

    getAllDiagnosticsSessionsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsSessionsAllPath;
    };

    getDiagnosticsSessionsUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsSessionsPath;
    };

    getDiagnosticsSessionsDetailsUrl(site: SiteDaasInfo, type:string, detailed:boolean) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsSessionsDetailsPath.replace("{type}", type)
        .replace("{details}", detailed.toString());
    };

    getDiagnosticsInstancesUrl(site: SiteDaasInfo) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsInstancesPath;
    };

    getNetworkTraceUrl(site:SiteInfoMetaData)
    {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._networkTraceStartPath;
    }

    getVirtualNetworkConnections(subscriptionId:string, resourceGroupName:string, siteName:string, slot:string ='')
    {
        return this._getSiteResourceUrl(subscriptionId, resourceGroupName, siteName, slot) + this._virtualNetworkConnections;
    }

    getDiagnosticsSingleSessionUrl(site: SiteDaasInfo, sessionId: string, detailed: boolean) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsSingleSessionPath
        .replace("{sessionId}", sessionId)
        .replace("{details}", detailed.toString());
    };

    getDatabaseTestUrl(site: SiteInfoMetaData) {
        return this._getSiteResourceUrl(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot) + this._diagnosticsDatabaseTestPath;
    };

    getDaasWebJobStateUrl(site:SiteInfoMetaData)
    {
        var resource = site.siteName;
        if (site.slot !== '') {
            resource = `${site.siteName}(${site.slot})`;
        }

        return this._diagnosticsWebJobStatePath
        .replace('{subscriptionId}', site.subscriptionId)
        .replace('{resourceGroup}', site.resourceGroupName)
        .replace('{siteName}', resource);
    }

    startDaasWebJobUrl(site:SiteInfoMetaData)
    {
        var resource = site.siteName;
        if (site.slot !== '') {
            resource = `${site.siteName}(${site.slot})`;
        }

        return this._diagnosticsWebJobStartPath
        .replace('{subscriptionId}', site.subscriptionId)
        .replace('{resourceGroup}', site.resourceGroupName)
        .replace('{siteName}', resource);
    }

    getSiteRestartUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + this._siteRestartUrlFormat;
    }

    getKillSiteProcessUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = ''): string {

        var resource = siteName;
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
            this._analysisResourceFormat.replace("{diagnosticCategory}", diagnosticCategory).replace("{analysisName}", analysisName) +
            this._getQueryParams(startTime, endTime);
    }

    getDetectorsUrl(subscriptionId: string, resourceGroup: string, siteName: string, diagnosticCategory: string, slot: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) + 
               this._detectorsUrlFormat.replace("{diagnosticCategory}", diagnosticCategory);
    }

    getDetectorResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '', diagnosticCategory: string, detectorName: string, startTime: string = '', endTime: string = ''): string {
        return this._getSiteResourceUrl(subscriptionId, resourceGroup, siteName, slot) +
            this._detectorResourceFormat.replace("{diagnosticCategory}", diagnosticCategory).replace("{detectorName}", detectorName) +
            this._getQueryParams(startTime, endTime);
    }

    getHostingEnvironmentAnalysisResourceUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string, analysisName: string, startTime: string = '', endTime: string = ''): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) +
            this._analysisResourceFormat.replace("{diagnosticCategory}", diagnosticCategory).replace("{analysisName}", analysisName) +
            this._getQueryParams(startTime, endTime);
    }

    getHostingEnvironmentDetectorsUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) + 
               this._detectorsUrlFormat.replace("{diagnosticCategory}", diagnosticCategory);
    }

    getHostingEnvironmentDetectorResourceUrl(subscriptionId: string, resourceGroup: string, name: string, diagnosticCategory: string, detectorName: string, startTime: string = '', endTime: string = ''): string {
        return this._getHostingEnvironmentResourceUrl(subscriptionId, resourceGroup, name) +
            this._detectorResourceFormat.replace("{diagnosticCategory}", diagnosticCategory).replace("{detectorName}", detectorName) +
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

    private _getSiteResourceUrl(subscriptionId: string, resourceGroup: string, siteName: string, slot: string = '') {
        let url = this._siteResource.replace("{subscriptionId}", subscriptionId)
            .replace("{resourceGroup}", resourceGroup)
            .replace("{siteName}", siteName);

        if (slot !== undefined && slot != '') {
            url += this._slotResource.replace('{slot}', slot);
        }

        return url;
    };

    private _getHostingEnvironmentResourceUrl(subscriptionId: string, resourceGroup: string, name: string) {
        return this._hostingEnvironmentResource.replace("{subscriptionId}", subscriptionId)
            .replace("{resourceGroup}", resourceGroup)
            .replace("{name}", name);
    };

    private _getQueryParams(startTime: string, endTime: string): string {
        return this._queryStringParams
            .replace("{startTime}", startTime)
            .replace("{endTime}", endTime);
    };
}