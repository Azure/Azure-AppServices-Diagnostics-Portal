import { Inject, Injectable } from "@angular/core";
import { of as observableOf, BehaviorSubject, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
import { ObserverStaticWebAppInfo, ObserverStaticWebAppResponse } from "../models/observer";
import { ResourceInfo, ResourceServiceInputs, RESOURCE_SERVICE_INPUTS } from "../models/resources";
import { ObserverService } from "./observer.service";
import { ResourceService } from "./resource.service";

@Injectable()
export class StaticWebAppService extends ResourceService {
    private _currentResource: BehaviorSubject<any> = new BehaviorSubject(null);

    private _staticWebAppObject: ObserverStaticWebAppInfo;


    constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
        super(inputs);
    }

    public startInitializationObservable() {
        if(!!this._armResource.resourceName) {
            this._initialized = this._observerApiService.getStaticWebApp(this._armResource.resourceName)
            .pipe(map((observerResponse: ObserverStaticWebAppResponse) => {
                this._observerResource = this._staticWebAppObject = this.getStaticWebAppFromObserverResponse(observerResponse);
                this._currentResource.next(this._staticWebAppObject);
                return new ResourceInfo(this.getResourceName(), this.imgSrc, this.displayName, this.getCurrentResourceId());
            }));
        }
        else {
            this._currentResource.next(null);
            return of(new ResourceInfo(this.getResourceName(), this.imgSrc, this.displayName, this.getCurrentResourceId()));
        }
    }

    public getCurrentResource(): Observable<any> {
        return this._currentResource.pipe(map(currentResource => {
            const resource = { ...currentResource };
            //BuildInfo is an array of inputs, hide it for now
            delete resource["BuildInfo"];
            return resource;
        }));
    }

    private getStaticWebAppFromObserverResponse(observerResponse: ObserverStaticWebAppResponse): ObserverStaticWebAppInfo {
        const response = observerResponse.details.find(staticWebApp =>
            staticWebApp.SubscriptionName.toLowerCase() === this._armResource.subscriptionId.toLowerCase() &&
            staticWebApp.ResourceGroupName.toLowerCase() === this._armResource.resourceGroup.toLowerCase());
        return response;
    }
}