import { Injectable, Inject } from '@angular/core';
import { ITelemetryProvider } from './telemetry.common';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { AppInsightsTelemetryService } from './appinsights-telemetry.service';
import { KustoTelemetryService } from './kusto-telemetry.service';
import { BehaviorSubject } from 'rxjs';
import { SeverityLevel } from '../../models/telemetry';
import { VersionService } from '../version.service';
import { Router, ActivatedRoute } from '@angular/router';

@Injectable()
export class TelemetryService {
    private telemetryProviders: ITelemetryProvider[] = [];
    eventPropertiesSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private eventPropertiesLocalCopy: { [name: string]: string } = {};
    private isLegacy: boolean;
    private enabledResourceTypes: { resourceType: string, name: string }[] = [
        {
            resourceType: "Microsoft.Web/sites",
            name: "AZURE WEB APP"
        },
        {
            resourceType: "Microsoft.Web/hostingEnvironments",
            name: "AZURE APP SERVICE ENVIRONMENT"

        },
        {
            resourceType: "Microsoft.Logic/workflows",
            name: "AZURE LOGIC APP"
        },
        {
            resourceType: "Microsoft.ContainerService/managedClusters",
            name: "AZURE KUBERNETES CLUSTER"
        },
        {
            resourceType: "Microsoft.ContainerService/openShiftManagedClusters",
            name: "AZURE KUBERNETES CLUSTER"
        },
        {
            resourceType: "Microsoft.ApiManagement/service",
            name: "AZURE API MANAGEMENT SERVICE"
        }
    ];
    constructor(private _appInsightsService: AppInsightsTelemetryService, private _kustoService: KustoTelemetryService,
        @Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig, private _versionService: VersionService, private _activatedRoute: ActivatedRoute, private _router: Router) {
        if (config.useKustoForTelemetry) {
            this.telemetryProviders.push(this._kustoService);
        }
        if (config.useAppInsightsForTelemetry) {
            this.telemetryProviders.push(this._appInsightsService);
        }

        this.eventPropertiesSubject.subscribe((data: any) => {
            if (data) {
                for (const id of Object.keys(data)) {
                    if (data.hasOwnProperty(id)) {
                        this.eventPropertiesLocalCopy[id] = String(data[id]);
                    }
                }
            }
        });
        this._versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    }

    /**
     * Writes event to the registered logging providers.
     */
    public logEvent(eventMessage: string, properties: { [name: string]: string }, measurements?: any) {
        if (this.eventPropertiesLocalCopy) {
            for (const id of Object.keys(this.eventPropertiesLocalCopy)) {
                if (this.eventPropertiesLocalCopy.hasOwnProperty(id)) {
                    properties[id] = String(this.eventPropertiesLocalCopy[id]);
                }
            }
        }
        if (!(properties["url"] || properties["Url"])) {
            properties.Url = window.location.href;
        }

        properties.PortalVersion = this.isLegacy ? 'V2' : 'V3';

        let productName = "";
        productName = this.findProductName(this._router.url);
        if (productName !== "") {
            properties.productName = productName;
        }

        for (const telemetryProvider of this.telemetryProviders) {
            telemetryProvider.logEvent(eventMessage, properties, measurements);
        }
    }

    public logPageView(name: string, properties?: any, measurements?: any, url?: string, duration?: number) {
        for (const telemetryProvider of this.telemetryProviders) {
            if (!url) {
                url = window.location.href;
            }
            telemetryProvider.logPageView(name, url, properties, measurements, duration);
        }
    }

    public logException(exception: Error, handledAt?: string, properties?: any, measurements?: any, severityLevel?: SeverityLevel) {
        for (const telemetryProvider of this.telemetryProviders) {
            telemetryProvider.logException(exception, handledAt, properties, measurements, severityLevel);
        }
    }

    public logTrace(message: string, customProperties?: any, customMetrics?: any) {
        for (const telemetryProvider of this.telemetryProviders) {
            telemetryProvider.logTrace(message, customProperties);
        }
    }

    public logMetric(name: string, average: number, sampleCount?: number, min?: number, max?: number, properties?: any) {
        for (const telemetryProvider of this.telemetryProviders) {
            telemetryProvider.logMetric(name, average, sampleCount, min, max, properties);
        }
    }

    private findProductName(url: string): string {
        let productName = "";
        const resourceName = this._activatedRoute.root.firstChild.firstChild.snapshot.params["resourcename"];

        //match substring which is after "providers/" and before "/:resourceName",like "microsoft.web/sites"
        const re = new RegExp(`(?<=providers\/).*(?=\/${resourceName})`);
        const matched = url.match(re);
        if (matched.length > 0 && matched[0].length > 0) {
            const type = matched[0];
            const resourceType = this.enabledResourceTypes.find(t => t.resourceType.toLowerCase() === type.toLowerCase());

            productName = resourceType ? resourceType.name : type;
        }

        return productName;
    }
}
