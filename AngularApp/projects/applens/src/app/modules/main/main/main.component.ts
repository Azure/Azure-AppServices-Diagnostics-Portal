import * as momentNs from 'moment';
import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router, ActivatedRoute } from '@angular/router';
import {
  ResourceServiceInputs, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { HttpClient } from '@angular/common/http';
import { IDropdownOption, IDropdownProps, ITextFieldProps, PanelType, SpinnerSize } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { DetectorControlService, GenericThemeService, HealthStatus } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../../dashboard/services/user-setting.service';
import { RecentResource } from '../../../shared/models/user-setting';
import { ResourceDescriptor } from 'diagnostic-data'
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { UserAccessStatus } from '../../../shared/models/alerts';
const moment = momentNs;

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  showResourceTypeOptions = false;
  showCaseCleansingOption = false;
  selectedResourceType: ResourceTypeState;
  resourceName: string;
  openResourceTypePanel: boolean = false;
  resourceTypeList: { name: string, imgSrc: string }[] = [];
  type: PanelType = PanelType.custom;
  width: string = "850px";
  panelStyles: any = {
    root: {
      marginTop: '50px',
    }
  }

  displayLoader: boolean = false;
  loaderSize = SpinnerSize.large;
  caseNumberNeededForUser: boolean = false;
  caseNumber: string = '';
  caseNumberValidationError: string = null;
  accessErrorMessage: string = '';
  userAccessErrorMessage: string = '';
  displayUserAccessError: boolean = false;
  caseNumberPlaceholder: string = "Type 'internal' for internal resources"

  defaultResourceTypes: ResourceTypeState[] = [
    {
      resourceType: "Microsoft.Web/sites",
      resourceTypeLabel: 'App name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App Service',
      enabled: true,
      caseId: false,
      id: 'App Service',
      userAuthorizationEnabled: true
    },
    {
      resourceType: "Microsoft.Web/hostingEnvironments",
      resourceTypeLabel: 'ASE name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false,
      id: 'App Service Environment',
      userAuthorizationEnabled: false
    },
    {
      resourceType: "Microsoft.Web/containerApps",
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `containerapps/${name}`,
      displayName: 'Container App',
      enabled: true,
      caseId: false,
      id: 'Container App',
      userAuthorizationEnabled: false
    }, {
      resourceType: "Microsoft.Web/staticSites",
      resourceTypeLabel: 'Static App Name Or Default Host Name',
      routeName: (name) => `staticwebapps/${name}`,
      displayName: 'Static Web App',
      enabled: true,
      caseId: false,
      id: 'Static Web App',
      userAuthorizationEnabled: false
    },
    {
      resourceType: "Microsoft.Compute/virtualMachines",
      resourceTypeLabel: 'Virtual machine Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Virtual Machine',
      enabled: true,
      caseId: false,
      id: 'Virtual Machine',
      userAuthorizationEnabled: false
    },
    {
      resourceType: "ARMResourceId",
      resourceTypeLabel: 'ARM Resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM Resource ID',
      enabled: true,
      caseId: false,
      id: 'ARM Resource ID',
      userAuthorizationEnabled: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Stamp name',
      routeName: (name) => `stampfinder/${name}`,
      displayName: 'Internal Stamp',
      enabled: true,
      caseId: false,
      id: 'Internal Stamp',
      userAuthorizationEnabled: false
    }
  ];
  resourceTypes: ResourceTypeState[] = [];
  startTime: momentNs.Moment;
  endTime: momentNs.Moment;
  enabledResourceTypes: ResourceServiceInputs[];
  inIFrame = false;
  errorMessage = "";
  status = HealthStatus.Critical;

  fabDropdownOptions: IDropdownOption[] = [];
  fabDropdownStyles: IDropdownProps["styles"] = {
    dropdownItemsWrapper: {
      maxHeight: '30vh'
    },
    root: {
      display: 'flex'
    },
    label: {
      width: '300px'
    },
    dropdown: {
      width: '300px'
    }

  }

  fabTextFieldStyles: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
      justifyContent: 'space-between'
    },
    field: {
      width: '300px'
    }
  }
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  timePickerStr: string = "";
  get disableSubmitButton(): boolean {
    return !this.resourceName || this.resourceName.length === 0;
  }
  troubleShootIcon: string = "../../../../assets/img/applens-skeleton/main/troubleshoot.svg";
  userGivenName: string = "";
  table: RecentResourceDisplay[];
  applensDocs = applensDocs;

  constructor(private _router: Router, private _http: HttpClient, private _detectorControlService: DetectorControlService, private _adalService: AdalService, private _userSettingService: UserSettingService, private _themeService: GenericThemeService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    if (this._activatedRoute.snapshot.queryParams['caseNumber'] && this._activatedRoute.snapshot.queryParams['caseNumber'] !== "undefined") {
      this.caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceName']) {
      this.resourceName = this._activatedRoute.snapshot.queryParams['resourceName'];
    }
    if (this._activatedRoute.snapshot.queryParams['errorMessage']) {
      this.accessErrorMessage = this._activatedRoute.snapshot.queryParams['errorMessage'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceType']) {
      let foundResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType.toLowerCase() === this._activatedRoute.snapshot.queryParams['resourceType'].toLowerCase());
      if (!foundResourceType) {
        this.selectedResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType.toLowerCase() === "armresourceid");
        this.resourceName = this._activatedRoute.snapshot.queryParams['resourceId'];
      }
      else {
        this.selectedResourceType = foundResourceType;
      }
    }
  }

  validateCaseNumber() {
    if (!this.caseNumber || this.caseNumber.length < 12) {
      this.caseNumberValidationError = "Case number too short. It should be a minimum of 12 digits.";
      return false;
    }
    if (this.caseNumber.length > 18) {
      this.caseNumberValidationError = "Case number too long. It should be a maximum of 18 digits.";
      return false;
    }
    if (this.caseNumber && this.caseNumber.length > 0 && isNaN(Number(this.caseNumber))) {
      this.caseNumberValidationError = `'${this.caseNumber}' is not a valid number.`;
      return false;
    }
    else {
      this.caseNumberValidationError = "";
      return true;
    }
  }

  fetchUserDetails() {
    this.displayLoader = true;
    this.userAccessErrorMessage = '';
    this.displayUserAccessError = false;
    this._diagnosticApiService.checkUserAccess().subscribe(res => {
      if (res && res.Status == UserAccessStatus.CaseNumberNeeded) {
        this.caseNumberNeededForUser = true;
        this._diagnosticApiService.setCaseNumberNeededForUser(this.caseNumberNeededForUser);
        this.displayLoader = false;
      }
      else {
        this.displayLoader = false;
      }
    }, (err) => {
      if (err.status === 404) {
        //This means userAuthorization is not yet available on the backend
        this.caseNumberNeededForUser = false;
        this._diagnosticApiService.setCaseNumberNeededForUser(this.caseNumberNeededForUser);
        this.displayLoader = false;
        return;
      }
      if (err.status === 403) {
        this.displayLoader = false;
        this.navigateToUnauthorized();
      }
      let errormsg = err.error;
      errormsg = errormsg.replace(/\\"/g, '"');
      errormsg = errormsg.replace(/\"/g, '"');
      let errobj = JSON.parse(errormsg);
      this.displayUserAccessError = true;
      this.userAccessErrorMessage = errobj.DetailText;
      this.displayLoader = false;
    });
  }

  ngOnInit() {
    this.fetchUserDetails();
    this.resourceTypes = [...this.defaultResourceTypes];
    if (!this.selectedResourceType) {
      this.selectedResourceType = this.defaultResourceTypes[0];
    }

    this.defaultResourceTypes.forEach(resource => {
      this.fabDropdownOptions.push({
        key: resource.id,
        text: resource.displayName,
        ariaLabel: resource.displayName,
      });
    });


    this._userSettingService.getUserSetting().subscribe(userInfo => {
      if (userInfo && userInfo.theme && userInfo.theme.toLowerCase() == "dark") {
        this._themeService.setActiveTheme("dark");
      }

      if (!(this.accessErrorMessage && this.accessErrorMessage.length > 0 && this.selectedResourceType) && userInfo && userInfo.defaultServiceType && this.defaultResourceTypes.find(type => type.id.toLowerCase() === userInfo.defaultServiceType.toLowerCase())) {
        this.selectedResourceType = this.defaultResourceTypes.find(type => type.id.toLowerCase() === userInfo.defaultServiceType.toLowerCase());
      }
    });

    this.resourceTypeList = [
      { name: "App", imgSrc: "assets/img/Azure-WebApps-Logo.png" },
      { name: "Linux App", imgSrc: "assets/img/Azure-Tux-Logo.png" },
      { name: "Function App", imgSrc: "assets/img/Azure-Functions-Logo.png" },
      { name: "Logic App", imgSrc: "assets/img/Azure-LogicAppsPreview-Logo.svg" },
      { name: "App Service Environment", imgSrc: "assets/img/ASE-Logo.jpg" },
      { name: "Virtual Machine", imgSrc: "assets/img/Icon-compute-21-Virtual-Machine.svg" },
      { name: "Container App", imgSrc: "assets/img/Azure-ContainerApp-Logo.png" },
      { name: "Internal Stamp", imgSrc: "assets/img/Cloud-Service-Logo.svg" }];

    // TODO: Use this to restrict access to routes that don't match a supported resource type
    this._http.get<ResourceServiceInputsJsonResponse>('assets/enabledResourceTypes.json').subscribe(jsonResponse => {
      this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
      this.enabledResourceTypes.forEach(resource => {
        if (this.resourceTypeList.findIndex(item => item.name.toLowerCase() === resource.displayName.toLowerCase()) < 0) {
          this.resourceTypeList.push({ name: resource.displayName, imgSrc: resource ? resource.imgSrc : "" })
        }
      });
      this.resourceTypeList.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });

      this._userSettingService.getUserSetting().subscribe(userInfo => {
        if (userInfo && userInfo.resources) {
          this.table = this.generateDataTable(userInfo.resources);
        }
      });
    });

    this._detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerStr = s;
    });

    this.userGivenName = this._adalService.userInfo.profile.given_name;
  }

  openResourcePanel() {
    this.openResourceTypePanel = true;
  }

  dismissedHandler() {
    this.openResourceTypePanel = false;
  }

  selectResourceType(type: ResourceTypeState) {
    if (type.enabled) {
      this.selectedResourceType = type;
      this.showResourceTypeOptions = false;
    }
    this.selectedResourceType = type;
  }

  selectDropdownKey(e: { option: IDropdownOption, index: number }) {
    const resourceType = this.defaultResourceTypes.find(resource => resource.displayName === e.option.text);
    this.selectResourceType(resourceType);
  }

  private normalizeArmUriForRoute(resourceURI: string, enabledResourceTypes: ResourceServiceInputs[]): string {
    resourceURI = resourceURI.trim();
    const resourceUriPattern = /subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/(.*)/i;
    const result = resourceURI.match(resourceUriPattern);

    if (result && result.length === 4) {
      let allowedResources: string = "";
      let routeString: string = '';

      if (enabledResourceTypes) {
        enabledResourceTypes.forEach(enabledResource => {
          allowedResources += `${enabledResource.resourceType}\n`;
          const resourcePattern = new RegExp(
            `(?<=${enabledResource.resourceType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\/).*`, 'i'
          );
          const enabledResourceResult = result[3].match(resourcePattern);

          if (enabledResourceResult) {
            routeString = `subscriptions/${result[1]}/resourceGroups/${result[2]}/providers/${enabledResource.resourceType}/${enabledResourceResult[0]}`;
          }
        });
      }

      this.errorMessage = routeString === '' ?
        'The supplied ARM resource is not enabled in AppLens. Allowed resource types are as follows\n\n' +
        `${allowedResources}` :
        '';

      return routeString;
    } else {
      this.errorMessage = "Invalid ARM resource id. Resource id must be of the following format:\n" +
        `  /subscriptions/<sub id>/resourceGroups/<resource group>/providers/${this.selectedResourceType.resourceType}/` +
        "<resource name>";

      return resourceURI;
    }
  }

  onSubmit() {
    this._userSettingService.updateDefaultServiceType(this.selectedResourceType.id);
    if (!(this.caseNumber == "internal") && this.caseNumberNeededForUser && (this.selectedResourceType && this.selectedResourceType.userAuthorizationEnabled)) {
      this.caseNumber = this.caseNumber.trim();
      if (!this.validateCaseNumber()) {
        return;
      }
      this._diagnosticApiService.setCustomerCaseNumber(this.caseNumber);
    }
    this.resourceName = this.resourceName.trim();

    //If it is ARM resource id
    //if (this.defaultResourceTypes.findIndex(resource => this.selectedResourceType.displayName === resource.displayName) === -1) {
    if (this.selectedResourceType.displayName === "ARM Resource ID") {
      this.resourceName = this.normalizeArmUriForRoute(this.resourceName, this.enabledResourceTypes);
    } else {
      this.errorMessage = "";
    }

    let route = this.selectedResourceType.routeName(this.resourceName);

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${this.resourceName}`;
    }


    this._detectorControlService.setCustomStartEnd(this._detectorControlService.startTime, this._detectorControlService.endTime);

    let timeParams = {
      startTime: this._detectorControlService.startTimeString,
      endTime: this._detectorControlService.endTimeString
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        ...timeParams,
        ...!(this.caseNumber == "internal") && this.caseNumber ? { caseNumber: this.caseNumber } : {}
      },
    }

    if (this.errorMessage === '') {
      this._router.navigate([route], navigationExtras);
    }
  }

  caseCleansingNavigate() {
    this._router.navigate(["caseCleansing"]);
  }

  private getFakeArmResource(rpName: string, serviceName: string, resourceName: string): string {
    let fakeRes = `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/${rpName}/${serviceName}/${resourceName}`;
    return fakeRes;
  }

  openTimePicker() {
    this.openTimePickerSubject.next(true);
  }


  private generateDataTable(recentResources: RecentResource[]) {

    let rows: RecentResourceDisplay[];
    rows = recentResources.map(recentResource => {
      if (recentResource.resourceUri.toLowerCase().includes("/stamps/")) {
        return this.handleStampForRecentResource(recentResource);
      }
      var descriptor = ResourceDescriptor.parseResourceUri(recentResource.resourceUri);
      const name = descriptor.resource;
      const type = `${descriptor.provider}/${descriptor.type}`.toLowerCase();
      const resourceType = this.enabledResourceTypes.find(t => t.resourceType.toLocaleLowerCase() === type);
      const display: RecentResourceDisplay = {
        name: name,
        imgSrc: resourceType ? resourceType.imgSrc : "",
        type: resourceType ? resourceType.displayName : "",
        kind: recentResource.kind,
        resourceUri: recentResource.resourceUri,
        queryParams: recentResource.queryParams
      }
      if (type === "microsoft.web/sites") {
        this.updateDisplayWithKind(recentResource.kind, display);
      }
      return display;
    });
    return rows;
  }

  private handleStampForRecentResource(recentResource: RecentResource): RecentResourceDisplay {
    let stampName = null;
    const resourceType = this.enabledResourceTypes.find(t => t.resourceType.toLocaleLowerCase() === "stamps");
    let resourceUriRegExp = new RegExp('/infrastructure/stamps/([^/]+)', "i");
    let resourceUri = recentResource.resourceUri;
    if (!resourceUri.startsWith('/')) {
      resourceUri = '/' + resourceUri;
    }
    var result = resourceUri.match(resourceUriRegExp);
    if (result && result.length > 0) {
      stampName = result[1];
    }
    return <RecentResourceDisplay>{
      name: stampName,
      imgSrc: resourceType ? resourceType.imgSrc : "",
      type: resourceType ? resourceType.displayName : "",
      kind: recentResource.kind,
      resourceUri: recentResource.resourceUri.replace("infrastructure/stamps", "stamps"),
      queryParams: recentResource.queryParams
    }
  }

  //To do, Add a utility method to check kind and use in main.component and site.service
  private updateDisplayWithKind(kind: string, recentResourceDisplay: RecentResourceDisplay) {
    if (kind && kind.toLowerCase().indexOf("workflowapp") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-LogicAppsPreview-Logo.svg";
      recentResourceDisplay.type = "Logic App";
    } else if (kind && kind.toLowerCase().indexOf("functionapp") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-Functions-Logo.png";
      recentResourceDisplay.type = "Function App";
    } else if (kind && kind.toLowerCase().indexOf("linux") !== -1) {
      recentResourceDisplay.imgSrc = "assets/img/Azure-Tux-Logo.png";
      recentResourceDisplay.type = "Linux Web App";
    }
  }

  private onNavigateRecentResource(recentResource: RecentResourceDisplay) {
    const startUtc = this._detectorControlService.startTime;
    const endUtc = this._detectorControlService.endTime;

    const queryParams = recentResource.queryParams ? { ...recentResource.queryParams } : {};

    if (!this.checkTimeStringIsValid(queryParams["startTime"]) || !this.checkTimeStringIsValid(queryParams["endTime"])) {
      queryParams["startTime"] = startUtc ? startUtc.format(this._detectorControlService.stringFormat) : "";
      queryParams["endTime"] = endUtc ? endUtc.format(this._detectorControlService.stringFormat) : "";
    }

    const navigationExtras: NavigationExtras = {
      queryParams: queryParams
    }

    const route = recentResource.resourceUri;
    this._router.navigate([route], navigationExtras);
  }

  clickRecentResourceHandler(event: Event, recentResource: RecentResourceDisplay) {
    event.stopPropagation();
    this.onNavigateRecentResource(recentResource);
  }

  updateResourceName(e: { event: Event, newValue?: string }) {
    this.resourceName = e.newValue.toString();
  }

  navigateToUnauthorized() {
    this._router.navigate(['unauthorized'], { queryParams: { isDurianEnabled: true } });
  }

  private checkTimeStringIsValid(timeString: string): boolean {
    if (timeString == null || timeString.length === 0) return false;
    const time: momentNs.Moment = moment.utc(timeString);
    return time.isValid();
  }

}

interface RecentResourceDisplay extends RecentResource {
  name: string;
  imgSrc: string;
  type: string;
}


