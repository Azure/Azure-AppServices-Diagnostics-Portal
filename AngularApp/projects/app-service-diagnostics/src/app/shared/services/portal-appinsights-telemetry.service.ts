import { Injectable, OnInit, Inject, Input } from '@angular/core';
import { ApplicationInsights, Snippet, IPageViewTelemetry, IEventTelemetry, IExceptionTelemetry, SeverityLevel, ITraceTelemetry, IMetricTelemetry, ITelemetryItem } from '@microsoft/applicationinsights-web'
import { ITelemetryProvider } from 'diagnostic-data';
import { BackendCtrlService } from './backend-ctrl.service';
import { map, retry, catchError } from 'rxjs/operators';
import { VersionTestService } from '../../fabric-ui/version-test.service';

@Injectable({
    providedIn: 'root',
})
export class PortalAppInsightsTelemetryService implements ITelemetryProvider {
    appInsights: ApplicationInsights;
    instrumentationKey: string;
    environment: string = "";
    websiteHostName: string = "";

    constructor(private _backendCtrlService: BackendCtrlService,private _versionTestService:VersionTestService) {
        const appInsightsRequest = this._backendCtrlService.get<string>(`api/appsettings/ApplicationInsights:InstrumentationKey`).pipe(
            map((value: string) => {
                this.instrumentationKey = value;
            }),
            retry(2)
        );

        const envConfigRequest = this._backendCtrlService.get<string>('api/appsettings/ASD_ENVIRONMENT').pipe(
            map((value: string) => {
                this.environment = value;
            }),
            retry(2)
        );

        const hostnameConfigRequest = this._backendCtrlService.get<string>(`api/appsettings/ASD_HOST`).pipe(
            map((value: string) => {
                this.websiteHostName = value;
            }),
            retry(2)
        );

        appInsightsRequest.subscribe(() => {
            envConfigRequest.subscribe(() => {
                hostnameConfigRequest.subscribe(() => {
                    const snippet: Snippet = {
                        config: {
                            instrumentationKey: this.instrumentationKey,
                            disableFetchTracking: false,
                            maxAjaxCallsPerView: -1,
                            enableAutoRouteTracking: true,
                            maxBatchSizeInBytes: 5,
                            maxBatchInterval: 1,
                            autoTrackPageVisitTime: true,
                        }
                    };

                    this.appInsights = new ApplicationInsights(snippet);
                    this.appInsights.loadAppInsights();
                    this.appInsights.addTelemetryInitializer((envelop: ITelemetryItem) => {
                        envelop.data["environment"] = this.environment ? this.environment : "test";
                        envelop.data["websiteHostName"] = this.websiteHostName ? this.websiteHostName : "appservice-diagnostics";
                        envelop.data["isfrontend"] = true;

                        try {
                            const isLegacy = this._versionTestService.isLegacySub.value;
                            envelop.data["portalVersion"] = isLegacy ? 'v2' : 'v3';
                            envelop.data["initalPortalVersion"] = this._versionTestService.initializedPortalVersion.value;
                        }catch(e) {
                            this.logException(e);
                        }
                    });

                    this.logEvent("Application Insights initialized for diagnostics client");
                })
            })
        })
    }

    public logPageView(name?: string, url?: string, properties?: any, duration?: number) {
        properties = properties || {};
        properties.duration = duration === undefined || duration === null ? 0 : duration;

        const pageViewTelemetry: IPageViewTelemetry = {
            name: name,
            uri: url,
            properties: properties,
        };
        if (this.appInsights) {
            this.appInsights.trackPageView(pageViewTelemetry);
        }
    }

    public logEvent(message?: string, properties?: any, measurements?: any) {
        const mergedProperties = { ...properties, ...measurements };
        const eventTelemetry: IEventTelemetry = {
            name: message,
            properties: mergedProperties
        };

        if (this.appInsights) {
            this.appInsights.trackEvent(eventTelemetry);
        }
    }

    public logException(exception: Error, handledAt?: string, properties?: any, severityLevel?: SeverityLevel) {
        const mergedProperties = { handledAt: handledAt, ...properties };
        const exceptionTelemetry: IExceptionTelemetry = {
            error: exception,
            severityLevel: severityLevel,
            properties: mergedProperties
        };

        if (this.appInsights) {
            this.appInsights.trackException(exceptionTelemetry);
        }
    }

    public logTrace(message: string, properties?: any, severityLevel?: SeverityLevel) {
        severityLevel = severityLevel == undefined || severityLevel == null ? SeverityLevel.Information : severityLevel;
        const traceTelemetry = { message, severityLevel: severityLevel, properties: properties } as ITraceTelemetry;

        if (this.appInsights) {
            this.appInsights.trackTrace(traceTelemetry);
        }
    }

    public logMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: any) {
        const metricTelemetry = { name, average, sampleCount, min, max, properties } as IMetricTelemetry;
        if (this.appInsights) {
            this.appInsights.trackMetric(metricTelemetry);
        }
    }

    public flush() {
        if (this.appInsights) {
            this.appInsights.flush();
        }
    }
}
