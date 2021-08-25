import { DetectorControlService, FeatureNavigationService, DetectorResponse, TelemetryEventNames, ResourceDescriptor, TelemetrySource, LoadingStatus } from 'diagnostic-data';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category } from '../../../shared-v2/models/category';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { HomePageText, RiskAlertConfig } from '../../../shared/models/arm/armResourceConfig';
import { ArmService } from '../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { TelemetryService } from 'diagnostic-data';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';
import { DiagnosticService } from 'diagnostic-data';
import { HttpResponse } from '@angular/common/http';
import { Globals } from '../../../globals';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { allowV3PResourceTypeList, VersionTestService } from '../../../fabric-ui/version-test.service';
import { SubscriptionPropertiesService } from '../../../shared/services/subscription-properties.service';
import { Feature } from '../../../shared-v2/models/features';
import { QuickLinkService } from '../../../shared-v2/services/quick-link.service';
import { delay, map } from 'rxjs/operators';
import { RiskHelper, RiskTile } from '../../models/risk';
import { OperatingSystem } from '../../../shared/models/site';
import { RiskAlertService } from '../../../shared-v2/services/risk-alert.service';
import { mergeMap } from 'rxjs-compat/operator/mergeMap';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit {
    useLegacy: boolean = true;
    resourceName: string;
    categories: Category[];
    searchValue = '';
    searchBoxFocus: boolean;
    searchLogTimout: any;
    event: any;
    subscriptionId: string;
    searchResultCount: number;
    homePageText: HomePageText;
    searchPlaceHolder: string;
    providerRegisterUrl: string;
    quickLinkFeatures: Feature[] = [];
    riskAlertNotifications: {} = {};
    risksPanelContents={};
    currentRiskPanelContentId: string = null;
    riskAlertConfigs: RiskAlertConfig[];
    loadingQuickLinks: boolean = true;
    showRiskSection: boolean = true;
    private _showSwitchBanner: boolean = false;
    get showSwitchBanner():boolean {
        const typeSwitchItem = allowV3PResourceTypeList.find(item => this._resourceService.resource && this._resourceService.resource.type && this._resourceService.resource.type.toLowerCase() === item.type.toLowerCase());
        const allowResourceTypeSwitch = typeSwitchItem === undefined ? false : typeSwitchItem.allowSwitchBack;
        return allowResourceTypeSwitch && this._showSwitchBanner;
    }
    initializedPortalVersion = 'v3';
    get inputAriaLabel(): string {
        return this.searchValue !== '' ?
            `${this.searchResultCount} Result` + (this.searchResultCount !== 1 ? 's' : '') :
            '';
    }

    get isIE_Browser(): boolean {
        return /msie\s|trident\//i.test(window.navigator.userAgent);
    }

    get isPublicAzure(): boolean {
        return ((window.location != window.parent.location) ? document.referrer : document.location.href).includes("azure.com");
    }

    constructor(private _resourceService: ResourceService, private _categoryService: CategoryService, private _notificationService: NotificationService, private _router: Router,
        private _detectorControlService: DetectorControlService, private _featureService: FeatureService, private _logger: LoggingV2Service, private _authService: AuthService,
        private _navigator: FeatureNavigationService, private _activatedRoute: ActivatedRoute, private armService: ArmService, private _telemetryService: TelemetryService, private _diagnosticService: DiagnosticService, private _portalService: PortalActionService, private globals: Globals,
        private versionTestService: VersionTestService, private subscriptionPropertiesService: SubscriptionPropertiesService, private _quickLinkService: QuickLinkService, private _riskAlertService: RiskAlertService) {

        this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
        this.versionTestService.isLegacySub.subscribe(isLegacy => this.useLegacy = isLegacy);
        this.versionTestService.initializedPortalVersion.subscribe(v => this.initializedPortalVersion = v);
        this.resourceName = this._resourceService.resource ? this._resourceService.resource.name : "";
        let eventProps = {
            subscriptionId: this.subscriptionId,
            resourceName: this.resourceName,
        };
        this._telemetryService.logEvent('DiagnosticsViewLoaded', eventProps);

        if (_resourceService.armResourceConfig && _resourceService.armResourceConfig.homePageText
            && _resourceService.armResourceConfig.homePageText.title && _resourceService.armResourceConfig.homePageText.title.length > 1
            && _resourceService.armResourceConfig.homePageText.description && _resourceService.armResourceConfig.homePageText.description.length > 1
            && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder && _resourceService.armResourceConfig.homePageText.searchBarPlaceHolder.length > 1) {
            this._showSwitchBanner = true;
            this.homePageText = _resourceService.armResourceConfig.homePageText;
            this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
        }
        else {
            if (this._resourceService && !!this._resourceService.resource && this._resourceService.resource.type === 'Microsoft.Web/hostingEnvironments') {
                this.homePageText = {
                    title: 'App Service Environment Diagnostics',
                    description: 'Use App Service Environment Diagnostics to investigate how your App Service Environment is performing, diagnose issues, and discover how to\
          improve the availability of your App Service Environment. Select the problem category that best matches the information or tool that you\'re\
          interested in:',
                    searchBarPlaceHolder: 'Search App Service Environment Diagnostics'
                };
                this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
            }
            else {
                if (this._resourceService && this._resourceService instanceof WebSitesService && (this._resourceService as WebSitesService).appType === AppType.WorkflowApp) {
                    this.homePageText = {
                        title: 'Logic App Diagnostics (Preview)',
                        description: 'Troubleshoot run and connector issues, investigate app performance and discover how to improve its reliability.',
                        searchBarPlaceHolder: 'Search Azure Logic App Diagnostics'
                    };
                    this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
                }
                else if (this._resourceService && this._resourceService instanceof WebSitesService && (this._resourceService as WebSitesService).appType === AppType.FunctionApp) {
                    this.homePageText = {
                        title: 'Function App Diagnostics (Preview)',
                        description: 'Investigate how your app is performing, diagnose issues and discover how to improve your application.',
                        searchBarPlaceHolder: 'Search Azure Functions Diagnostics'
                    };
                    this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
                }
                else {
                    this.homePageText = {
                        title: 'App Service Diagnostics',
                        description: 'Investigate how your app is performing, diagnose issues, and discover how to improve your application.' ,
                        searchBarPlaceHolder: 'Search App Service Diagnostics'
                    };
                    this.searchPlaceHolder = this.homePageText.searchBarPlaceHolder;
                }
            }
        }

        if (this.useStaticAksText) {
            this.homePageText = {
                title: 'Azure Kubernetes Service Diagnostics',
                description: 'Explore ways to diagnose and troubleshoot the common problems of your cluster from CRUD operations to connection problems. Click on any of the documents below to start troubleshooting.',
                searchBarPlaceHolder: 'Search a keyword that best describes your issue'
            };
        }

        if (_resourceService.armResourceConfig) {
            this._categoryService.initCategoriesForArmResource(_resourceService.resource.id);
            this._quickLinkService.initQuickLinksForArmResource(_resourceService.resource.id);
            this._riskAlertService.initRiskAlertsForArmResource(_resourceService.resource.id);
        }

        this._categoryService.categories.subscribe(categories => this.categories = categories);

        this._authService.getStartupInfo().subscribe(startupInfo => {
            if (startupInfo.additionalParameters && Object.keys(startupInfo.additionalParameters).length > 0) {
                let path = 'resource' + startupInfo.resourceId.toLowerCase();
                path = this._updateRouteBasedOnAdditionalParameters(path, startupInfo.additionalParameters);
                if (path) {
                    this._router.navigateByUrl(path);
                }
            }
        });

        this._featureService.featureSub.subscribe(features => {
            this._quickLinkService.quickLinksSub.subscribe(quickLinks => {
                if (features !== null && quickLinks !== null) {
                    this.quickLinkFeatures = this._filterFeaturesWithQuickLinks(quickLinks, features);
                    this.loadingQuickLinks = false;
                }
            });
        })
        }

    ngOnInit() {
        this.providerRegisterUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis/register`;
        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }

        let locationPlacementId = '';
        this.subscriptionPropertiesService.getSubscriptionProperties(this.subscriptionId).subscribe((response: HttpResponse<{}>) => {
            let subscriptionProperties = response.body['subscriptionPolicies'];
            if (subscriptionProperties) {
                locationPlacementId = subscriptionProperties['locationPlacementId'];
                let eventProps = {
                    subscriptionId: this.subscriptionId,
                    subscriptionLocationPlacementId: locationPlacementId
                };
                this._telemetryService.logEvent('SubscriptionProperties', eventProps);
            }
        });

        if (this._resourceService && !!this._resourceService.resource && this._resourceService.resource.type === 'Microsoft.Web/sites') {
            if (locationPlacementId.toLowerCase() !== 'geos_2020-01-01') {
                // Register Change Analysis Resource Provider.
                this.armService.postResourceFullResponse(this.providerRegisterUrl, {}, true, '2018-05-01').subscribe((response: HttpResponse<{}>) => {
                    let eventProps = {
                        url: this.providerRegisterUrl

                    };
                    this._telemetryService.logEvent("Change Analysis Resource Provider registered", eventProps);
                }, (error: any) => {
                    this.logHTTPError(error, 'registerResourceProvider');
                });
            } else {
                this._categoryService.filterCategoriesForSub();
            }
        }

        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }

        this._riskAlertService.getRiskAlertNotificationResponse().subscribe(()=>
        {
            this._riskAlertService.riskPanelContentsSub.next(this._riskAlertService.risksPanelContents);
        });

        this.riskAlertNotifications = this._riskAlertService.riskAlertNotifications;
        this.riskAlertConfigs = this._riskAlertService.riskAlertConfigs;
        this.showRiskSection = this._isRiskAlertEnabled();
        this._telemetryService.logEvent("telemetry service logging", {});
    };

    ngAfterViewInit() {
        this._telemetryService.logPageView(TelemetryEventNames.HomePageLoaded, { "numCategories": this.categories.length.toString() });
        if(document.getElementById("homepage-title")){
            document.getElementById("homepage-title").focus();
        }
    }


    public get useStaticAksText(): boolean {
        return this.armService.isMooncake
            && ResourceDescriptor.parseResourceUri(this._resourceService.resourceIdForRouting).provider.toLowerCase() == 'microsoft.containerservice';
    }

    public get isAKSOnNationalCloud(): boolean {
        return this.armService.isNationalCloud
            && ResourceDescriptor.parseResourceUri(this._resourceService.resourceIdForRouting).provider.toLowerCase() == 'microsoft.containerservice';
    }

    onSearchBoxFocus(event: any): void {
        this.searchBoxFocus = true;
    }


    clearSearch() {
        this.searchBoxFocus = false;
        this.searchValue = '';
        this.searchResultCount = 0;
    }

    updateSearchValue(searchValue: string) {
        this.searchValue = searchValue;

        if (this.searchLogTimout) {
            clearTimeout(this.searchLogTimout);
        }

        this.searchLogTimout = setTimeout(() => {
            this._logSearch();
        }, 5000);
    }

    onResultCount(count: number) {
        this.searchResultCount = count;
    }

    onSearchLostFocus() {
        if (this.searchValue === '') {
            this.searchResultCount = 0;
        }
    }

    onFocusClear() {
        if (this.searchValue === '') {
            this.clearSearch();
        }
    }

    private _updateRouteBasedOnAdditionalParameters(route: string, additionalParameters: any): string {
        if (additionalParameters.featurePath) {
            let featurePath: string = additionalParameters.featurePath;
            featurePath = featurePath.startsWith('/') ? featurePath.replace('/', '') : featurePath;

            return `${route}/${featurePath}`;
        }

        return null;
    }

    private _logSearch() {
        this._logger.LogSearch(this.searchValue);
    }

    private logHTTPError(error: any, methodName: string): void {
        let errorLoggingProps = {
            errorMsg: error.message ? error.message : 'Server Error',
            statusCode: error.status ? error.status : 500
        };
        this._telemetryService.logTrace('HTTP error in ' + methodName, errorLoggingProps);
    }

    private _checkIsWindowsWebApp(): boolean {
        let isWindowsWebApp = false;
        if (this._resourceService && this._resourceService instanceof WebSitesService && (this._resourceService as WebSitesService).appType === AppType.WebApp && (this._resourceService as WebSitesService).platform === OperatingSystem.windows) {
            isWindowsWebApp = true;
        }
        return isWindowsWebApp;
    }

    private _isRiskAlertEnabled(): boolean {
        return this.riskAlertConfigs != null && this.riskAlertConfigs.length > 0;
    }

    private _filterFeaturesWithQuickLinks(quickLinks: string[], features: Feature[]): Feature[] {
        let res: Feature[] = [];
        for (let link of quickLinks) {
            const feature = features.find(feature => feature.id === link);
            if (feature) {
                res.push(feature);
            }
        }
        return res;
    }

    openGeniePanel() {
        this.globals.openGeniePanel = true;
        this._telemetryService.logEvent(TelemetryEventNames.OpenGenie, {
            'Location': TelemetrySource.LandingPage
        });
    }

    openFeedbackPanel() {
        this._telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel),{
            'Location': TelemetrySource.LandingPage
        }
        this.globals.openFeedback = true;
    }

    clickQuickLink(feature: Feature) {
        this._telemetryService.logEvent(TelemetryEventNames.QuickLinkClicked,{
            'id': feature.id,
            'name': feature.name
        });
        feature.clickAction();
    }

    refreshPage() {
        this._telemetryService.logEvent(TelemetryEventNames.RefreshClicked,{
            'Location': TelemetrySource.LandingPage
        });

      this._riskAlertService.getRiskAlertNotificationResponse(false, true).subscribe(()=>
      {
          this._riskAlertService.riskPanelContentsSub.next(this._riskAlertService.risksPanelContents);
          this._riskAlertService.isRiskTileRefreshing.next(false);
      });
    }

    switchView() {
        this.useLegacy = !this.useLegacy;
        this.versionTestService.setLegacyFlag(this.useLegacy === true ? 1 : 2);
        let eventProps = {
            subscriptionId: this.subscriptionId,
            resourceName: this.resourceName,
            switchToLegacy: this.useLegacy.toString(),
        };
        this._telemetryService.logEvent('SwitchView',eventProps);
    }
}

