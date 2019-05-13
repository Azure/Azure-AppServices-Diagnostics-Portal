import { BehaviorSubject, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';

@Injectable()
export class AseService extends ResourceService {

  private _currentResource: BehaviorSubject<Observer.ObserverAseInfo> = new BehaviorSubject(null);

  private _hostingEnvironmentResource: Observer.ObserverAseInfo;

  constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
    super(inputs);
  }

  public startInitializationObservable() {
    this._initialized = this._observerApiService.getAse(this._armResource.resourceName).pipe(
      mergeMap((observerResponse: Observer.ObserverAseResponse) => {
        this._hostingEnvironmentResource = observerResponse.details;
        this._currentResource.next(observerResponse.details);
        return this._observerApiService.getAseRequestBody(this._hostingEnvironmentResource.Name);
      }),map((requestBody: any) => {
        this._requestBody = requestBody.details;
        return true;
      }),);
  }

  public getCurrentResource(): Observable<Observer.ObserverAseInfo> {
    return this._currentResource;
  }

}
