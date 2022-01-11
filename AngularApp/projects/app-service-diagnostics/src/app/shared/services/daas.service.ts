
import { map, mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SiteDaasInfo } from '../models/solution-metadata';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { UriElementsService } from './urielements.service';
import { Session, DiagnoserDefinition, DatabaseTestConnectionResult, MonitoringSession, MonitoringLogsPerInstance, ActiveMonitoringSession, DaasAppInfo, DaasSettings, DaasSasUri, ValidateSasUriResponse, SessionV2 } from '../models/daas';
import { SiteInfoMetaData } from '../models/site';
import { SiteService } from './site.service';

const BlobContainerName: string = "memorydumps";

@Injectable()
export class DaasService {

    public currentSite: SiteDaasInfo;
    constructor(private _armClient: ArmService, private _authService: AuthService,
        private _http: HttpClient, private _uriElementsService: UriElementsService, private _siteService: SiteService) {
    }

    getDaasSessions(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(site);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true));
    }

    submitDaasSession(site: SiteDaasInfo, diagnoser: string, Instances: string[], collectLogsOnly: boolean, blobSasUri: string): Observable<string> {

        const session = new Session();
        session.CollectLogsOnly = collectLogsOnly;
        session.StartTime = '';
        session.RunLive = true;
        session.Instances = Instances;
        session.Diagnosers = [];
        session.Diagnosers.push(diagnoser);
        session.TimeSpan = '00:02:00';
        session.BlobSasUri = blobSasUri;

        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    submitDaasSessionV2(site: SiteDaasInfo, session: SessionV2) {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsV2Url(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    cancelDaasSession(site: SiteDaasInfo, sessionId: string): Observable<boolean> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, 'cancel');
        return <Observable<boolean>>(this._armClient.postResource(resourceUri, null, null, true));
    }

    getDaasSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, 'all', true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasActiveSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, 'active', true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getActiveSession(site: SiteDaasInfo, isWindowsApp: boolean): Observable<SessionV2> {
        let resourceUri: string = this._uriElementsService.getActiveDiagnosticsSessionV2Url(site);
        if (!isWindowsApp) {
            resourceUri = this._uriElementsService.getActiveDiagnosticsSessionV2LinuxUrl(site);
        }
        return <Observable<SessionV2>>this._armClient.getResourceWithoutEnvelope<SessionV2>(resourceUri, null, true);
    }

    getSessionsV2(site: SiteDaasInfo): Observable<SessionV2[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSessionsV2Url(site);
        return <Observable<SessionV2[]>>this._armClient.getResourceWithoutEnvelope<SessionV2>(resourceUri, null, true);
    }

    getSession(site: SiteDaasInfo, sessionId: string): Observable<SessionV2> {
        const resourceUri: string = this._uriElementsService.getDiagnosticSessionV2Url(site, sessionId);
        return <Observable<SessionV2>>this._armClient.getResourceWithoutEnvelope<SessionV2>(resourceUri, null, true);
    }

    getDaasSessionWithDetails(site: SiteDaasInfo, sessionId: string): Observable<Session> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getInstances(site: SiteDaasInfo, isWindowsApp: boolean = true): Observable<string[]> {

        if (isWindowsApp) {
            const resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(site);
            return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri, null, true);
        }

        const resourceUri: string = this._uriElementsService.getInstances(site);
        return this._armClient.getResourceCollection<any>(resourceUri, null, true).pipe(map(response => {
            if (Array.isArray(response) && response.length > 0) {
                let machineNames: string[] = [];
                response.forEach(instance => {
                    if (instance && instance.properties && instance.properties["machineName"]) {
                        machineNames.push(instance.properties["machineName"]);
                    }
                });
                return machineNames;
            }
        }));
    }

    getDiagnosers(site: SiteDaasInfo): Observable<DiagnoserDefinition[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosticsDiagnosersUrl(site);
        return <Observable<DiagnoserDefinition[]>>this._armClient.getResourceWithoutEnvelope<DiagnoserDefinition[]>(resourceUri, null, true);
    }

    getDatabaseTest(site: SiteInfoMetaData): Observable<DatabaseTestConnectionResult[]> {
        const resourceUri: string = this._uriElementsService.getDatabaseTestUrl(site);
        return <Observable<DatabaseTestConnectionResult[]>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getDaasWebjobState(site: SiteDaasInfo): Observable<string> {
        const resourceUri: string = this._uriElementsService.getWebJobs(site);
        return this._armClient.getResourceCollection<any>(resourceUri, null, true).pipe(map(response => {
            if (Array.isArray(response) && response.length > 0) {
                const daasWebJob = response.filter(x => x.id.toLowerCase().endsWith('/daas'));
                if (daasWebJob != null && daasWebJob.length > 0 && daasWebJob[0].properties != null) {
                    return daasWebJob[0].properties.status;
                } else {
                    return '';
                }
            }
        }
        ));
    }

    deleteDaasSession(site: SiteDaasInfo, sessionId: string, isV2: boolean): Observable<any> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionDeleteUrl(site, sessionId);
        if (isV2) {
            resourceUri = this._uriElementsService.getDiagnosticsSingleSessionDeleteV2Url(site, sessionId);
        }
        return <Observable<any>>(this._armClient.deleteResource(resourceUri, null, true));
    }

    getAppInfo(site: SiteDaasInfo): Observable<DaasAppInfo> {
        const resourceUri: string = this._uriElementsService.getAppInfoUrl(site);
        return <Observable<DaasAppInfo>>(this._armClient.getResourceWithoutEnvelope<DaasAppInfo>(resourceUri, null, true));
    }

    getAllMonitoringSessions(site: SiteDaasInfo): Observable<MonitoringSession[]> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionsUrl(site);
        return <Observable<MonitoringSession[]>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession[]>(resourceUri, null, true));
    }

    getMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<MonitoringSession> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionUrl(site, sessionId);
        return <Observable<MonitoringSession>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession>(resourceUri, null, true));
    }
    analyzeMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<any> {
        const resourceUri: string = this._uriElementsService.getAnalyzeMonitoringSessionUrl(site, sessionId);
        return <Observable<any>>(this._armClient.postResource(resourceUri, null, null, true));
    }
    getActiveMonitoringSession(site: SiteDaasInfo): Observable<MonitoringSession> {
        const resourceUri: string = this._uriElementsService.getActiveMonitoringSessionUrl(site);
        return <Observable<MonitoringSession>>(this._armClient.getResourceWithoutEnvelope<MonitoringSession>(resourceUri, null, true));
    }
    getActiveMonitoringSessionDetails(site: SiteDaasInfo): Observable<ActiveMonitoringSession> {
        const resourceUri: string = this._uriElementsService.getActiveMonitoringSessionDetailsUrl(site);
        return <Observable<ActiveMonitoringSession>>(this._armClient.getResourceWithoutEnvelope<ActiveMonitoringSession>(resourceUri, null, true));
    }
    stopMonitoringSession(site: SiteDaasInfo): Observable<string> {
        const resourceUri: string = this._uriElementsService.stopMonitoringSessionUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, null, null, true));
    }

    submitMonitoringSession(site: SiteDaasInfo, session: MonitoringSession): Observable<string> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    deleteMonitoringSession(site: SiteDaasInfo, sessionId: string): Observable<string> {
        const resourceUri: string = this._uriElementsService.getMonitoringSessionUrl(site, sessionId);
        return <Observable<string>>(this._armClient.deleteResource(resourceUri, null, true));
    }

    setBlobSasUri(site: SiteDaasInfo, blobAccount: string, blobKey: string): Observable<boolean> {
        const resourceUri: string = this._uriElementsService.getBlobSasUriUrl(site);
        const settings = new DaasSettings();
        settings.BlobSasUri = "";
        settings.BlobContainer = BlobContainerName.toLowerCase();
        settings.BlobKey = blobKey;
        settings.BlobAccount = blobAccount;
        settings.EndpointSuffix = "";
        if (this._armClient.isNationalCloud) {
            settings.EndpointSuffix = this._armClient.storageUrl;
        }

        return <Observable<boolean>>(this._armClient.postResource(resourceUri, settings, null, true));
    }

    setBlobSasUriAppSetting(site: SiteDaasInfo, blobSasUri: string): Observable<any> {
        return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
            map(settingsResponse => {
                if (settingsResponse && settingsResponse.properties) {
                    if (blobSasUri) {
                        settingsResponse.properties['WEBSITE_DAAS_STORAGE_SASURI'] = blobSasUri;
                    } else {
                        if (settingsResponse.properties['WEBSITE_DAAS_STORAGE_SASURI']) {
                            delete settingsResponse.properties['WEBSITE_DAAS_STORAGE_SASURI'];
                        }
                    }
                    this._siteService.updateSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot, settingsResponse).subscribe(updateResponse => {
                        return updateResponse;
                    });
                }
            }));
    }

    getBlobSasUri(site: SiteDaasInfo): Observable<DaasSasUri> {
        return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
            map(settingsResponse => {
                if (settingsResponse && settingsResponse.properties && settingsResponse.properties["WEBSITE_DAAS_STORAGE_SASURI"] != null) {
                    let daasSasUri: DaasSasUri = { IsAppSetting: true, SasUri: settingsResponse.properties["WEBSITE_DAAS_STORAGE_SASURI"] };
                    return daasSasUri;
                }
            }),
            mergeMap((daasSasUri: DaasSasUri) => {
                if (daasSasUri && daasSasUri.SasUri) {
                    return of(daasSasUri);
                } else {
                    let daasSasUri: DaasSasUri = { IsAppSetting: false, SasUri: '' };
                    return of(daasSasUri);
                }
            }));
    }

    validateSasUri(site: SiteDaasInfo): Observable<ValidateSasUriResponse> {
        const resourceUri: string = this._uriElementsService.getValidateBlobSasUriUrl(site);
        return this._armClient.getResourceWithoutEnvelope<ValidateSasUriResponse>(resourceUri, null, true).pipe(
            map((resp: ValidateSasUriResponse) => {
                return resp;
            }));
    }

    private _getSasUriFromDaasApi(site: SiteDaasInfo): Observable<DaasSasUri> {
        const resourceUri: string = this._uriElementsService.getBlobSasUriUrl(site);
        return this._armClient.getResourceWithoutEnvelope<DaasSettings>(resourceUri, null, true).pipe(
            map((resp: DaasSettings) => {
                let daasSasUri: DaasSasUri = { IsAppSetting: false, SasUri: "" };
                if (resp && resp.BlobSasUri) {
                    daasSasUri.SasUri = resp.BlobSasUri;
                }
                return daasSasUri;
            }));
    }

    putStdoutSetting(resourceUrl: string, enabled: boolean): Observable<{ Stdout: string }> {
        const resourceUri: string = this._uriElementsService.getStdoutSettingUrl(resourceUrl);
        return <Observable<{ Stdout: string }>>this._armClient.putResourceWithoutEnvelope<{ Stdout: string }, any>(resourceUri, { Stdout: enabled ? "Enabled" : "Disabled" });
    }

    get isNationalCloud() {
        return this._armClient.isNationalCloud;
    }

    private _getHeaders(): HttpHeaders {

        const headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        return headers;
    }

    get defaultContainerName(): string {
        return BlobContainerName;
    }
}
