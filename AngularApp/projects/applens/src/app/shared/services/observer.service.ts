import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DiagnosticApiService } from './diagnostic-api.service';
import { isArray } from 'util';

@Injectable()
export class ObserverService {

  constructor(private _diagnosticApiService: DiagnosticApiService) { }

  // WARNING: This is broken logic because of bug in sites API
  //          Hostnames will be incorrect if there is another
  //          app with the same name. Pending fix from Hawk
  public getSite(site: string): Observable<Observer.ObserverSiteResponse> {
    return this._diagnosticApiService.get<Observer.ObserverSiteResponse>(`api/sites/${site}`).pipe(
      map((siteRes: Observer.ObserverSiteResponse) => {
        if (siteRes && siteRes.details && isArray(siteRes.details)) {
          siteRes.details.map(info => this.getSiteInfoWithSlot(info));
        }

        return siteRes;
      }));
  }

  public getSiteSku(stamp: string, site: string): Observable<Observer.ObserverSiteSku> {
    return this._diagnosticApiService.get<{ details: Observer.ObserverSiteSku }>(`api/stamps/${stamp}/sites/${site}/sku`).pipe(map(res => res.details));
  }

  public getContainerApp(containerAppName: string): Observable<Observer.ObserverContainerAppResponse> {
    return this._diagnosticApiService.get<Observer.ObserverContainerAppResponse>(`api/containerapps/${containerAppName}`).pipe(
      map((containerAppRes: Observer.ObserverContainerAppResponse) => {
        if (containerAppRes && containerAppRes.details && isArray(containerAppRes.details)) {
          containerAppRes.details.map(info => info);
        }

        return containerAppRes;
      }));
  }

  public getStaticWebApp(defaultHostNameOrAppName: string): Observable<Observer.ObserverStaticWebAppResponse> {
    return this._diagnosticApiService.get<Observer.ObserverStaticWebAppResponse>(`api/staticwebapps/${defaultHostNameOrAppName}`).pipe(
      map((staticWebAppRes: Observer.ObserverStaticWebAppResponse) => {
        if (staticWebAppRes && staticWebAppRes.details && isArray(staticWebAppRes.details)) {
          staticWebAppRes.details.map(info => info);
        }
        return staticWebAppRes;
      }));
  }

  public getAse(ase: string): Observable<Observer.ObserverAseResponse> {
    return this._diagnosticApiService.get<Observer.ObserverAseResponse>(`api/hostingEnvironments/${ase}`);
  }

  public getSiteRequestBody(site: string, stamp: string) {
    return this._diagnosticApiService.get<Observer.ObserverSiteResponse>(`api/stamps/${stamp}/sites/${site}/postBody`);
  }

  public getSiteRequestDetails(site: string, stamp: string) {
    return this._diagnosticApiService.get<Observer.ObserverSiteDetailsResponse>(`api/stamps/${stamp}/sites/${site}/details`);
  }

  public getAseRequestBody(name: string) {
    return this._diagnosticApiService.get<Observer.ObserverSiteResponse>(`api/hostingEnvironments/${name}/postBody`);
  }

  public getStamp(stampName: string): Observable<Observer.ObserverStampResponse> {
    return this._diagnosticApiService.get<Observer.ObserverStampResponse>(`api/stamps/${stampName}`);
  }

  private getSiteInfoWithSlot(site: Observer.ObserverSiteInfo): Observer.ObserverSiteInfo {
    const siteName = site.SiteName;
    let slot = '';

    if (siteName.indexOf('(') > 0) {
      const split = site.SiteName.split('(');
      slot = split[1].replace(')', '');
    }

    site.SlotName = slot;
    return site;
  }

}
