import { AdalService } from 'adal-angular4';
import * as momentNs from 'moment';
import { map, catchError } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import {
    ResourceServiceInputs, ResourceType, ResourceTypeState, ResourceServiceInputsJsonResponse
} from '../../../shared/models/resources';
import { trimTrailingNulls } from '@angular/compiler/src/render3/view/util';
import { HttpClient } from '@angular/common/http';
import { FabDialogModule, FabButtonModule } from '@angular-react/fabric';
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
      resourceTypeLabel: 'App Name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App',
      enabled: true,
      caseId: false
    },
    {
      resourceType: ResourceType.AppServiceEnvironment,
      resourceTypeLabel: 'ASE Name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'ARM Resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM Resource ID',      
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Session Id',
      routeName: (name) =>  this.getFakeArmResource('Microsoft.AzurePortal', 'sessions', name),
      displayName: 'Azure Portal Session',
      enabled: true,
      caseId: false
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Virtual Machine Id',
      routeName: (name) => this.getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Azure Virutal Machine',
      enabled: true,
      caseId: false
    },
    {
      resourceType: ResourceType.ContainerApp,
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `containerapps/${name}`,
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

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _adalService: AdalService,) {
    this.endTime = moment.utc();
    this.startTime = this.endTime.clone().add(-1, 'days');
    this.inIFrame = window.parent !== window;

    if (this.inIFrame) {
      this.resourceTypes = this.resourceTypes.filter(resourceType => !resourceType.caseId);
    }

    // TODO: Use this to restrict access to routes that don't match a supported resource type
    this._http.get<ResourceServiceInputsJsonResponse>('assets/enabledResourceTypes.json').subscribe(jsonResponse =>{
      this.enabledResourceTypes = <ResourceServiceInputs[]>jsonResponse.enabledResourceTypes;
    });
  }

  ngOnInit() {
    this.selectedResourceType = this.resourceTypes[0];
  }

  selectResourceType(type: ResourceTypeState) {
    if (type.enabled) {
      this.selectedResourceType = type;
      this.showResourceTypeOptions = false;
    }
  }

  private normalizeArmUriForRoute(resourceURI: string, enabledResourceTypes : ResourceServiceInputs[]) : string {
    resourceURI = resourceURI.trim();
    var resourceUriPattern = /subscriptions\/(.*)\/resourceGroups\/(.*)\/providers\/(.*)/i;
    var result = resourceURI.match(resourceUriPattern);

    if (result && result.length === 4) {
      var allowedResources : string = "";
      var routeString : string = '';

      if (enabledResourceTypes) {
        enabledResourceTypes.forEach(enabledResource => {
          allowedResources+= `${enabledResource.resourceType}\n`;
          var resourcePattern = new RegExp(
              `(?<=${enabledResource.resourceType.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\/).*`, 'i'
          );
          var enabledResourceResult = result[3].match(resourcePattern);

          if(enabledResourceResult){
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

  onSubmit(form: any) {
    form.resourceName = form.resourceName.trim();

    if (this.selectedResourceType.displayName === "ARM Resource ID") {
      form.resourceName = this.normalizeArmUriForRoute(form.resourceName, this.enabledResourceTypes);
    } else {
      this.errorMessage = "";
    }

    let route = this.selectedResourceType.routeName(form.resourceName);

    if (route === 'srid') {
      window.location.href = `https://azuresupportcenter.msftcloudes.com/caseoverview?srId=${form.resourceName}`;
    }

    let startUtc = moment.utc(form.startTime.format('YYYY-MM-DD HH:mm'));
    let endUtc = moment.utc(form.endTime.format('YYYY-MM-DD HH:mm'));

    let timeParams = {
      startTime: startUtc.format('YYYY-MM-DDTHH:mm'),
      endTime: endUtc.format('YYYY-MM-DDTHH:mm')
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

}
