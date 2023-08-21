import { ResponseMessageEnvelope } from './../models/responsemessageenvelope';
import { Injectable } from '@angular/core';
import { Site, SiteRestartData } from '../models/site';
import { Verbs } from '../models/portal';
import { StartupInfo, SupportBladeDefinition } from '../models/portal';
import { WindowService } from '../../startup/services/window.service';
import { PortalService } from '../../startup/services/portal.service';
import { ArmService } from './arm.service';
import { AuthService } from '../../startup/services/auth.service';
import { mergeMap, filter } from 'rxjs/operators';
import { DetectorType, OptInsightsResource, OptInsightsTimeContext } from 'diagnostic-data';
import { Globals } from '../../globals';

@Injectable()
export class PortalActionService {
    public apiVersion = '2016-08-01';
    public LoadTestingId: string = 'loadtestingcustomblade';

    public currentSite: ResponseMessageEnvelope<Site>;
    private resourceId: string;
    constructor(private _windowService: WindowService, private _portalService: PortalService, private _armService: ArmService,
        private _authService: AuthService, private globals: Globals,) {
        this._authService.getStartupInfo().pipe(
            mergeMap((startUpInfo: StartupInfo) => {
                this.resourceId = startUpInfo && startUpInfo.resourceId ? startUpInfo.resourceId : "";
                return this._armService.getResource<Site>(startUpInfo.resourceId);
            }),
            filter((response: {}): response is ResponseMessageEnvelope<Site> => true)
        ).subscribe((site) => {
            this.currentSite = <ResponseMessageEnvelope<Site>>site;
        });
    }

    public openBladeDiagnoseCategoryBlade(category: string) {
        const bladeInfo = {
            title: category,
            detailBlade: 'SCIFrameBlade',
            extension: 'WebsitesExtension',
            detailBladeInputs: {
                id: this.currentSite && this.currentSite.id ? this.currentSite.id : this.resourceId,
                categoryId: category,
                optionalParameters: [{
                    key: "categoryId",
                    value: category
                }]
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openBladeDiagnoseDetectorId(category: string, detector: string, type: DetectorType = DetectorType.Detector, startTime?: string, endTime ?: string) {
        const bladeInfo = {
            title: category,
            detailBlade: 'SCIFrameBlade',
            extension: 'WebsitesExtension',
            detailBladeInputs: {
                id: this.currentSite && this.currentSite.id ? this.currentSite.id : this.resourceId,
                categoryId: category,
                optionalParameters: [{
                    key: "categoryId",
                    value: category
                },
                {
                    key: "detectorId",
                    value: detector
                },
                {
                    key: "detectorType",
                    value: type
                },
                {
                    key: "startTime",
                    value: startTime
                },
                {
                    key: "endTime",
                    value: endTime
                }]
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openBladeDiagnosticToolId(toolId: string, category:string = "DiagnosticTools") {
        const bladeInfo = {
            title: category,
            detailBlade: 'SCIFrameBlade',
            extension: 'WebsitesExtension',
            detailBladeInputs: {
                id: this.currentSite.id,
                categoryId: category,
                optionalParameters: [{
                    key: "categoryId",
                    value: category
                },
                {
                    key: "toolId",
                    value: toolId
                }]
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public updateDiagnoseCategoryBladeTitle(category: string) {
        const bladeInfo = {
            title: category
        };

        this._portalService.updateBladeInfo(bladeInfo, 'updateBlade');
    }

    public openBladeScaleUpBlade() {
        const bladeInfo = {
            detailBlade: 'SciFrameBlade',
            detailBladeInputs: {}
        };
        this._portalService.postMessage(Verbs.openScaleUpBlade, JSON.stringify(bladeInfo));
    }

    public openBladeScaleOutBlade() {
        const scaleOutInputs = {
            resourceId: this.currentSite.properties.serverFarmId
        };

        const bladeInfo = {
            detailBlade: 'AutoScaleSettingsBlade',
            extension: 'Microsoft_Azure_Monitoring',
            detailBladeInputs: scaleOutInputs
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openMdmMetricsV3Blade(resourceUri?: string) {
        const bladeInfo = {
            detailBlade: 'MetricsBladeV3',
            extension: 'Microsoft_Azure_Monitoring',
            detailBladeInputs: {
                ResourceId: !!resourceUri ? resourceUri : this.currentSite.id
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openAppInsightsBlade() {
        const bladeInfo = {
            detailBlade: 'AppMonitorEnablementV2',
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                resourceUri: this.currentSite.id,
                linkedComponent: <any>null
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openOptInsightsBlade(appInsightsResourceUri: OptInsightsResource) {
        const bladeInfo = {
            detailBlade: 'ServiceProfilerPerflensBlade',
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                ComponentId: {
                    SubscriptionId: appInsightsResourceUri.SubscriptionId,
                    ResourceGroup: appInsightsResourceUri.ResourceGroup,
                    Name: appInsightsResourceUri.Name,
                    LinkedApplicationType: appInsightsResourceUri.LinkedApplicationType,
                    ResourceId: appInsightsResourceUri.ResourceId,
                    ResourceType: appInsightsResourceUri.ResourceType,
                    IsAzureFirst: appInsightsResourceUri.IsAzureFirst,
                },
                OpenedFrom: 'app-service-diagnose-and-solve-problems'
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openOptInsightsBladewithTimeRange(appInsightsResourceUri: OptInsightsResource, optInsightsTimeContext: OptInsightsTimeContext, SiteName: string) {
        const bladeInfo = {
            detailBlade: 'ServiceProfilerPerflensBlade',
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                ComponentId: {
                    SubscriptionId: appInsightsResourceUri.SubscriptionId,
                    ResourceGroup: appInsightsResourceUri.ResourceGroup,
                    Name: appInsightsResourceUri.Name,
                    LinkedApplicationType: appInsightsResourceUri.LinkedApplicationType,
                    ResourceId: appInsightsResourceUri.ResourceId,
                    ResourceType: appInsightsResourceUri.ResourceType,
                    IsAzureFirst: appInsightsResourceUri.IsAzureFirst
                },
                TimeContext:{
                    durationMs: optInsightsTimeContext.durationMs,
                    endTime: optInsightsTimeContext.endTime,
                    createdTime: optInsightsTimeContext.createdTime,
                    isInitialTime: optInsightsTimeContext.isInitialTime,
                    grain: optInsightsTimeContext.grain,
                    useDashboardTimeRange: optInsightsTimeContext.useDashboardTimeRange,            
                },
                RoleName: SiteName,
                OpenedFrom: 'app-service-diagnose-and-solve-problems'
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openAppInsightsExtensionBlade(detailBlade: string, appInsightsResourceUri: string) {
        const bladeInfo = {
            detailBlade: detailBlade,
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                ResourceId: appInsightsResourceUri,
                ConfigurationId: ''
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openAppInsightsFailuresBlade(appInsightsResourceUri: string) {
        const bladeInfo = {
            detailBlade: 'FailuresCuratedFrameBlade',
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                ResourceId: appInsightsResourceUri,
                ConfigurationId: ''
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openAppInsightsPerformanceBlade(appInsightsResourceUri: string) {
        const bladeInfo = {
            detailBlade: 'PerformanceCuratedFrameBlade',
            extension: 'AppInsightsExtension',
            detailBladeInputs: {
                ResourceId: appInsightsResourceUri,
                ConfigurationId: ''
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openSupportIFrame(supportBlade: SupportBladeDefinition) {

        const bladeInfo = {
            detailBlade: 'SupportIFrame',
            detailBladeInputs: this._getSupportSiteInput(this.currentSite, supportBlade.Identifier, supportBlade.Title)
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openTifoilSecurityBlade() {
        const resourceUriSplit = this.currentSite.id.split('/');

        const bladeInfo = {
            detailBlade: 'TinfoilSecurityBlade',
            detailBladeInputs: {
                WebsiteId: this.getWebsiteId(resourceUriSplit[2], resourceUriSplit[4], resourceUriSplit[8]),
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openBladeAdvancedAppRestartBladeForCurrentSite() {
        this.openBladeAdvancedAppRestartBlade([{ resourceUri: this.currentSite.id, siteName: this.currentSite.name }], []);
    }

    public openBladeAdvancedAppRestartBlade(sitesToGet: SiteRestartData[], instancesToRestart: string[], site?: Site) {
        const resourceUris = [];
        for (let i = 0; i < sitesToGet.length; i++) {
            resourceUris.push(sitesToGet[i].resourceUri);
        }

        const bladeInfo = {
            detailBlade: 'AdvancedAppRestartBlade',
            detailBladeInputs: {
                resourceUri: this.currentSite.id,
                resourceUris: resourceUris,
                preselectedInstances: instancesToRestart
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openChangeAnalysisBlade(startTime?: string, endTime?: string, resourceUri?: string) {
        let bladeInfo = {
            extension: 'Microsoft_Azure_ChangeAnalysis',
            detailBlade: 'ChangeAnalysisBaseBlade',
            detailBladeInputs: {
                resourceIds:  [resourceUri != null || resourceUri != undefined ? resourceUri : this.currentSite.id],
                deepLinkOrigin: 'appservicediagnostics'
            }
        };

        if(startTime && endTime) {
            bladeInfo["detailBladeInputs"]["startTime"] = startTime;
            bladeInfo["detailBladeInputs"]["endTime"] = endTime;
        }

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openLoadTestingBlade() {
        let bladeInfo = {
            extension: 'HubsExtension',
            detailBlade: 'BrowseResource',
            detailBladeInputs: {
                resourceType: "Microsoft.LoadTestService/LoadTests"
            }
        };

        this._portalService.openBlade(bladeInfo, 'troubleshoot');
    }

    public openCustomPortalActionBlade(id: string) {
        if (id === this.LoadTestingId) {
            this.openLoadTestingBlade();
        }
    }

    private getWebsiteId(subscriptionId: string, resourceGroup: string, siteName: string): any {
        return {
            Name: siteName,
            SubscriptionId: subscriptionId,
            ResourceGroup: resourceGroup
        };
    }

    // TODO: This is probably not the correct home for this
    public openAutoHealSite(site?: Site) {
        const url = 'https://mawssupport.trafficmanager.net/?sitename=' + this.currentSite.name + '&tab=mitigate&source=ibiza';
        this._windowService.window.open(url);
    }

    private _getSupportSiteInput(site: ResponseMessageEnvelope<Site>, feature: string, title: string) {
        return {
            ResourceId: site.id,
            source: 'troubleshoot',
            title: title,
            feature: feature
        };
    }

    public openFeedbackPanel(){
        this.globals.openFeedback = !this.globals.openFeedback;
    }
}