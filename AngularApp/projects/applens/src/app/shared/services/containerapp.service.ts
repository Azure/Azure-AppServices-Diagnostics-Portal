import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import {
  RESOURCE_SERVICE_INPUTS,
  ResourceInfo,
  ResourceServiceInputs
} from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';
import {
  ObserverContainerAppInfo,
  ObserverContainerAppResponse
} from '../models/observer';

@Injectable()
export class ContainerAppService extends ResourceService {
  private _currentResource: BehaviorSubject<ObserverContainerAppInfo> =
    new BehaviorSubject(null);

  private _containerAppObject: ObserverContainerAppInfo;

  constructor(
    @Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs,
    protected _observerApiService: ObserverService
  ) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService
      .getContainerApp(this._armResource.resourceName)
      .pipe(
        map((observerResponse: ObserverContainerAppResponse) => {
          this._observerResource = this._containerAppObject =
            this.getContainerAppFromObserverResponse(observerResponse);
          this._currentResource.next(this._containerAppObject);
          return new ResourceInfo(
            this.getResourceName(),
            this.imgSrc,
            this.displayName,
            this.getCurrentResourceId()
          );
        })
      );
  }

  public getCurrentResource(): Observable<any> {
    return this._currentResource;
  }

  private getContainerAppFromObserverResponse(
    observerResponse: ObserverContainerAppResponse
  ): ObserverContainerAppInfo {
    return observerResponse.details.find(
      (containerapp) =>
        containerapp.SubscriptionName.toLowerCase() ===
          this._armResource.subscriptionId.toLowerCase() &&
        containerapp.ResourceGroupName.toLowerCase() ===
          this._armResource.resourceGroup.toLowerCase()
    );
  }
}
