import { Inject, Injectable } from "@angular/core";
import { of as observableOf, BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { ResourceInfo, ResourceServiceInputs, RESOURCE_SERVICE_INPUTS } from "../models/resources";
import { ObserverService } from "./observer.service";
import { ResourceService } from "./resource.service";

@Injectable()
export class StaticWebAppService extends ResourceService {
    private _currentResource: BehaviorSubject<any> = new BehaviorSubject(null);

    private _staticWebAppObject: Observer.ObserverStaticWebAppInfo;


    constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
        super(inputs);
    }

    public startInitializationObservable() {
        //To do, change API tp get by app name
        this._initialized = this._observerApiService.getStaticWebApp("")
            .pipe(map((observerResponse: Observer.ObserverStaticWebAppResponse) => {
                this._observerResource = this._staticWebAppObject = this.getStaticWebAppFromObserverResponse(observerResponse);
                this._currentResource.next(this._staticWebAppObject);
                return new ResourceInfo(this.getResourceName(), this.imgSrc, this.displayName, this.getCurrentResourceId());
            }))
    }

    public getCurrentResource(): Observable<any> {
        return this._currentResource.pipe(map(currentResource => {
            const resource = { ...currentResource };
            //BuildInfo is an array of inputs, hide it for now
            delete resource["BuildInfo"];
            return resource;
        }));
    }

    // private getHostName(): string {
    //     //Get hostName from route param(/staticWebApp/:staticWebApp) or from query string
    //     let hostName = "";
    //     let queryParams = new URLSearchParams(window.location.search);
    //     if (this._activatedRoute.firstChild && this._activatedRoute.firstChild.firstChild && this._activatedRoute.firstChild.firstChild.firstChild) {
    //         const route = this._activatedRoute.firstChild.firstChild.firstChild;
    //         hostName = route.snapshot.params["staticwebapp"];
    //     } else if (queryParams.has("defaultHostName")) {
    //         hostName = queryParams.get("defaultHostName");
    //     }
    //     return hostName;
    // }

    private getStaticWebAppFromObserverResponse(observerResponse: Observer.ObserverStaticWebAppResponse): Observer.ObserverStaticWebAppInfo {
        const response = observerResponse.details.find(staticWebApp =>
            staticWebApp.SubscriptionName.toLowerCase() === this._armResource.subscriptionId.toLowerCase() &&
            staticWebApp.ResourceGroupName.toLowerCase() === this._armResource.resourceGroup.toLowerCase());
        return response;
    }
}