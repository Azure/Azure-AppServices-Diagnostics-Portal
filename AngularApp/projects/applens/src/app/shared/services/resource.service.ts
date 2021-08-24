
import {of as observableOf,  Observable } from 'rxjs';
import { Injectable, Inject, Optional } from '@angular/core';
import { ArmResource, ResourceInfo, ResourceServiceInputs, RESOURCE_SERVICE_INPUTS } from '../models/resources';

@Injectable()
export class ResourceService {

  public imgSrc: string;
  public versionPrefix: string;
  public templateFileName: string;
  public azureCommImpactedServicesList: string;
  public pesId: string;
  public staticSelfHelpContent: string;
  public altIcons: { [path: string]: string };
  public searchSuffix: string;
  public emergingIssuesICMLookupEnabled: boolean;

  protected _observerResource: any = null;
  protected _armResource: ArmResource;
  protected _initialized: Observable<ResourceInfo>;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs) {
    this._armResource = inputs.armResource;
    this.templateFileName = inputs.templateFileName;
    this.imgSrc = inputs.imgSrc;
    this.versionPrefix = inputs.versionPrefix;
    this.azureCommImpactedServicesList = inputs.azureCommImpactedServicesList;
    this.pesId = inputs.pesId;
    this.staticSelfHelpContent = inputs.staticSelfHelpContent;
    this.altIcons = inputs.altIcons;
    this.searchSuffix = inputs.searchSuffix;
    this.emergingIssuesICMLookupEnabled = (inputs.emergingIssuesICMLookupEnabled !== undefined && inputs.emergingIssuesICMLookupEnabled);
  }

  public startInitializationObservable() {
    this._initialized = observableOf(new ResourceInfo(this.getResourceName(),this.imgSrc,this.searchSuffix,this.getCurrentResourceId()));
  }

  public waitForInitialization(): Observable<ResourceInfo> {
    return this._initialized;
  }

  public get ArmResource(): ArmResource {
    return this._armResource;
  }

  public getPesId(): Observable<string>{
    if (this.pesId){
      return Observable.of(this.pesId);
    }
    return Observable.of(null);
  }

  public getResourceName(): string {
    return this._armResource.resourceName;
  }

  public getCurrentResourceId(forDiagApi?: boolean): string {
    return `subscriptions/${this._armResource.subscriptionId}/resourceGroups/${this._armResource.resourceGroup}/providers/${this._armResource.provider}/${this._armResource.resourceTypeName}/${this._armResource.resourceName}`;
  }

  public getCurrentResource(): Observable<any> {
    return observableOf(this._armResource);
  }

  public getResourceByObserver(): any {
    return this._observerResource;
  }
}
