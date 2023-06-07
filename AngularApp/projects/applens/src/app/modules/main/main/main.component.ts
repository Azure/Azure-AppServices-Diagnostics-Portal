import * as momentNs from 'moment';
import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router, ActivatedRoute } from '@angular/router';
import {
  ResourceServiceInputs, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { HttpClient } from '@angular/common/http';
import { IBasePickerProps, ICheckboxProps, IDropdownOption, IDropdownProps, ITag, ITagItemProps, ITagPickerProps, ITextFieldProps, PanelType, SpinnerSize } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { DetectorControlService, GenericThemeService, HealthStatus } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../../dashboard/services/user-setting.service';
import { RecentResource } from '../../../shared/models/user-setting';
import { ResourceDescriptor } from 'diagnostic-data'
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { defaultResourceTypes } from '../../../shared/utilities/main-page-menu-options';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { UserAccessStatus } from '../../../shared/models/alerts';
import { applensDashboards } from '../../../shared/utilities/applens-dashboards-constant';
import { Guid } from 'projects/diagnostic-data/src/lib/utilities/guid';
import { TimeUtilities } from 'projects/diagnostic-data/src/lib/utilities/time-utilities';

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
  caseNumberNeededForProduct: boolean = false;
  caseNumberNeededForRP: boolean = false;
  caseNumberEnabledRPs: string[] = [];
  caseNumber: string = '';
  caseNumberValidationError: string = null;
  accessErrorMessage: string = '';
  userAccessErrorMessage: string = '';
  displayUserAccessError: boolean = false;
  caseNumberPlaceholder: string = "Type 'internal' for internal resources"

  defaultResourceTypes: ResourceTypeState[] = defaultResourceTypes;
  resourceTypes: ResourceTypeState[] = [];
  startTime: momentNs.Moment;
  endTime: momentNs.Moment;
  enabledResourceTypes: ResourceServiceInputs[];
  inIFrame = false;
  errorMessage = "";
  status = HealthStatus.Critical;
  targetPathBeforeError: string = "";
  isNoResource:boolean = false;
  isArmResourceRelatedError : boolean = false;
  isDeletedOrCreationFailedResource : boolean = false;
  deletedOrCreationFailedResourceEventTime: momentNs.Moment;
  queryParams: any;

  fabCheckBoxStyles: ICheckboxProps["styles"] = {
    text:{
      fontSize: '14px',
      fontWeight: '400'
    }
  }

  serviceTypePickerInputProps:IBasePickerProps<ITagPickerProps>["inputProps"] = {
    "aria-label": "Service type picker",
    spellCheck: false,
    autoComplete: "off",
    width:'300px',
    style: {
      width:'300px'
    }
  };
  serviceTypePickerSelectedItems: ITag[];

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
    return (!this.isDeletedOrCreationFailedResource && (!this.resourceName || this.resourceName.length === 0)) || (this.isDeletedOrCreationFailedResource && this.deletedOrCreationFailedResourceEventTime == null);
  }
  troubleShootIcon: string = "../../../../assets/img/applens-skeleton/main/troubleshoot.svg";
  userGivenName: string = "";
  table: RecentResourceDisplay[];
  applensDocs = applensDocs;
  applensDashboards = applensDashboards;

  constructor(private _router: Router, private _http: HttpClient, private _detectorControlService: DetectorControlService, private _adalService: AdalService, private _userSettingService: UserSettingService, private _themeService: GenericThemeService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    if (this._activatedRoute.snapshot.queryParams['caseNumber']) {
      this.caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceName']) {
      this.resourceName = this._activatedRoute.snapshot.queryParams['resourceName'];
    }
    if (this._activatedRoute.snapshot.queryParams['errorMessage']) {
      this.accessErrorMessage = this._activatedRoute.snapshot.queryParams['errorMessage'];
    }
    if (this._activatedRoute.snapshot.queryParams['caseNumberNeeded']) {
      this.caseNumberNeededForProduct = true;
    }
    if (this._activatedRoute.snapshot.queryParams['targetPathBeforeError']) {
      this.targetPathBeforeError = this._activatedRoute.snapshot.queryParams['targetPathBeforeError'];
    }
    if (this._activatedRoute.snapshot.queryParams['resourceType']) {
      let foundResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType.toLowerCase() === this._activatedRoute.snapshot.queryParams['resourceType'].toLowerCase());
      if (!foundResourceType) {
        this.selectedResourceType = this.defaultResourceTypes.find(resourceType => resourceType.resourceType.toLowerCase() === "armresourceid");
      }
      else {
        this.selectedResourceType = foundResourceType;
      }
      if (this.selectedResourceType.resourceType == "ARMResourceId") {
        this.resourceName = this._activatedRoute.snapshot.queryParams['resourceId'];
      }
      this.hasResourceCaseNumberEnforced();
    }
  }

  validateCaseNumber() {
    if (!this.caseNumber || this.caseNumber.length < 12) {
      this.caseNumberValidationError = "Case number too short. It should be a minimum of 15 digits.";
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

  fetchCaseNumberEnforcedRpList(){
    this.displayLoader = true;
    this._diagnosticApiService.FetchCaseEnabledResourceProviders().subscribe(res => {
      this.displayLoader = false;
      if (res && res.length>0) {
        this.caseNumberEnabledRPs = res.split(",").map(x => x.toLowerCase());
      }
      this.hasResourceCaseNumberEnforced();
    },
    (err) => {
      //This failure is critical, we will choose to show an error and request the user to try again
      this.userAccessErrorMessage = "Failed to fetch case number enforcement information. Please try again. If the error persists, contact AppLens team.";
      this.displayUserAccessError = true;
      this.displayLoader = false;
    });
  }

  //Checks if RP has case number enforcement e.g. microsoft.web/sites
  hasRPCaseNumberEnforced(rpName) {
    rpName = rpName.toLowerCase();
    return this.caseNumberEnabledRPs.indexOf(rpName)>= 0;
  }

  extractRPInfoFromARMUri(armUri) {
    const resourceUriPattern = /subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/([a-zA-Z\.]+)\/([a-zA-Z\.]+)\//i;
    if (armUri && armUri.length>0) {
      const match = armUri.match(resourceUriPattern);
      return `${match[3]}/${match[4]}`;
    }
    else {
      return "";
    }
  }

  hasResourceCaseNumberEnforced() {
    if (this.selectedResourceType.resourceType != null) {
      if (this.selectedResourceType.resourceType.toLowerCase() == "armresourceid") {
        this.caseNumberNeededForRP = this.hasRPCaseNumberEnforced(this.extractRPInfoFromARMUri(this.resourceName));
      }
      else {
        this.caseNumberNeededForRP = this.hasRPCaseNumberEnforced(this.selectedResourceType.resourceType);
      }
    }
    else {
      this.caseNumberNeededForRP = false;
    }
  }

  fetchUserDetails() {
    this.displayLoader = true;
    this.userAccessErrorMessage = '';
    this.displayUserAccessError = false;
    this._diagnosticApiService.checkUserAccess().subscribe(res => {
      if (res && res.Status == UserAccessStatus.CaseNumberNeeded) {
        this.caseNumberNeededForUser = true;
        if (res.EnforcedResourceProviders && res.EnforcedResourceProviders.length>0) {
          this.caseNumberEnabledRPs = res.EnforcedResourceProviders.split(",").map(x => x.toLowerCase());
          this.hasResourceCaseNumberEnforced();
        }
        else {
          this.fetchCaseNumberEnforcedRpList();
        }
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
    this.queryParams = this._activatedRoute.snapshot.queryParams;
    this.isArmResourceRelatedError = this.selectedResourceType?.resourceType?.toLowerCase() === "armresourceid" && this.accessErrorMessage.toLowerCase().includes("resourcenotfound"); 
    this.fetchUserDetails();
    this.resourceTypes = [...this.defaultResourceTypes];
    if (!this.selectedResourceType) {
      this.selectedResourceType = this.defaultResourceTypes[0];
      this.hasResourceCaseNumberEnforced();
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
        this.hasResourceCaseNumberEnforced();
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
      { name: "Internal Stamp", imgSrc: "assets/img/Cloud-Service-Logo.svg" },
      { name: "APIM Service", imgSrc: "assets/img/Azure-ApiManagement-Logo.png"}];

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
        if (userInfo && userInfo.resources &&  userInfo.resources.length > 0) {
          this.table = this.generateDataTable(userInfo.resources);
          this.serviceTypePickerSelectedItems = [{
            key: `${ResourceDescriptor.parseResourceUri(userInfo.resources[0].resourceUri).provider}/${ResourceDescriptor.parseResourceUri(userInfo.resources[0].resourceUri).type}`,
            name: `${ResourceDescriptor.parseResourceUri(userInfo.resources[0].resourceUri).provider}/${ResourceDescriptor.parseResourceUri(userInfo.resources[0].resourceUri).type}`
          }];
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
    this.hasResourceCaseNumberEnforced();
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
      const noResourcePattern = /subscriptions\/(.*)\/providers\/(.*)/i;
      const noResourceMatchResult = resourceURI.match(noResourcePattern);
      if (noResourceMatchResult && noResourceMatchResult.length === 3) {
        let allowedResources: string = "";
        let routeString: string = '';
        if (enabledResourceTypes) {
          enabledResourceTypes.forEach(enabledResource => {
            allowedResources += `${enabledResource.resourceType}\n`;
            const resourcePattern = new RegExp(
              `^${enabledResource.resourceType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\/$`, 'i'
            );
            const enabledResourceResult = noResourceMatchResult[2].match(resourcePattern);

            if (enabledResourceResult) {
              routeString = `subscriptions/${noResourceMatchResult[1]}/providers/${enabledResource.resourceType}/`;
            }
          });
        }

        this.errorMessage = routeString === '' ?
          'The supplied ARM resource is not enabled in AppLens. Allowed resource types are as follows\n\n' +
          `${allowedResources}` :
          '';

        return routeString;
      }
      else {
        this.errorMessage = "Invalid ARM resource id. Resource id must be of the following format:\n" +
        `  /subscriptions/<sub id>/resourceGroups/<resource group>/providers/${this.selectedResourceType.resourceType}/` +
        "<resource name>";
        return resourceURI;
      }
    }
  }

  paramsToObject(entries) {
    const result = {}
    for(const [key, value] of entries) { // each 'entry' is a [key, value] tupple
      result[key] = value;
    }
    return result;
  }

  extractQueryParams(url) {
    try {
      const anchor = document.createElement('a');  
      anchor.href = url;  
      const queryParams = new URLSearchParams(anchor.search);
      return { url: anchor.pathname, queryParams: this.paramsToObject(queryParams)};
    }
    catch (err) {
      return { url: url, queryParams: {}};
    }
  }

  onSubmit() {
    if(!!this.errorMessage) {
      return;
    }
  
    this._userSettingService.updateDefaultServiceType(this.selectedResourceType.id);
    let resourceUri = '';
    if (!(this.caseNumber == "internal") && this.caseNumberNeededForUser && (this.selectedResourceType && this.caseNumberNeededForRP)) {
      this.caseNumber = this.caseNumber.trim();
      if (!this.validateCaseNumber()) {
        return;
      }
      this._diagnosticApiService.setCustomerCaseNumber(this.caseNumber);
    }


    if(this.isNoResource) {
      if(!Guid.isGuid(this.resourceName.trim())) {
        this.errorMessage = 'Invalid subscription id.';
        return;
      }
      this._userSettingService.updateDefaultServiceType(this.serviceTypePickerSelectedItems[0].name);
      resourceUri = `/subscriptions/${this.resourceName.trim()}/providers/${this.serviceTypePickerSelectedItems[0].name}/`;
    }
    else {
      this._userSettingService.updateDefaultServiceType(this.selectedResourceType.id);
      resourceUri = this.resourceName.trim();
    }    
    
    //If it is ARM resource id
    //if (this.defaultResourceTypes.findIndex(resource => this.selectedResourceType.displayName === resource.displayName) === -1) {
    if (this.selectedResourceType.displayName === "ARM Resource ID" || this.isNoResource) {
      resourceUri = this.normalizeArmUriForRoute(resourceUri, this.enabledResourceTypes);
    } else {
      this.errorMessage = "";
    }

    let route = !this.isNoResource? this.selectedResourceType.routeName(resourceUri) : resourceUri;

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${resourceUri}`;
    }

    this._detectorControlService.setCustomStartEnd(this._detectorControlService.startTimeString, this._detectorControlService.endTimeString);

    let timeParams = {
      startTime: this._detectorControlService.startTimeString,
      endTime: this._detectorControlService.endTimeString
    }

    let navigationExtras: NavigationExtras = {
      queryParams: {
        ...timeParams,
        ...!(this.caseNumber == "internal") && this.caseNumber ? { caseNumber: this.caseNumber } : {}
      }
    }

    if (this.targetPathBeforeError && this.targetPathBeforeError.length>0) {
      var extraction = this.extractQueryParams(this.targetPathBeforeError);
      route = extraction.url;
      //Case number should not be passed to the targeted path
      if (extraction.queryParams.hasOwnProperty('caseNumber')) {
        delete extraction.queryParams['caseNumber'];
      }
      
      navigationExtras.queryParams = {...navigationExtras.queryParams, ...extraction.queryParams};
    }

    if (this.errorMessage === '') {
      this._router.navigate([route], navigationExtras);
    }
  }

  onClickDeletedOrCreationFailedResourceBtn(isResourceDeletedOrFailedToCreateRecent: boolean) {
    if(isResourceDeletedOrFailedToCreateRecent) {
      this.isDeletedOrCreationFailedResource = true;
      this.accessErrorMessage = "";
    } else {
      this.isArmResourceRelatedError = false;
    }
  }

  onGetDeletedOrCreationFailedResource() {
    const { targetPathBeforeError } = this.queryParams;
    const dateStringFormat : string = TimeUtilities.fullStringFormat;
    const eventTime = this.deletedOrCreationFailedResourceEventTime.format(dateStringFormat);
    const { urlPath, queryParams } = this.extractUrlPathAndQueryParams(targetPathBeforeError);
    let navigationExtras: NavigationExtras = {
      queryParams: {
        ...queryParams
      }
    }
    const resourceDescriptor = ResourceDescriptor.parseResourceUri(this.queryParams.resourceId);
    const { provider: targetResourceProvider, type: targetResourceType } = resourceDescriptor || {}
    if (targetResourceProvider && targetResourceType) {
      this._diagnosticApiService.validateResourceExistenceInArmCluster(this.queryParams.resourceId, eventTime, targetResourceProvider, targetResourceType).subscribe(() => {
        this.resetValuesAndNavigateToResource(urlPath, navigationExtras);
      },
      (error) => {
        this.resetValuesAndNavigateToResource(urlPath, navigationExtras);
      });
    }
  }

  extractUrlPathAndQueryParams(urlString: string) : { urlPath: string, queryParams: any } {
    const [ urlPath, queryParamsString] = urlString.split('?');
    const params = new URLSearchParams(queryParamsString);
    
    const queryParams = Array.from(params.entries()).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});

    return {
      urlPath,
      queryParams
    }
  }

  updateMomentForDeletedOrCreationFailedResource(selectedMoment: moment.Moment) {
    this.deletedOrCreationFailedResourceEventTime = selectedMoment != null ? selectedMoment.clone() : null;
  }

  resetValuesAndNavigateToResource(urlPath: string, navigationExtras: any) {
    this.isArmResourceRelatedError = false;
    this.isDeletedOrCreationFailedResource = false;
    this.deletedOrCreationFailedResourceEventTime = null;

    this._router.navigate([urlPath], navigationExtras);
  }

  caseCleansingNavigate() {
    this._router.navigate(["caseCleansing"]);
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
      const name = !!descriptor.resource? descriptor.resource : `Subscription: ${descriptor.subscription}` ;
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
    if(this.isNoResource) {
      if(!Guid.isGuid(this.resourceName.trim())) {
        this.errorMessage = 'Invalid subscription id.';
      }
      else {
        if(this.errorMessage === 'Invalid subscription id.') {
          this.errorMessage = '';
        }
      }
    }
    this.hasResourceCaseNumberEnforced();
  }

  navigateToUnauthorized() {
    this._router.navigate(['unauthorized'], { queryParams: { isDurianEnabled: true } });
  }

  private checkTimeStringIsValid(timeString: string): boolean {
    if (timeString == null || timeString.length === 0) return false;
    const time: momentNs.Moment = moment.utc(timeString);
    return time.isValid();
  }

  updateCaseNumber(e: { event: Event, newValue?: string }) {
    this.caseNumber = e.newValue.toString();
  }

  toggleIsNoResource(checked: boolean) {
    this.isNoResource = checked;
    if(!this.isNoResource && this.errorMessage === 'Service type cannot be empty.') {
      this.errorMessage = '';
    }
    else {
      if(this.serviceTypePickerSelectedItems.length < 1 && this.table && this.table.length > 0) {
        this.serviceTypePickerSelectedItems = [{
          key: `${ResourceDescriptor.parseResourceUri(this.table[0].resourceUri).provider}/${ResourceDescriptor.parseResourceUri(this.table[0].resourceUri).type}`,
          name: `${ResourceDescriptor.parseResourceUri(this.table[0].resourceUri).provider}/${ResourceDescriptor.parseResourceUri(this.table[0].resourceUri).type}`
        }];
      }
    }
  }

  updateServiceTypePickerSelectedItems(event: any): boolean {
    this.serviceTypePickerSelectedItems = event.items;
    if(!this.serviceTypePickerSelectedItems || this.serviceTypePickerSelectedItems.length < 1 ) {
      this.errorMessage = 'Service type cannot be empty.';
    }
    else {
      if (this.errorMessage === 'Service type cannot be empty.') {
        this.errorMessage = '';
      }
    }
    return false;
  }

  public serviceTypePickerSuggestionsResolverClosure = (data:any):any => {
    const _this = this;
    return this.serviceTypePickerSuggestionsResolver(data, _this);
  }

  public serviceTypePickerSuggestionsResolver(data: any, _this:this): ITagItemProps[] | Promise<ITagItemProps[]>  {
      let tagIndex = 0;
      data = data.toString().toLowerCase();
      return _this.enabledResourceTypes.filter(enabledResourceType=> 
        enabledResourceType.resourceType.toLowerCase().indexOf(data) > -1 
        || enabledResourceType.displayName?.toLowerCase().indexOf(data) > -1 
        || enabledResourceType.searchSuffix?.toLowerCase().indexOf(data) > -1
        || enabledResourceType.service?.toLowerCase().indexOf(data) > -1 )
      .map<ITagItemProps>((enabledResourceType: ResourceServiceInputs) => <ITagItemProps>{
        index: tagIndex++,
        item: {
          key:enabledResourceType.resourceType.trim(),
          name: enabledResourceType.resourceType.trim()
        }
      });
  }

}

interface RecentResourceDisplay extends RecentResource {
  name: string;
  imgSrc: string;
  type: string;
}


