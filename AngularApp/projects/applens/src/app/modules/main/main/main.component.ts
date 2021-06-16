import * as momentNs from 'moment';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
  ResourceServiceInputs, ResourceType, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { HttpClient } from '@angular/common/http';
import { IDropdownOption } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { DetectorControlService, HealthStatus } from 'diagnostic-data';
import { AdalService } from 'adal-angular4';
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
  resourceTypes: ResourceTypeState[] = [
    {
      resourceType: ResourceType.Site,
      resourceTypeLabel: 'App name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App',
      enabled: true,
      caseId: false
    },
    {
      resourceType: ResourceType.AppServiceEnvironment,
      resourceTypeLabel: 'ASE name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App service environment',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'ARM resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM resource ID',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Session Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.AzurePortal', 'sessions', name),
      displayName: 'Azure portal session',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Virtual machine Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Azure virtual machine',
      enabled: true,
      caseId: false
    },
    {
      resourceType: ResourceType.WorkerApp,
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `workerapps/${name}`,
      displayName: 'Azure Container App',
      enabled: true,
      caseId: false
    }
  ];

  startTime: momentNs.Moment;
  endTime: momentNs.Moment;
  enabledResourceTypes: ResourceServiceInputs[];
  inIFrame = false;
  errorMessage = "";
  status = HealthStatus.Critical;

  fabDropdownOptions: IDropdownOption[] = [];
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  timePickerStr: string = "";
  get disableSubmitButton(): boolean {
    return !this.resourceName || this.resourceName.length === 0;
  }
  troubleShootIcon:string = "../../../../assets/img/applens-skeleton/main/troubleshoot.svg";
  userGivenName:string = "";

  constructor(private _router: Router, private _http: HttpClient, private _detectorControlService: DetectorControlService,private _adalService:AdalService) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    // TODO: Use this to restrict access to routes that don't match a supported resource type
    this._http.get<ResourceServiceInputsJsonResponse>('assets/enabledResourceTypes.json').subscribe(jsonResponse => {
      this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
    });
  }

  ngOnInit() {
    this.selectedResourceType = this.resourceTypes[0];
    this.resourceTypes.forEach(resource => {
      const displayName = resource.displayName;
      this.fabDropdownOptions.push({
        key: displayName,
        text: displayName,
        ariaLabel: displayName
      });
    });

    this._detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerStr = s;
      this._detectorControlService.timeRangeErrorString
    });

    this.userGivenName = this._adalService.userInfo.profile.given_name;

  }

  selectResourceType(type: ResourceTypeState) {
    if (type.enabled) {
      this.selectedResourceType = type;
      this.showResourceTypeOptions = false;
    }
  }

  selectDropdownKey(e: { option: IDropdownOption, index: number }) {
    this.selectResourceType(this.resourceTypes[e.index]);
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
        "  /subscriptions/SUBSCRIPTION_ID/resourceGroups/MY_RG/providers/Microsoft.ContainerService/" +
        "managedClusters/RESOURCE_NAME";

      return resourceURI;
    }
  }

  onSubmit() {
    this.resourceName = this.resourceName.trim();

    //If it is ARM resource id
    if (this.selectedResourceType === this.resourceTypes[2]) {
      this.resourceName = this.normalizeArmUriForRoute(this.resourceName, this.enabledResourceTypes);
    } else {
      this.errorMessage = "";
    }

    let route = this.selectedResourceType.routeName(this.resourceName);

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${this.resourceName}`;
    }

    let startUtc = this._detectorControlService.startTime;
    let endUtc = this._detectorControlService.endTime;

    let timeParams = {
      startTime: startUtc ? startUtc.format('YYYY-MM-DDTHH:mm') : "",
      endTime: endUtc ? endUtc.format('YYYY-MM-DDTHH:mm') : ""
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
}
