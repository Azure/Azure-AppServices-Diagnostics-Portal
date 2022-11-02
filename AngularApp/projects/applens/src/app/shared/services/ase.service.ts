import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs, ResourceInfo } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { ObserverAseInfo, ObserverAseResponse } from '../models/observer';

@Injectable()
export class AseService extends ResourceService {

  private _currentResource: BehaviorSubject<ObserverAseInfo> = new BehaviorSubject(null);

  private _hostingEnvironmentResource: ObserverAseInfo;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService.getAse(this._armResource.resourceName)
      .pipe(
        map((observerResponse: ObserverAseResponse) => {
        this._hostingEnvironmentResource = observerResponse.details;
        this._currentResource.next(observerResponse.details);
        return new ResourceInfo(this.getResourceName(),this.imgSrc,this.displayName,this.getCurrentResourceId());
      }));
  }

  public getCurrentResource(): Observable<ObserverAseInfo> {
    return this._currentResource;
  }

}
