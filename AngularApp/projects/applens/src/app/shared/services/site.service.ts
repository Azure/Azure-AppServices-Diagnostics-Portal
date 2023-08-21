import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Inject, Injectable } from '@angular/core';
import { RESOURCE_SERVICE_INPUTS, ResourceServiceInputs, ResourceInfo } from '../models/resources';
import { ObserverService } from './observer.service';
import { ResourceService } from './resource.service';
import { HttpResponse } from '@angular/common/http';
import { SkuUtilities } from '../utilities/sku-utilities';
import { ObserverSiteInfo, ObserverSiteResponse, ObserverSiteSku } from '../models/observer';

@Injectable()
export class SiteService extends ResourceService {

    private _currentResource: BehaviorSubject<ObserverSiteInfo> = new BehaviorSubject(null);

    private _siteObject: ObserverSiteInfo;

    constructor(@Inject(RESOURCE_SERVICE_INPUTS) inputs: ResourceServiceInputs, protected _observerApiService: ObserverService) {
        super(inputs);
    }

    public startInitializationObservable() {
        if(!!this._armResource.resourceName) {
            this._initialized = this._observerApiService.getSite(this._armResource.resourceName)
            .pipe(
                map((observerResponse: ObserverSiteResponse) => {
                    const siteObject = this.getSiteFromObserverResponse(observerResponse);
                    return siteObject;
                }), mergeMap(site => {
                    return this._observerApiService.getSiteSku(site.InternalStampName, site.SiteName).pipe(
                        map((siteSku: any) => {
                            if(siteSku == "Resource Not Found. API : GetSiteSku") {
                                site.AppServicePlan = "";
                            } else {
                                site.AppServicePlan = this.getSiteASPAndSKu(siteSku);
                            }
                            return site;
                        }), catchError(_ => of(site)));
                }), map(site => {
                    this._observerResource = this._siteObject = site;
                    this._currentResource.next(this._siteObject);
                    this.updatePesIdAndImgSrc();

                    return new ResourceInfo(this.getResourceName(), this.imgSrc, this.displayName, this.getCurrentResourceId(), this._siteObject.Kind);
                }));
        }
        else {
            this._currentResource.next(null);
            this.updatePesIdAndImgSrc();
            this._initialized = of(new ResourceInfo(this.getResourceName(), this.imgSrc, this.displayName, this.getCurrentResourceId()));
        }
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

    private getSiteFromObserverResponse(observerResponse: ObserverSiteResponse): ObserverSiteInfo {
        return observerResponse.details.find(site =>
            site.Subscription.toLowerCase() === this._armResource.subscriptionId.toLowerCase() &&
            site.ResourceGroupName.toLowerCase() === this._armResource.resourceGroup.toLowerCase())
    }

    public updatePesIdAndImgSrc() {
        if (this._siteObject && this._siteObject.Kind && this._siteObject.Kind.toString().toLowerCase().indexOf("workflowapp") !== -1) {
            this.pesId = '17378';
            this.imgSrc = 'assets/img/Azure-LogicAppsPreview-Logo.svg';
            this.staticSelfHelpContent = 'microsoft.logicapps';
            this.displayName = "Logic App (Standard)";
            this.templateFileName = "WorkflowApp";
        }
        else if (this._siteObject && this._siteObject.Kind && this._siteObject.Kind.toString().toLowerCase().indexOf("functionapp") !== -1) {
            this.pesId = '16072';
            this.imgSrc = 'assets/img/Azure-Functions-Logo.png';
            this.staticSelfHelpContent = 'microsoft.function';
            this.displayName = "Function App";
            this.templateFileName = "FunctionApp";
        }
        else if (this._siteObject && this._siteObject.IsLinux != undefined && this._siteObject.IsLinux) {
            this.pesId = '16170';
            this.imgSrc = 'assets/img/Azure-Tux-Logo.png';
            this.displayName = "Linux Web App";
            this.templateFileName = "LinuxApp";
        } else {
            this.pesId = '14748';
            this.imgSrc = 'assets/img/Azure-WebApps-Logo.png';
            this.displayName = "Windows Web App";
            this.templateFileName = "WebApp";
        }
    }

    private getSiteASPAndSKu(siteSku: ObserverSiteSku): string {
        const priceTire = SkuUtilities.getPriceTireBySkuAndSize(siteSku.sku.toString(), siteSku.current_worker_size);
        const numberOfWorkers = siteSku.actual_number_of_workers;
        const aspName = siteSku.server_farm_name;
        return `${aspName} (${priceTire}: ${numberOfWorkers})`;
    }
}
