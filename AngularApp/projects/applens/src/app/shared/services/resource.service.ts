
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
  public sapProductId:string;
  public staticSelfHelpContent: string;
  public altIcons: { [path: string]: string };
  public displayName: string;
  public searchSuffix: string;
  public emergingIssuesICMLookupEnabled: boolean;
  public overviewPageMetricsId: string;
  public workflowsEnabled: boolean;
  public service:string;

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
    this.sapProductId = inputs.sapProductId;
    this.staticSelfHelpContent = inputs.staticSelfHelpContent;
    this.altIcons = inputs.altIcons;
    this.displayName = inputs.displayName;
    this.searchSuffix = inputs.searchSuffix;
    this.emergingIssuesICMLookupEnabled = (inputs.emergingIssuesICMLookupEnabled !== undefined && inputs.emergingIssuesICMLookupEnabled);
    this.overviewPageMetricsId = inputs.overviewPageMetricsId;
    this.workflowsEnabled = inputs.workflowsEnabled;
    this.service = inputs.service;
  }

  public startInitializationObservable() {
    this._initialized = observableOf(new ResourceInfo(this.getResourceName(),this.imgSrc,this.displayName,this.getCurrentResourceId()));
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

  public getSapProductId(): Observable<string>{
    if (this.sapProductId){
      return Observable.of(this.sapProductId);
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

  public getAdditionalResourceInfo(resourceProps): Observable<any>{
    return observableOf({});
  }

  public getResourceByObserver(): any {
    return this._observerResource;
  }
}
