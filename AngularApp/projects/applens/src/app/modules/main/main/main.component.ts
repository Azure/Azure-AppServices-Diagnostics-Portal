import * as momentNs from 'moment';
import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import {
  ResourceServiceInputs, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { HttpClient } from '@angular/common/http';
import { IDropdownOption, IDropdownProps, PanelType } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { DataTableResponseObject, DetectorControlService, GenericThemeService, HealthStatus } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../../dashboard/services/user-setting.service';
import { RecentResource } from '../../../shared/models/user-setting';
import { ResourceDescriptor } from 'diagnostic-data'
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
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

  defaultResourceTypes: ResourceTypeState[] = [
    {
      resourceType: null,
      resourceTypeLabel: 'App name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App Service',
      enabled: true,
      caseId: false,
      id: 'App Service'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'ASE name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false,
      id: 'App Service Environment'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `containerapps/${name}`,
      displayName: 'Container App',
      enabled: true,
      caseId: false,
      id: 'Container App'
    }, {
      resourceType: null,
      resourceTypeLabel: 'Static App Name Or Default Host Name',
      routeName: (name) => `staticwebapps/${name}`,
      displayName: 'Static Web App',
      enabled: true,
      caseId: false,
      id: 'Static Web App'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Virtual machine Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Virtual Machine',
      enabled: true,
      caseId: false,
      id: 'Virtual Machine'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'ARM Resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM Resource ID',
      enabled: true,
      caseId: false,
      id: 'ARM Resource ID'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Stamp name',
      routeName: (name) => `stampfinder/${name}`,
      displayName: 'Internal Stamp',
      enabled: true,
      caseId: false,
      id: 'Internal Stamp'
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

  constructor(private _router: Router, private _http: HttpClient, private _detectorControlService: DetectorControlService, private _adalService: AdalService, private _userSettingService: UserSettingService, private _themeService: GenericThemeService) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }
  }

  ngOnInit() {
    this.resourceTypes = [...this.defaultResourceTypes];
    this.selectedResourceType = this.defaultResourceTypes[0];

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

      if (userInfo && userInfo.defaultServiceType && this.defaultResourceTypes.find(type => type.id.toLowerCase() === userInfo.defaultServiceType.toLowerCase())) {
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
      this._detectorControlService.timeRangeErrorString
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
    this._userSettingService.updateDefaultServiceType(type.id);
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
      queryParams: timeParams
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
        resourceUri: recentResource.resourceUri
      }
      if (type === "microsoft.web/sites") {
        this.updateDisplayWithKind(recentResource.kind, display);
      }
      return display;
    });
    return rows;
  }

  private handleStampForRecentResource(recentResource: RecentResource) {
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
    return {
      name: stampName,
      imgSrc: resourceType ? resourceType.imgSrc : "",
      type: resourceType ? resourceType.displayName : "",
      kind: recentResource.kind,
      resourceUri: recentResource.resourceUri.replace("infrastructure/stamps", "stamps")
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

  //Todo, once get startTime,endTime from database,replace with those get from detectorControlService
  private onNavigateRecentResource(recentResource: RecentResourceDisplay) {
    let startUtc = this._detectorControlService.startTime;
    let endUtc = this._detectorControlService.endTime;

    let timeParams = {
      startTime: startUtc ? startUtc.format('YYYY-MM-DDTHH:mm') : "",
      endTime: endUtc ? endUtc.format('YYYY-MM-DDTHH:mm') : ""
    }

    let navigationExtras: NavigationExtras = {
      queryParams: timeParams
    }
    const route = recentResource.resourceUri
    this._router.navigate([route], navigationExtras);
  }

  clickRecentResourceHandler(event: Event, recentResource: RecentResourceDisplay) {
    event.stopPropagation();
    this.onNavigateRecentResource(recentResource);
  }

  updateResourceName(e: { event: Event, newValue?: string }) {
    this.resourceName = e.newValue.toString();
  }

}

interface RecentResourceDisplay extends RecentResource {
  name: string;
  imgSrc: string;
  type: string;
}


