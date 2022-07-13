import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { StartupInfo, ResourceType } from '../../models/portal';
import { Verbs } from '../../models/portal';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { SiteService } from '../site.service';
import { AppAnalysisService } from '../appanalysis.service';
import { PortalService } from '../../../startup/services/portal.service';
import { PortalActionService } from '../portal-action.service';
import { AvailabilityLoggingService } from '../logging/availability.logging.service';
import { tap, map, mergeMap, catchError } from 'rxjs/operators';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { ResponseMessageCollectionEnvelope, ResponseMessageEnvelope } from '../../models/responsemessageenvelope';
import { AppInsightsResponse } from '../../models/appinsights';
import { ArmResource } from '../../../shared-v2/models/arm';
import { BackendCtrlService } from '../backend-ctrl.service';
import { RBACService } from '../rbac.service';

const apiVersion: string = "2018-02-01";

@Injectable()
export class AppInsightsService {

    private appInsightsExtension = 'AppInsightsExtension';
    private appInsightsKeyName: string = 'APPSERVICEDIAGNOSTICS_READONLYKEY';
    private appInsightsTagName: string = 'hidden-related:diagnostics/applicationInsightsSettings';
    private appInsightsApiEndpoint: string = 'https://api.applicationinsights.io/v1/apps/';
    private appInsightsAppSettingName: string = 'APPINSIGHTS_INSTRUMENTATIONKEY';

    public appId_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_APPID';
    public appKey_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_APPKEY';
    public resourceUri_AppSettingStr: string = 'SUPPORTCNTR_APPINSIGHTS_URI';

    public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;
    public loadAppDiagnosticPropertiesObservable: BehaviorSubject<boolean>;
    public applicationInsightsValidForApp: BehaviorSubject<boolean>;

    public appInsightsSettings: any = {
        validForStack: undefined,
        enabledForWebApp: undefined,
        connectedWithSupportCenter: undefined,
        resourceUri: undefined,
        name: undefined,
        appId: undefined,
        appSettingsHaveInstrumentationKey: true
    };

    subscriptionId: string;
    resourceGroup: string;
    siteName: string;
    slotName: string;

    constructor(private http: HttpClient, private authService: AuthService, private armService: ArmService,
        private siteService: SiteService, private appAnalysisService: AppAnalysisService, private portalService: PortalService,
        private portalActionService: PortalActionService, private logger: AvailabilityLoggingService, private _telmetryService: TelemetryService,
        private _backendService: BackendCtrlService, private _rbacService: RBACService) {
        this.loadAppInsightsResourceObservable = new BehaviorSubject<boolean>(null);
        this.loadAppDiagnosticPropertiesObservable = new BehaviorSubject<boolean>(null);
        this.applicationInsightsValidForApp = new BehaviorSubject<boolean>(null);

        this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            if (startupInfo.resourceType === ResourceType.Site) {
                this.postCommandToGetAIResource(startupInfo.resourceId);

                const resourceUriParts = siteService.parseResourceUri(startupInfo.resourceId);
                this.subscriptionId = resourceUriParts.subscriptionId;
                this.resourceGroup = resourceUriParts.resourceGroup;
                this.siteName = resourceUriParts.siteName;
                this.slotName = resourceUriParts.slotName;

                this.loadAppInsightsSettings(resourceUriParts.subscriptionId, resourceUriParts.resourceGroup, resourceUriParts.siteName, resourceUriParts.slotName);
            }
        });
    }

    private loadAppInsightsSettings(subscriptionId: string, resourceGroup: string, siteName: string, slotName: string = ''): void {

        // Check the stack of the web app to determine whether App Insights can be shown as an option
        this.appAnalysisService.getDiagnosticProperties(subscriptionId, resourceGroup, siteName, slotName).subscribe(data => {

            if (data && data.appStack && data.appStack.toLowerCase().indexOf('asp.net') > -1) {
                this.appInsightsSettings.validForStack = true;
            } else {
                // Sometimes stack comes back unknown for site, even though it is valid
                // Allow for this to set to false only if below subscribe has not already set it valid
                if (this.appInsightsSettings.validForStack === undefined) {
                    this.appInsightsSettings.validForStack = false;
                    this.applicationInsightsValidForApp.next(this.appInsightsSettings.validForStack);
                }
            }

            this.loadAppDiagnosticPropertiesObservable.next(true);
        });

        // Check if App insights is already enabled for the web app.
        this.getAppInsightsResourceForWebApp().subscribe((aiResource: string) => {
            if (aiResource && aiResource !== '') {
                this.appInsightsSettings.validForStack = true;
                this.appInsightsSettings.enabledForWebApp = true;
                this.appInsightsSettings.resourceUri = aiResource;

                this.applicationInsightsValidForApp.next(this.appInsightsSettings.validForStack);

                // Do a get on the resource to fill the app id and name.
                this.armService.getResourceWithoutEnvelope(aiResource, '2015-05-01').subscribe((armResponse: any) => {
                    if (armResponse && armResponse.properties) {
                        if (this.isNotNullOrEmpty(armResponse.properties['AppId'])) {
                            this.appInsightsSettings.appId = armResponse.properties['AppId'];
                        }

                        if (this.isNotNullOrEmpty(armResponse.properties['Name'])) {
                            this.appInsightsSettings.name = armResponse.properties['Name'];
                        }
                    }
                    this.loadAppInsightsResourceObservable.next(true);
                });
            } else {
                this.appInsightsSettings.enabledForWebApp = false;
                this.loadAppInsightsResourceObservable.next(false);
            }

            this.logger.LogAppInsightsSettings(this.appInsightsSettings.enabledForWebApp);
        }, error => {
            this.loadAppInsightsResourceObservable.next(false);
        });
    }

    private postCommandToGetAIResource(resouceUri: string) {

        this.portalService.postMessage(Verbs.getAppInsightsResource, JSON.stringify({
            resourceUri: resouceUri
        }));
    }

    CheckIfAppInsightsEnabled(): Observable<boolean> {
        let appInsightsEnabled: boolean = false;
        return this.getAppInsightsResourceForWebApp().pipe(map(resp => {
            appInsightsEnabled = this.isNotNullOrEmpty(resp);
            return appInsightsEnabled;
        }));
    }

    getAppInsightsResourceForWebApp(): Observable<string> {

        return this.portalService.getAppInsightsResourceInfo().pipe(
            map((aiResource: string) => {
                if (this.isNotNullOrEmpty(aiResource)) {
                    return aiResource;
                }
            }),
            mergeMap(aiResource => {
                if (!this.isNotNullOrEmpty(aiResource)) {
                    return this.getAppInsightsResourceFromAppSettings();
                } else {
                    return of(aiResource);
                }
            }));
    }

    getAppInsightsResourceFromAppSettings(): Observable<string> {
        return this.siteService.getSiteAppSettings(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName).pipe(
            map((settingsResponse) => {
                if (settingsResponse && settingsResponse.properties) {
                    if (settingsResponse.properties[this.appInsightsAppSettingName] != null) {
                        let instrumentationKey = settingsResponse.properties[this.appInsightsAppSettingName];
                        return instrumentationKey;
                    }
                }
            }),
            mergeMap(instrumentationKey => {
                if (this.isNotNullOrEmpty(instrumentationKey)) {
                    this.appInsightsSettings.appSettingsHaveInstrumentationKey = true;
                    return this.getAppInsightsResourceForInstrumentationKey(instrumentationKey, this.subscriptionId);
                } else {
                    this.appInsightsSettings.appSettingsHaveInstrumentationKey = false;
                    return of('');
                }
            })
        );
    }

    getAppInsightsResourceForInstrumentationKey(instrumentationKey: string, subscriptionId: string): Observable<string> {
        let appInsightsResourceId: string = "";
        const url = `/subscriptions/${subscriptionId}/providers/microsoft.insights/components`;
        return this.armService.getResourceCollection<ResponseMessageCollectionEnvelope<ResponseMessageEnvelope<AppInsightsResponse>[]>>(url, "2015-05-01", true).pipe(map((response: ResponseMessageEnvelope<AppInsightsResponse>[]) => {
            let appInsightsUri = response.find(i => i.properties && i.properties.InstrumentationKey && i.properties.InstrumentationKey === instrumentationKey)
            if (appInsightsUri != null && appInsightsUri.id != null) {
                appInsightsResourceId = appInsightsUri.id;
            }
            return appInsightsResourceId;
        }));
    }

    getAppInsightsApiKeysLength(headers: HttpHeaders): Observable<number> {
        const url = `${this.armService.armUrl}${this.appInsightsSettings.resourceUri}/ApiKeys?api-version=2015-05-01`;
        return this.http.get(url, { headers: headers }).pipe(
            map((data: any) => {
                if (data && data.value && data.value.length) {
                    return data.value.length;
                } else {
                    return 0;
                }
            }));
    }

    getAppInsightsApiKeysCount(): Observable<number> {
        return this.authService.getStartupInfo().pipe(
            map((startupInfo: StartupInfo) => {
                let headers = this._getHeaders(startupInfo, null);
                return headers;
            }),
            mergeMap((headers: HttpHeaders) => {
                return this.getAppInsightsApiKeysLength(headers);
            }));
    }

    getRandomNumbers() {
        return Math.floor(Math.random() * 100000000).toString();
    }

    getAppInsightsKeyName() {
        return this.appInsightsKeyName + '_' + this.siteName + '_' + this.getRandomNumbers().toString();
    }

    generateAppInsightsAccessKey(): Observable<any> {
        const url = `${this.appInsightsSettings.resourceUri}/ApiKeys`;
        const body: any = {
            name: this.getAppInsightsKeyName(),
            linkedReadProperties: [`${this.appInsightsSettings.resourceUri}/api`],
            linkedWriteProperties: []
        };

        return this.armService.postResourceWithoutEnvelope<any, any>(url, body, '2015-05-01')
            .pipe(
                catchError(err => {
                    return throwError("Failed while generating AppInsights ApiKey - " + err);
                })
            );
    }

    ExecuteQuery(query: string): Observable<any> {
        if (!this.isNotNullOrEmpty(query)) {
            return of([]);
        }

        const resourceUri: string = `${this.appInsightsSettings.resourceUri}/api/query?query=${encodeURIComponent(query)}`;
        return this.armService.getResource<any>(resourceUri, '2015-05-01');
    }

    ExecuteQuerywithPostMethod(query: string): Observable<any> {
        if (!this.isNotNullOrEmpty(query)) {
            return of([]);
        }

        const resourceUri: string = `${this.appInsightsSettings.resourceUri}/api/query`;
        const body: any = {
            query: query
        }

        return this.armService.postResource<any, any>(resourceUri, body, '2015-05-01', true, true);
    }

    public openAppInsightsBlade() {
        this.portalActionService.openAppInsightsBlade();
    }

    public openAppInsightsFailuresBlade() {
        this.portalActionService.openAppInsightsFailuresBlade(this.appInsightsSettings.resourceUri);
    }

    public openAppInsightsPerformanceBlade() {
        this.portalActionService.openAppInsightsPerformanceBlade(this.appInsightsSettings.resourceUri);
    }

    public openAppInsightsExtensionBlade(detailBlade?: string) {
        return this.portalService.getAppInsightsResourceInfo().subscribe(
            (aiResource: string) => {
                if (this.isNotNullOrEmpty(aiResource)) {
                    this.portalActionService.openAppInsightsExtensionBlade(detailBlade, aiResource);
                } else if (this.isNotNullOrEmpty(this.appInsightsSettings.resourceUri)) {
                    this.portalActionService.openAppInsightsExtensionBlade(detailBlade, this.appInsightsSettings.resourceUri);
                } else {
                    this.getAppInsightsResourceFromAppSettings().subscribe(aiResourceAppSettings => {
                        this.portalActionService.openAppInsightsExtensionBlade(detailBlade, aiResourceAppSettings);
                    });
                }
            });
    }

    private isNotNullOrEmpty(item: any): boolean {
        return (item != undefined && item != '');
    }

    public logAppInsightsError(resourceUri: string, telmetryEvent: string, error: any) {
        this._telmetryService.logEvent(telmetryEvent, {
            'resourceUri': resourceUri,
            'error': error
        });
    }

    public logAppInsightsEvent(resourceUri: string, telmetryEvent: string) {
        this._telmetryService.logEvent(telmetryEvent,
            {
                'resourceUri': resourceUri
            });
    }

    public connectAppInsights(resourceUri: string, appInsightsResourceUri: string, appId: string): Observable<any> {

        return this.authService.getStartupInfo().pipe(
            mergeMap(deleteTagResponse => {
                return this.generateAppInsightsAccessKey().map(keyResponse => {
                    if (keyResponse && keyResponse.apiKey) {
                        return keyResponse.apiKey;
                    }
                });
            }),
            mergeMap(apiKey => {
                if (apiKey) {
                    const additionalHeaders = new HttpHeaders({ 'appinsights-key': apiKey });
                    return this._backendService.get(`api/appinsights/encryptkey`, additionalHeaders)
                        .pipe(
                            catchError(err => {
                                return throwError("Failed while encrypting the AppInsights API Key");
                            })
                        )
                        .map((encryptedKey: string) => {
                            return encryptedKey;
                        });
                }
            }),
            mergeMap(encryptedKey => {
                if (encryptedKey) {
                    return this.getUpdatedTags(resourceUri, encryptedKey, appId).map(updatedTags => {
                        return updatedTags;
                    });
                }
            }),
            mergeMap(updatedTags => {
                if (updatedTags) {
                    return this.armService.patchResourceFullResponse(resourceUri, { tags: updatedTags }, true, apiVersion)
                        .pipe(
                            catchError(err => {
                                return throwError("Failed while updating ARM tags for the resource - " + err);
                            })
                        ).map(patchTagsResponse => {
                            return patchTagsResponse;
                        });
                }
            }));
    }

    private getExistingTags(resourceUri: string): Observable<{ [key: string]: string }> {
        return this.armService.getResourceFullResponse(resourceUri, true, apiVersion)
            .pipe(
                catchError(err => {
                    return throwError("Failed while getting ARM tags for the resource - " + err);
                })
            ).map(response => {
                let armResource = <ArmResource>response.body;
                return armResource.tags;
            });
    }

    private getUpdatedTags(resourceUri: string, encryptedKey: string, appId: string) {
        return this.getExistingTags(resourceUri).map(existingTags => {
            if (existingTags != null) {
                existingTags[this.appInsightsTagName] = JSON.stringify({ ApiKey: encryptedKey, AppId: appId });
                return existingTags;
            } else {
                let newTags = {};
                newTags[this.appInsightsTagName] = JSON.stringify({ ApiKey: encryptedKey, AppId: appId });
                return newTags;
            }
        });
    }

    public getAppInsightsArmTag(resourceUri: string): Observable<any> {
        return this.getExistingTags(resourceUri).map(existingTags => {
            if (existingTags[this.appInsightsTagName] != null) {
                var appInsightsTag = JSON.parse(existingTags[this.appInsightsTagName]);
                return appInsightsTag;

            } else {
                return null;
            }
        });
    }

    public checkAppInsightsAccess(appInsightsResourceUri: string): Observable<boolean> {
        return this._rbacService.hasPermission(appInsightsResourceUri, [this._rbacService.writeScope]);
    }

    private _getHeaders(startupInfo: StartupInfo, additionalHeaders: HttpHeaders): HttpHeaders {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${startupInfo.token}`
        });

        if (additionalHeaders) {
            additionalHeaders.keys().forEach(key => {
                if (!headers.has(key)) {
                    headers = headers.set(key, additionalHeaders.get(key));
                }
            });
        }
        return headers;
    }
}

