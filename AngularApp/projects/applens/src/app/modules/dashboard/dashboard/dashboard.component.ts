import { AdalService } from 'adal-angular4';
import { Subscription, Observable, Subject } from 'rxjs';
import { Component, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import * as momentNs from 'moment';
import { DetectorControlService, FeatureNavigationService, BreadcrumbNavigationItem, GenericThemeService, ChatUIContextService, HealthStatus } from 'diagnostic-data';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { SearchService } from '../services/search.service';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ObserverService } from '../../../shared/services/observer.service';
import { ICommandBarProps, PanelType, IBreadcrumbProps, IBreadcrumbItem, SpinnerSize, DialogType } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';
import { L2SideNavType } from '../l2-side-nav/l2-side-nav';
import { StartupService } from '../../../shared/services/startup.service';
import { UserInfo } from '../user-detectors/user-detectors.component';
import { BreadcrumbService } from '../services/breadcrumb.service';
import { UserSettingService } from '../services/user-setting.service';
import { AlertService } from '../../../shared/services/alert.service';
import { AlertInfo, ConfirmationOption } from 'diagnostic-data';
import { TelemetryService } from 'diagnostic-data';
import { TelemetryEventNames } from 'diagnostic-data';
import { HttpErrorResponse } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { UserAccessStatus } from "diagnostic-data";
import { defaultResourceTypes } from '../../../shared/utilities/main-page-menu-options';
import { DetectorCopilotService } from '../services/detector-copilot.service';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy {
  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  navigateSub: Subscription;
  userId: string = "";
  userName: string = "";
  displayName: string = "";
  userPhotoSource: string = undefined;
  keys: string[];
  currentRoutePath: string[];
  resource: any;
  observerLink: string = "";
  stampAppLensLink: string = "";
  showUserInformation: boolean;
  resourceReady: Observable<any>;
  resourceDetailsSub: Subscription;
  type: PanelType = PanelType.custom;
  width: string = "850px";
  showTitle: boolean = true;
  panelStyles: any = {
    root: {
      marginTop: '50px',
    }
  }

  commandBarStyles: ICommandBarProps["styles"] = {
    root: {
      padding: "0px"
    }
  };

  title: string = "";
  dashboardContainerStyle: any;
  showL2SideNav: boolean = false;
  expandL1SideNav: boolean = false;
  breadcrumbItems: IBreadcrumbItem[] = [];
  breadcrumbStyles: IBreadcrumbProps['styles'] = {
    itemLink: {
      fontSize: "14px",
      textDecoration: 'underline',
      selectors: {
        ':hover': {
          textDecoration: 'underline',
        },
        ':focus': {
          textDecoration: 'underline',
        },
        ':hover:focus': {
          textDecoration: 'underline',
        },
      },
    },
  }
  breadcrumbTooltipHostProps: IBreadcrumbProps['tooltipHostProps'] = {
    styles: {
      root: {
        fontWeight: "400",
        color: "#256ccf",
      }
    }
  }

  accessError: string = '';
  displayAlertDialog: boolean = false;
  displayErrorInDialog: boolean = false;
  errorInDialog: string = null;
  showLoaderInDialog: boolean = false;
  alertInfo: AlertInfo = null;
  stillLoading: boolean = false;
  loaderSize = SpinnerSize.large;
  showDashboardContent: boolean = true;
  showGPTComponent: boolean = false;
  alertDialogStyles = { main: { maxWidth: "70vw!important", minWidth: "40vw!important" } };
  alertDialogProps = { isBlocking: true }
  dialogType: DialogType = DialogType.normal;
  crossSubJustification: string = '';
  defaultResourceTypes = defaultResourceTypes;
  isPPE: boolean = false;
  detectorCopilotEnabled: boolean = false;
  displayResourceAlert: boolean = false;
  hideResourceAlert: boolean = false;
  constructor(public resourceService: ResourceService, private startupService: StartupService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _navigator: FeatureNavigationService,
    private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, public _searchService: SearchService, private _diagnosticApiService: DiagnosticApiService, private _observerService: ObserverService, public _applensGlobal: ApplensGlobal, private _startupService: StartupService, private _resourceService: ResourceService, private _breadcrumbService: BreadcrumbService, private _userSettingsService: UserSettingService, private _themeService: GenericThemeService,
    private _alertService: AlertService, private _telemetryService: TelemetryService, private _titleService: Title, private _chatContextService: ChatUIContextService, public _detectorCopilotService: DetectorCopilotService) {
    this.contentHeight = (window.innerHeight - 50) + 'px';

    this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
      if (detector) {
        this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
      }
    });

    this._router.events.subscribe((val) => {
      // see also
      this.checkGPTRoute();
    });

    // Add time params to route if not already present
    if (!this._activatedRoute.queryParams['startTime'] || !this._activatedRoute.queryParams['endTime']) {
      let routeParams = {
        'startTime': this._detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this._detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      // If browser URL contains detectorQueryParams, adding it to route
      if (!this._activatedRoute.queryParams['detectorQueryParams']) {
        routeParams['detectorQueryParams'] = this._activatedRoute.snapshot.queryParams['detectorQueryParams'];
      }
      if (!this._activatedRoute.queryParams['searchTerm']) {
        this._searchService.searchTerm = this._activatedRoute.snapshot.queryParams['searchTerm'];
        routeParams['searchTerm'] = this._activatedRoute.snapshot.queryParams['searchTerm'];
      }

      if (!this._activatedRoute.queryParams['caseNumber']) {
        let caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber'] ? this._activatedRoute.snapshot.queryParams['caseNumber'] : (this._activatedRoute.snapshot.queryParams['srId'] ? this._activatedRoute.snapshot.queryParams['srId'] : null);
        this._diagnosticApiService.setCustomerCaseNumber(caseNumber);
        routeParams['caseNumber'] = caseNumber;
      }

      this._router.navigate([], { queryParams: routeParams, queryParamsHandling: 'merge', relativeTo: this._activatedRoute });
    }

    if ((this.showUserInformation = environment.adal.enabled)) {
      let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      this.userId = alias.replace('@microsoft.com', '');
      this._chatContextService.userId = this.userId;
      this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {

        this.userPhotoSource = image;
        this._chatContextService.userPhotoSource = this.userPhotoSource;
      });

      this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
        this.userName = userInfo.givenName;
        this.displayName = userInfo.displayName;
      });

      if (this._adalService.userInfo.profile) {
        const familyName: string = this._adalService.userInfo.profile.family_name;
        const givenName: string = this._adalService.userInfo.profile.given_name;
        this._chatContextService.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
      }
    }

    this._alertService.getAlert().subscribe((alert: AlertInfo) => {
      this.alertInfo = alert;
      this.displayAlertDialog = alert.userAccessStatus != UserAccessStatus.AllowedResourceException;
      this.displayResourceAlert = alert.userAccessStatus == UserAccessStatus.AllowedResourceException;
      this.hideResourceAlert = !(alert.userAccessStatus == UserAccessStatus.AllowedResourceException);
      setTimeout(() => {
        var elem = document.getElementsByClassName('ms-Dialog-title')[0] as HTMLElement;
        if (elem) {
          elem.focus();
        }
      }, 500);
    });

    this._alertService.getUnAuthorizedAlerts().subscribe((error: HttpErrorResponse) => {
      let errorObj = JSON.parse(error.error);
      if (errorObj && errorObj.DetailText) {
        this.accessError = errorObj.DetailText;
        this.navigateBackToHomePage();
      }
    });

    this._diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
      this.isPPE = env === "PPE";
    });
  }

  resetDialogSuccessStatus() {
    this.errorInDialog = null;
    this.displayErrorInDialog = false;
  }

  CheckIsResourceUnrelatedError(detailText) {
    return detailText && detailText.includes("resource is not related to the case");
  }

  navigateBackToHomePage() {
    let resourceInfo = this._startupService.getResourceInfo();
    let resourceProviderFull = `${resourceInfo.provider}/${resourceInfo.resourceTypeName}`.toLowerCase();
    let mainPageResourceType = this.defaultResourceTypes.find(x => x.resourceType && x.resourceType.toLowerCase() === resourceProviderFull);
    let queryParams = {
      ...(this.accessError.includes("User is not allowed to access this resource without a case number") ? { caseNumberNeeded: "true" } : {}),
      ...(this._diagnosticApiService.CustomerCaseNumber ? { caseNumber: this._diagnosticApiService.CustomerCaseNumber } : {}),
      errorMessage: this.accessError,
      resourceType: mainPageResourceType ? mainPageResourceType.resourceType : "armresourceid",
      resourceName: resourceInfo.resourceName,
      resourceId: this._resourceService.getCurrentResourceId(),
      targetPathBeforeError: this._router.url.toString()
    };
    const queryString = new URLSearchParams(queryParams).toString();
    window.location.href = "/?" + queryString;
  }

  examineUserAccess() {
    this._diagnosticApiService.checkUserAccess().subscribe(res => {
      if (res && res.Status == UserAccessStatus.CaseNumberNeeded) {
        this._diagnosticApiService.setCaseNumberNeededForUser(true);
      }
      else {
        this._diagnosticApiService.setCaseNumberNeededForUser(false);
      }
    }, (err) => {
      if (err.status === 404) {
        //This means userAuthorization is not yet available on the backend
        this._diagnosticApiService.setCaseNumberNeededForUser(false);
        return;
      }
      if (err.status === 403) {
        this.navigateToUnauthorized();
      }
    });
  }

  navigateToUnauthorized() {
    this._router.navigate(['unauthorized'], { queryParams: { isDurianEnabled: true } });
  }

  isValidAzureResource(resourceId: string): boolean {
    const azureResourceIdRegex = /^subscriptions\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\/resourceGroups\/[^/]+\/providers\/Microsoft\.[^/]+\/[^/]+\/[^/]+$/i;  
    return azureResourceIdRegex.test(resourceId);
  }

  handleUserResponse(userResponse: ConfirmationOption) {
    let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    if (userResponse.value === 'yes') {
      if (!(this.crossSubJustification && this.crossSubJustification.length > 0)) {
        this.errorInDialog = 'Please enter a justification';
        this.displayErrorInDialog = true;
        return;
      }
      let resourceId = this.isValidAzureResource(this.alertInfo.resourceId)? this.alertInfo.resourceId: undefined      
      this._telemetryService.logEvent(TelemetryEventNames.ResourceOutOfScopeUserResponse, { userId: alias, url: this._router.url, resourceId: resourceId, userResponse: userResponse.label, userJustification: this.crossSubJustification, caseNumber: this._diagnosticApiService.CustomerCaseNumber });
      this.showLoaderInDialog = true;
      this._diagnosticService.unrelatedResourceConfirmation(resourceId).subscribe(() => {
        this.showLoaderInDialog = false;
        this.displayAlertDialog = false;
        this.alertInfo = null;
        location.reload();
      },
        (err) => {
          this.showLoaderInDialog = false;
          let error = err.error;
          this.errorInDialog = error;
          this.displayErrorInDialog = true;
        });
    }
    else if (userResponse.value == 'no') {
      this._telemetryService.logEvent(TelemetryEventNames.ResourceOutOfScopeUserResponse, { userId: alias, url: this._router.url, userResponse: userResponse.label, caseNumber: this._diagnosticApiService.CustomerCaseNumber });
      this.accessError = this.alertInfo.details;
      this.navigateBackToHomePage();
    }
  }

  addCaseNumberToLinks(caseNumber) {
    if (caseNumber && caseNumber.length > 0) {
      var x = document.getElementsByTagName("a");
      for (var i = 0; i < x.length; i++) {
        let link = x[i].href;
        if (link && (link.startsWith("https://applens.azurewebsites.net") || link.startsWith("https://applens.trafficmanager.net")) && !(link.includes("caseNumber"))) {
          x[i].href = link + (link.includes("?") ? "&" : "?") + "caseNumber=" + caseNumber;
        }
      }
    }
  }

  checkGPTRoute() {
    if (this._router.url.includes("chatgpt")) {
      this.showGPTComponent = true;
    }
    else {
      this.showGPTComponent = false;
    }
  }

  resourceAlertDialogCancel() {
    this.hideResourceAlert = true;
  }

  ngOnInit() {
    if (this._diagnosticApiService.CustomerCaseNumber && this._diagnosticApiService.CustomerCaseNumber.length > 0) {
      setInterval(() => { this.addCaseNumberToLinks(this._diagnosticApiService.CustomerCaseNumber) }, 500);
    }
    this.examineUserAccess();
    this.checkGPTRoute();
    this.stillLoading = true;
    this._diagnosticService.getDetectors().subscribe(detectors => {
      this.stillLoading = false;
    },
      (err) => {
        this.stillLoading = false;
        this.showDashboardContent = false;
        let errobj = JSON.parse(err.error);
        this.accessError = errobj.DetailText;
        if (!this.CheckIsResourceUnrelatedError(errobj.DetailText)) {
          this.navigateBackToHomePage();
        }
      });

    this.title = "";
    this._applensGlobal.headerTitleSubject.subscribe(title => {
      const { resourceName } = this._activatedRoute.snapshot.data["info"] || {};
      this.title = title;

      if (title?.length > 0 && resourceName?.length > 0) {
        this._titleService.setTitle(`Applens - ${resourceName} (${title})`);
      }
    });

    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.showL2SideNav = type !== L2SideNavType.None;
    });

    this._applensGlobal.expandL1SideNavSubject.subscribe(isExpand => {
      this.expandL1SideNav = isExpand;
    });

    if (!!this._activatedRoute && !!this._activatedRoute.snapshot && !!this._activatedRoute.snapshot.queryParams && !!this._activatedRoute.snapshot.queryParams['l']) {
      this._diagnosticApiService.effectiveLocale = this._activatedRoute.snapshot.queryParams['l'].toString().toLowerCase();
    }

    this._userSettingsService.getUserSetting().subscribe(userInfo => {
      if (!!userInfo && userInfo.theme != "") {
        this._themeService.setActiveTheme(userInfo.theme.toLowerCase());

      }
    });

    let serviceInputs = this._startupService.getInputs();
    this.resourceReady = this.resourceService.getCurrentResource();
    this.resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;
        if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/hostingenvironments' && this.resource && this.resource.Name) {
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/MiniEnvironments/" + this.resource.Name;
          this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
          this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/sites') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
          this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
          this._diagnosticApiService.Location = this.resource["WebSpace"];
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/sites/" + this.resource.SiteName;

          if (resource['IsXenon']) {
            this.resourceService.imgSrc = this.resourceService.altIcons['Xenon'];
          }
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/containerapps' ||
          serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.app/containerapps') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource.ServiceAddress;
          this._diagnosticApiService.GeomasterName = this.resource.GeoMasterName;
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/partner/containerapp/" + this.resource.ContainerAppName;
        }

        this.keys = Object.keys(this.resource);
        if (this.keys.indexOf("StampName") >= 0) {
          this.stampAppLensLink = `${window.location.origin}/stamps/${this.resource.StampName}`;
        }
        this.keys.sort((a, b) => a.localeCompare(b));
        this.replaceResourceEmptyValue();
        if (serviceInputs.resourceType.toString().toLowerCase() == "stamps") {
          this.updateAdditionalStampInfo();
        }
        else {
          this.updateVentAndLinuxInfo();
        }
      }
    });

    this._breadcrumbService.breadcrumbSubject.subscribe(items => {
      this.breadcrumbItems = [];
      items.forEach(i => {
        const breadcrumbItem = this.convertToBreadCrumbItem(i);
        this.breadcrumbItems.push(breadcrumbItem);
      });
      this.breadcrumbItems[this.breadcrumbItems.length - 1].isCurrentItem = true;
    });

    this._applensGlobal.sideMenuCollapsed.subscribe(collapsed => {
      if (collapsed) {
        this.dashboardContainerStyle = {
          'left': '16px',
          'width': 'calc(100% - 17px)'
        }
      }
      else {
        // restore the old size
        this.getContainerStyle();
      }
    });

    this._diagnosticApiService.get<boolean>('api/openai/detectorcopilot/enabled').subscribe(res => {
      this.detectorCopilotEnabled = res;
    });
  }

  updateAdditionalStampInfo() {
    if (this.keys.indexOf('JarvisDashboard') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._resourceService.getAdditionalResourceInfo(this.resource).subscribe(resourceInfo => {
            for (let key in resourceInfo) {
              this.resource[key] = resourceInfo[key];
              this.keys.push(key);
            };
            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }


  triggerSearch() {
    this._searchService.searchTerm = this._searchService.searchTerm.trim();
    if (this._searchService.searchIsEnabled && this._searchService.searchTerm && this._searchService.searchTerm.length > 3) {
      this.navigateTo(`search`, { searchTerm: this._searchService.searchTerm }, 'merge');
    }
  }

  navigateTo(path: string, queryParams?: any, queryParamsHandling?: any) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: queryParamsHandling || 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute,
      queryParams: queryParams
    };

    this._router.navigate([path], navigationExtras);
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  navigateToUserPage() {
    this.navigateTo(`users/${this.userId}`);
  }

  dismissedHandler() {
    this._applensGlobal.openResourceInfoPanel = false;
  }

  copyToClipboard(item, event) {
    let listener = (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
    };

    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    event.target.src = "/assets/img/copy-icon-copied.png";
    setTimeout(() => {
      event.target.src = "/assets/img/copy-icon.png";
    }, 3000);
  }

  updateVentAndLinuxInfo() {
    if (this.keys.indexOf('VnetName') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._observerService.getSiteRequestDetails(this.resource.SiteName, this.resource.InternalStampName).subscribe(siteInfo => {
            this.resource['VnetName'] = siteInfo.details.vnetname;
            this.keys.push('VnetName');

            if (this.resource['IsLinux']) {
              this.resource['LinuxFxVersion'] = siteInfo.details.linuxfxversion;
              this.keys.push('LinuxFxVersion');
            }

            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }

  replaceResourceEmptyValue() {
    this.keys.forEach(key => {
      if (this.resource[key] === "") {
        this.resource[key] = "N/A";
      }
    });
  }

  ngOnDestroy() {
    this.navigateSub.unsubscribe();
  }

  getContainerStyle() {

    this.dashboardContainerStyle =
    {
      'left': '250px',
      'width': 'calc(100% - 250px)'
    };
  }

  private updateShowTitle() {
    const showTitle = this._activatedRoute.firstChild.snapshot.data["showTitle"];
    this.showTitle = showTitle === undefined ? true : showTitle;
  }

  private convertToBreadCrumbItem(navigationItem: BreadcrumbNavigationItem): IBreadcrumbItem {
    const item: IBreadcrumbItem = {
      key: navigationItem.name,
      text: navigationItem.name,
      onClick: (ev, item) => {
        this._breadcrumbService.navigate(navigationItem);
      }
    }
    return item;
  }

  checkWithHref(s: string) {
    return `${s}`.includes("a href");
  }

  dismissCopilotPanel = () => {
    this._detectorCopilotService.onCloseCopilotPanelEvent.next({ showConfirmation: true, resetCopilot: false });
  }
}

@Pipe({ name: 'formatResourceName' })
export class FormatResourceNamePipe implements PipeTransform {
  transform(resourceName: string): string {
    let displayedResourceName = resourceName;
    if (resourceName && resourceName.length >= 35) {
      displayedResourceName = resourceName.substring(0, 35).concat("...");
    }

    return displayedResourceName;
  }
}
