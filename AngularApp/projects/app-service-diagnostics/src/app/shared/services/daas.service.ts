
import { map, mergeMap, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SiteDaasInfo } from '../models/solution-metadata';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { UriElementsService } from './urielements.service';
import { DiagnoserDefinition, DatabaseTestConnectionResult, MonitoringSession, MonitoringLogsPerInstance, ActiveMonitoringSession, DaasAppInfo, DaasSettings, ValidateSasUriResponse, Session, LinuxDaasSettings, ValidateStorageAccountResponse, DaasStorageConfiguration, Instance, LinuxCommandOutput, LinuxCommand } from '../models/daas';
import { SiteInfoMetaData } from '../models/site';
import { SiteService } from './site.service';
import { StorageAccountProperties } from '../../shared-v2/services/shared-storage-account.service';
import moment = require('moment');

const BlobContainerName: string = "memorydumps";

@Injectable()
export class DaasService {

    linuxDiagServerEnabled: boolean = false;
    linuxDiagServerEnabledChecked: boolean = false;

    linuxDiagServerStorageConfigured: boolean = false
    linuxDiagServerStorageConfiguredChecked: boolean = false

    public currentSite: SiteDaasInfo;
    constructor(private _armClient: ArmService, private _authService: AuthService,
        private _http: HttpClient, private _uriElementsService: UriElementsService, private _siteService: SiteService) {
    }

    submitDaasSession(site: SiteDaasInfo, session: Session) {
        let resourceUri: string = this._uriElementsService.getSessionsUrl(site, false);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    submitDaasSessionOnInstance(site: SiteDaasInfo, session: Session, instanceId: string) {
        let resourceUri: string = this._uriElementsService.getSessionsForInstanceUrl(site, instanceId);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }

    getActiveSession(site: SiteDaasInfo, isWindowsApp: boolean, useDiagnosticServerForLinux: boolean): Observable<Session> {
        let resourceUri: string = this._uriElementsService.getActiveSessionUrl(site);
        if (!isWindowsApp) {
            resourceUri = this._uriElementsService.getActiveSessionLinuxUrl(site, useDiagnosticServerForLinux);
        }
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getSessions(site: SiteDaasInfo, useDiagnosticServerForLinux: boolean): Observable<Session[]> {
        const resourceUri: string = this._uriElementsService.getSessionsUrl(site, useDiagnosticServerForLinux);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getSession(site: SiteDaasInfo, sessionId: string, useDiagServerForLinux: boolean): Observable<Session> {
        const resourceUri: string = this._uriElementsService.getSessionUrl(site, sessionId, useDiagServerForLinux);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getInstances(site: SiteDaasInfo, isWindowsApp: boolean = true): Observable<Instance[]> {
        const resourceUri: string = this._uriElementsService.getInstances(site);
        return this._armClient.getResourceCollection<any>(resourceUri, null, true).pipe(map(response => {
            if (Array.isArray(response) && response.length > 0) {
                let instances: Instance[] = [];
                response.forEach(instance => {
                    if (instance && instance.properties && instance.properties["machineName"]) {
                        instances.push({ instanceId: instance.properties["name"], machineName: instance.properties["machineName"] });
                    }
                });
                return instances;
            }
        }));
    }

    getDiagnosers(site: SiteDaasInfo): Observable<DiagnoserDefinition[]> {
        const resourceUri: string = this._uriElementsService.getDiagnosersUrl(site);
        return <Observable<DiagnoserDefinition[]>>this._armClient.getResourceWithoutEnvelope<DiagnoserDefinition[]>(resourceUri, null, true);
    }

    getDatabaseTest(site: SiteInfoMetaData): Observable<DatabaseTestConnectionResult[]> {
        const resourceUri: string = this._uriElementsService.getDatabaseTestUrl(site);
        return <Observable<DatabaseTestConnectionResult[]>>this._armClient.getResourceWithoutEnvelope<DatabaseTestConnectionResult[]>(resourceUri, null, true);
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

    deleteDaasSession(site: SiteDaasInfo, sessionId: string, isDiagServerSession: boolean): Observable<any> {
        let resourceUri: string = this._uriElementsService.getSingleSessionDeleteUrl(site, sessionId, isDiagServerSession);
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

    setStorageConfiguration(site: SiteDaasInfo, storageAccountProperties: StorageAccountProperties, useDiagServerForLinux: boolean): Observable<any> {
        let settingValue: string = '';
        let settingName = "WEBSITE_DAAS_STORAGE_SASURI";
        settingValue = storageAccountProperties.sasUri;
        if (useDiagServerForLinux) {
            settingName = "WEBSITE_DAAS_STORAGE_CONNECTIONSTRING";
            settingValue = storageAccountProperties.connectionString;
        }

        return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
            map(settingsResponse => {
                if (settingsResponse && settingsResponse.properties) {
                    if (settingValue) {
                        settingsResponse.properties[settingName] = settingValue;
                    } else {
                        if (settingsResponse.properties[settingName]) {
                            delete settingsResponse.properties[settingName];
                        }
                    }

                    this._siteService.updateSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot, settingsResponse).subscribe(updateResponse => {
                        if (useDiagServerForLinux) {
                            
                            //
                            // Reset this flag so that the daas-sessions component can
                            // get the current value of the storage account and then
                            // poll for the diagServer sessions
                            //

                            this.linuxDiagServerStorageConfiguredChecked = false;
                        }
                        return updateResponse;
                    });
                }
            }));
    }

    getStorageConfiguration(site: SiteDaasInfo, useDiagServerForLinux: boolean): Observable<DaasStorageConfiguration> {
        let settingName = "WEBSITE_DAAS_STORAGE_SASURI";
        if (useDiagServerForLinux) {
            settingName = "WEBSITE_DAAS_STORAGE_CONNECTIONSTRING";
        }

        return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
            map(settingsResponse => {
                if (settingsResponse && settingsResponse.properties && settingsResponse.properties[settingName] != null) {
                    let daasStorageConfiguration: DaasStorageConfiguration = new DaasStorageConfiguration();
                    daasStorageConfiguration.IsAppSetting = true;
                    if (useDiagServerForLinux) {
                        daasStorageConfiguration.ConnectionString = settingsResponse.properties[settingName];
                    } else {
                        daasStorageConfiguration.SasUri = settingsResponse.properties[settingName];
                    }
                    return daasStorageConfiguration;
                }
            }),
            mergeMap((daasStorageConfiguration: DaasStorageConfiguration) => {
                if (daasStorageConfiguration
                    && (daasStorageConfiguration.SasUri || daasStorageConfiguration.ConnectionString)) {
                    return of(daasStorageConfiguration);
                } else {
                    let daasStorageConfig: DaasStorageConfiguration = new DaasStorageConfiguration();
                    return of(daasStorageConfig);
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

    validateStorageAccount(site: SiteDaasInfo): Observable<ValidateStorageAccountResponse> {
        const resourceUri: string = this._uriElementsService.getValidateStorageAccountUrl(site);
        return this._armClient.getResourceWithoutEnvelope<ValidateStorageAccountResponse>(resourceUri, null, true).pipe(
            map((resp: ValidateStorageAccountResponse) => {
                return resp;
            }));
    }

    isStorageAccountConfiguredForDiagServer(site: SiteDaasInfo): Observable<boolean> {
        if (this.linuxDiagServerStorageConfiguredChecked) {
            return of(this.linuxDiagServerStorageConfigured)
        }

        return this._siteService.getSiteAppSettings(site.subscriptionId, site.resourceGroupName, site.siteName, site.slot).pipe(
            map(settingsResponse => {
                if (settingsResponse && settingsResponse.properties) {
                    this.linuxDiagServerStorageConfiguredChecked = true;
                    if (settingsResponse.properties["WEBSITE_DAAS_STORAGE_CONNECTIONSTRING"] != null) {
                        this.linuxDiagServerStorageConfigured = true;
                        return this.linuxDiagServerStorageConfigured;
                    }
                }
            }));
    }

    isDiagServerEnabledForLinux(site: SiteDaasInfo): Observable<boolean> {
        if (this.linuxDiagServerEnabledChecked) {
            return of(this.linuxDiagServerEnabled);
        }

        //
        // Commenting this out because of a bug in /daas/v2/sesssions/settings implementation
        //

        // const resourceUri: string = this._uriElementsService.getLinuxDaasSettingsUrl(site);
        // return this._armClient.getResourceWithoutEnvelope<LinuxDaasSettings>(resourceUri, null, true).pipe(
        //     map((resp: LinuxDaasSettings) => {
        //         this.linuxDiagServerEnabled = resp.DiagnosticServerEnabled;
        //         this.linuxDiagServerEnabledChecked = true;
        //         return this.linuxDiagServerEnabled;
        //     }),
        //     catchError(e => {
        //         this.linuxDiagServerEnabled = false;
        //         this.linuxDiagServerEnabledChecked = true;
        //         return of(this.linuxDiagServerEnabled)
        //     }));

        const resourceUri: string = this._uriElementsService.getLinuxCommandUrl(site);
        let command: LinuxCommand = { command: "printenv WEBSITE_USE_DIAGNOSTIC_SERVER" };
        return this._armClient.postResourceWithoutEnvelope<LinuxCommandOutput, LinuxCommand>(resourceUri, command, null, true).pipe(
            map((resp: LinuxCommandOutput) => {
                if (resp && resp.Output) {
                    this.linuxDiagServerEnabled = resp.Output.toLowerCase().startsWith('true');
                    this.linuxDiagServerEnabledChecked = true;
                    return this.linuxDiagServerEnabled;
                } else {
                    this.linuxDiagServerEnabled = false;
                    this.linuxDiagServerEnabledChecked = true;
                    return this.linuxDiagServerEnabled;
                }
            }),
            catchError(e => {
                this.linuxDiagServerEnabled = false;
                this.linuxDiagServerEnabledChecked = true;
                return of(this.linuxDiagServerEnabled)
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
