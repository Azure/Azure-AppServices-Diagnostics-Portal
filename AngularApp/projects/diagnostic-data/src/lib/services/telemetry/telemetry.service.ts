import { Injectable, Inject } from '@angular/core';
import { ITelemetryProvider, TelemetryUtilities } from './telemetry.common';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsTelemetryService } from './appinsights-telemetry.service';
import { KustoTelemetryService } from './kusto-telemetry.service';
import { BehaviorSubject } from 'rxjs';
import { SeverityLevel } from '../../models/telemetry';
import { Router, ActivatedRoute } from '@angular/router';
import { DiagnosticSiteService } from '../diagnostic-site.service';
import { HttpClient } from '@angular/common/http';
import { GenericPortalService } from '../generic-portal.service';

@Injectable()
export class TelemetryService {
    private telemetryProviders: ITelemetryProvider[] = [];
    eventPropertiesSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private eventPropertiesLocalCopy: { [name: string]: string } = {};
    private isPublic: boolean;
    private ticketBladeWorkflowId: string = "";
    private enabledResourceTypes: { resourceType: string, searchSuffix: string }[] = [];
    private commonProperties: { [name: string]: string } = {};
    constructor(private _appInsightsService: AppInsightsTelemetryService, private _kustoService: KustoTelemetryService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private _activatedRoute: ActivatedRoute, private _router: Router, private _diagnosticSiteService: DiagnosticSiteService, private _http: HttpClient, private _genericPortalService: GenericPortalService) {
        if (config.useKustoForTelemetry) {
            this.telemetryProviders.push(this._kustoService);
        }
        if (config.useAppInsightsForTelemetry) {
            this.telemetryProviders.push(this._appInsightsService);
        }
        this.isPublic = config && config.isPublic;
        this.eventPropertiesSubject.subscribe((data: any) => {
            if (data) {
                for (const id of Object.keys(data)) {
                    if (data.hasOwnProperty(id)) {
                        this.eventPropertiesLocalCopy[id] = String(data[id]);
                    }
                }
            }
        });
        this._http.get<any>('assets/enabledResourceTypes.json').subscribe(res => {
            this.enabledResourceTypes = res.enabledResourceTypes;
        });
        this._genericPortalService.getStartupInfo().subscribe(startupInfo => {
            if (startupInfo && startupInfo.workflowId) {
                this.ticketBladeWorkflowId = startupInfo.workflowId;
            }
        });
    }

    /**
     * Writes event to the registered logging providers.
     */
    public logEvent(eventMessage: string, properties: { [name: string]: string } = {}, measurements?: any) {
        if (this.eventPropertiesLocalCopy) {
            for (const id of Object.keys(this.eventPropertiesLocalCopy)) {
                if (this.eventPropertiesLocalCopy.hasOwnProperty(id)) {
                    properties[id] = String(this.eventPropertiesLocalCopy[id]);
                }
            }
        }
        this.addProperties();
        properties = properties || {};
        properties = { ...properties, ...this.commonProperties };
        for (const telemetryProvider of this.telemetryProviders) {
            if (telemetryProvider) {
                telemetryProvider.logEvent(eventMessage, properties, measurements);
            }
        }
    }

    public logPageView(name: string, properties?: any, measurements?: any, url?: string, duration?: number) {
        this.addProperties();
        properties = properties || {};
        properties = { ...properties, ...this.commonProperties };
        for (const telemetryProvider of this.telemetryProviders) {
            if (!url) {
                url = window.location.href;
            }
            if (telemetryProvider) {
                telemetryProvider.logPageView(name, url, properties, measurements, duration);
            }
        }
    }

    public logException(exception: Error, handledAt?: string, properties?: any, severityLevel?: SeverityLevel) {
        try {
            this.addProperties();
            properties = properties || {};
            properties = { ...properties, ...this.commonProperties };
        } catch (e) {
        }
        for (const telemetryProvider of this.telemetryProviders) {
            if (telemetryProvider) {
                telemetryProvider.logException(exception, handledAt, properties, severityLevel);
            }
        }
    }

    public logTrace(message: string, properties?: any, severityLevel?: any) {
        this.addProperties();
        properties = properties || {};
        properties = { ...properties, ...this.commonProperties };
        for (const telemetryProvider of this.telemetryProviders) {
            if (telemetryProvider) {
                telemetryProvider.logTrace(message, properties, severityLevel);
            }
        }
    }

    public logMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: any) {
        this.addProperties();
        properties = properties || {};
        properties = { ...properties, ...this.commonProperties };
        for (const telemetryProvider of this.telemetryProviders) {
            if (telemetryProvider) {
                telemetryProvider.logMetric(name, average, sampleCount, min, max, properties);
            }
        }
    }

    private findProductName(url: string): string {
        let productName = "";
        let type = "";
        //match substring which is "providers/*/:resourceName"
        try {
            const routeParams = this._activatedRoute.root.firstChild.firstChild.firstChild.snapshot.params;
            const resourceName = this.isPublic ? routeParams['resourcename'] : routeParams['resourceName'];
            const reString = `providers\/.*\/${resourceName}`;
            const re = new RegExp(reString);
            const matched = url.match(re);
            if (!matched || matched.length <= 0 || matched[0].length <= 0) {
                return "";
            }

            const s = matched[0].split('/');
            if (s.length < 3) {
                return "";
            }
            type = `${s[1]}/${s[2]}`;
        } catch (e) {

        }
        const resourceType = this.enabledResourceTypes.find(t => t.resourceType.toLowerCase() === type.toLowerCase());
        productName = resourceType ? resourceType.searchSuffix : type;

        //If it's a web app, Check the kind of web app(Function/Linux)
        //If it's not Function/Linux, keep productNamse as it is
        if (type.toLowerCase() === "microsoft.web/sites") {
            productName = TelemetryUtilities.getProductNameByTypeAndKind(type, this._diagnosticSiteService.currentSite.value?.kind);
        }

        return productName;
    }

    private addProperties(): void {
        if (!(this.commonProperties["url"] || this.commonProperties["Url"])) {
            this.commonProperties["url"] = this._router.url;
        }

        let productName = "";
        productName = this.findProductName(this._router.url);
        if (productName !== "") {
            this.commonProperties["ProductName"] = productName;
            this.commonProperties["productName"] = productName;
        }

        if (this.ticketBladeWorkflowId !== "") {
            this.commonProperties["ticketBladeWorkflowId"] = this.ticketBladeWorkflowId;
        }
    }

    public updateCommonProperties(properties: { [name: string]: string }) {
        this.commonProperties = { ...this.commonProperties, ...properties };
    }
}
