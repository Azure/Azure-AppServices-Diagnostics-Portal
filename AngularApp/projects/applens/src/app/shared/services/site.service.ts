import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs, ResourceInfo } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class SiteService extends ResourceService {

  private _currentResource: BehaviorSubject<Observer.ObserverSiteInfo> = new BehaviorSubject(null);

  private _siteObject: Observer.ObserverSiteInfo;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService.getSite(this._armResource.resourceName)
      .pipe(map((observerResponse: Observer.ObserverSiteResponse) => {
        this._observerResource = this._siteObject = this.getSiteFromObserverResponse(observerResponse);
        this._currentResource.next(this._siteObject);
        this.updatePesIdAndImgSrc();
        return new ResourceInfo(this.getResourceName(),this.imgSrc,this.searchSuffix,this.getCurrentResourceId(),this._siteObject.Kind);
      }))
  }

    public getCurrentResource(): Observable<any> {
        return this._currentResource;
    }

    public restartSiteFromUri(resourceUri: string): Observable<HttpResponse<any>> {
        return null;
    }

    public updateSettingsFromUri(resourceUri: string, body: any): Observable<any> {
        return null;
    }

    private getSiteFromObserverResponse(observerResponse: Observer.ObserverSiteResponse): Observer.ObserverSiteInfo {
        return observerResponse.details.find(site =>
            site.Subscription.toLowerCase() === this._armResource.subscriptionId.toLowerCase() &&
            site.ResourceGroupName.toLowerCase() === this._armResource.resourceGroup.toLowerCase())
    }

    public updatePesIdAndImgSrc() {
        if (this._siteObject.Kind && this._siteObject.Kind.toString().toLowerCase().indexOf("workflowapp") !== -1) {
            this.pesId = '17378';
            this.imgSrc = 'assets/img/Azure-LogicAppsPreview-Logo.svg';
            this.staticSelfHelpContent = 'microsoft.logicapps';
            this.searchSuffix = "AZURE Logic APP";
            this.templateFileName = "WorkflowApp";
        }
        else if (this._siteObject.Kind && this._siteObject.Kind.toString().toLowerCase().indexOf("functionapp") !== -1) {
            this.pesId = '16072';
            this.imgSrc = 'assets/img/Azure-Functions-Logo.png';
            this.staticSelfHelpContent = 'microsoft.function';
            this.searchSuffix = "AZURE FUNCTION APP";
            this.templateFileName = "FunctionApp";
        }
        else if (this._siteObject.IsLinux != undefined && this._siteObject.IsLinux) {
            this.pesId = '16170';
            this.imgSrc = 'assets/img/Azure-Tux-Logo.png';
            this.searchSuffix = "AZURE LINUX WEB APP";
            this.templateFileName = "LinuxApp";
        }
    }
}
