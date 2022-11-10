import { Injectable } from "@angular/core";
import { DetectorResponse, HealthStatus, LoadingStatus, Rendering, TelemetryService } from "diagnostic-data";
import { DiagnosticService, DetectorControlService, TelemetryEventNames, TelemetrySource } from 'diagnostic-data';
import { BehaviorSubject, forkJoin, Observable, observable } from "rxjs";
import { RiskHelper, RiskInfo, RiskTile } from "../../../home/models/risk";
import { NotificationConfig, RiskAlertConfig } from "../../../shared/models/arm/armResourceConfig";
import { GenericArmConfigService } from "../../../shared/services/generic-arm-config.service";
import { FeatureService } from "../../../shared-v2/services/feature.service";
import { Globals } from "../../../globals";
import { RiskAlertService } from "../../../shared-v2/services/risk-alert.service";
import { SiteFilteredItem } from "../models/site-filter";
import { AppType } from "../../../shared/models/portal";
import { HostingEnvironmentKind, OperatingSystem } from "../../../shared/models/site";
import { Sku } from "../../../shared/models/server-farm";
import { WebSiteFilter } from "../pipes/site-filter.pipe";


@Injectable({
    providedIn: 'root'
})

export class SiteRiskAlertService extends RiskAlertService {
    public riskAlertsSub: BehaviorSubject<RiskAlertConfig[]> = new BehaviorSubject<RiskAlertConfig[]>([]);
    public riskPanelContentSub: BehaviorSubject<DetectorResponse> = new BehaviorSubject<DetectorResponse>(null);
    risks: RiskTile[] = [];
    risksPanelContents = {};
    currentRiskPanelContentId: string = null;
    riskAlertConfigs: RiskAlertConfig[];

    private _webAppRiskAlertConfigs = [
        {
            title: "Availability",
            riskAlertDetectorId: "availablityriskalert",
            enableForCaseSubmissionFlow: true,
        }
    ];

    private _linuxFunctionAppRiskAlertConfigs = [{
        title: "Availability",
        riskAlertDetectorId: "funcAvailablityRiskAlert",
        enableForCaseSubmissionFlow: true,
    }];

    private _windowsFunctionAppRiskAlertConfigs = [{
        title: "Availability",
        riskAlertDetectorId: "funcAvailablityRiskAlert",
        enableForCaseSubmissionFlow: true,
    }];

    private _linuxAppRiskAlertConfigs = [{
        title: "Availability",
        riskAlertDetectorId: "liuxAppAvailablityRiskAlert",
        enableForCaseSubmissionFlow: true,
    }];

    private _siteRiskAlertConfigs: SiteFilteredItem<RiskAlertConfig[]>[] = [
        {
            appType: AppType.WebApp,
            platform: OperatingSystem.windows,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._webAppRiskAlertConfigs,
        },
        {
            appType: AppType.FunctionApp,
            platform: OperatingSystem.windows,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._windowsFunctionAppRiskAlertConfigs
        },
        {
            appType: AppType.FunctionApp,
            platform: OperatingSystem.linux,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._linuxFunctionAppRiskAlertConfigs
        },
        {
            appType: AppType.WebApp,
            platform: OperatingSystem.linux,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._linuxAppRiskAlertConfigs
        }
    ];

    private _webAppNotificationMessageConfig =
    {
        title: "Notifications",
        notificationDetectorId: "webappemergingnotification",
        enableForCaseSubmissionFlow: true,
    };

    private _functionAppNotificationMessageConfig =
    {
        title: "Notifications",
        notificationDetectorId: "functionAppNotification",
        enableForCaseSubmissionFlow: true,
    };

    // This is to show platform level notification that we want to inform customers.
    private _siteRiskNotificationMessageConfig: SiteFilteredItem<NotificationConfig>[] = [
        {
            appType: AppType.WebApp,
            platform: OperatingSystem.windows,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._webAppNotificationMessageConfig,
        },
        {
            appType: AppType.FunctionApp,
            platform: OperatingSystem.windows,
            stack: '',
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            item: this._functionAppNotificationMessageConfig,
        }
    ];

    constructor(private _websiteFilter: WebSiteFilter, protected _featureService: FeatureService, protected _diagnosticService: DiagnosticService, protected _detectorControlService: DetectorControlService, protected _telemetryService: TelemetryService, protected globals: Globals, protected _genericArmConfigService?: GenericArmConfigService) {
        super(_featureService, _diagnosticService, _detectorControlService, _telemetryService, globals, _genericArmConfigService);
        const riskAlertConfigs = this._websiteFilter.transform(this._siteRiskAlertConfigs);
        const notificationConfigs = this._websiteFilter.transform(this._siteRiskNotificationMessageConfig);
        let siteRiskAlertConfigs: RiskAlertConfig[] = [];
        let siteNotificationConfig: NotificationConfig = null;
        for (const riskAlertConfig of riskAlertConfigs) {
            siteRiskAlertConfigs = siteRiskAlertConfigs.concat(riskAlertConfig);
        }

        if (notificationConfigs != null && notificationConfigs.length > 0) {
            siteNotificationConfig = notificationConfigs[0];
        }

        this._addRiskAlertDetectorIds(siteRiskAlertConfigs, siteNotificationConfig);
    }
}
