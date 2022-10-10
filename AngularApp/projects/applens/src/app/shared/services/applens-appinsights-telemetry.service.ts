import { Injectable, OnInit, Inject, Input } from '@angular/core';
import { ApplicationInsights, Snippet, IPageViewTelemetry, IEventTelemetry, IExceptionTelemetry, SeverityLevel, ITraceTelemetry, IMetricTelemetry, ITelemetryItem } from '@microsoft/applicationinsights-web'
import { ITelemetryProvider } from 'diagnostic-data';
import { of, forkJoin, throwError } from 'rxjs';
import { map, retry, catchError } from 'rxjs/operators';
import { DiagnosticApiAppSettingsService } from './diagnostic-api-app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class ApplensAppinsightsTelemetryService implements ITelemetryProvider {
  appInsights: ApplicationInsights;
  instrumentationKey: string;
  environment: string = "";
  websiteHostName: string = "";

  constructor(private _backendApi: DiagnosticApiAppSettingsService) { }

  public initialize() {
    if (!this.appInsights) {
      const appInsightsRequest = this._backendApi.get<string>(`api/appsettings/ApplicationInsights:InstrumentationKey`).pipe(
        map((value: string) => {
          this.instrumentationKey = value;
        }),
        retry(2)
      );

      const envConfigRequest = this._backendApi.get<string>('api/appsettings/APPLENS_ENVIRONMENT').pipe(
        map((value: string) => {
          this.environment = value;
        }),
        retry(2)
      );

      const hostnameConfigRequest = this._backendApi.get<string>(`api/appsettings/APPLENS_HOST`).pipe(
        map((value: string) => {
          this.websiteHostName = value;
        }),
        retry(2)
      );

      forkJoin(appInsightsRequest, envConfigRequest, hostnameConfigRequest).subscribe(() => {
        const snippet: Snippet = {
          config: {
            instrumentationKey: this.instrumentationKey,
            disableFetchTracking: false,
            maxAjaxCallsPerView: -1,
            enableAutoRouteTracking: true,
            maxBatchSizeInBytes: 5,
            maxBatchInterval: 1,
          }
        };

        this.appInsights = new ApplicationInsights(snippet);
        this.appInsights.loadAppInsights();

        this.appInsights.addTelemetryInitializer((envelop: ITelemetryItem) => {
          envelop.data["environment"] = this.environment ? this.environment : "test";
          envelop.data["websiteHostName"] = this.websiteHostName ? this.websiteHostName : "applens";
          envelop.data["isfrontend"] = true;
        });

        this.logEvent("Application Insights initialized for applens client");
      });
    }
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
    const exceptionTelemetry = { exception, severityLevel, mergedProperties } as IExceptionTelemetry;

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
