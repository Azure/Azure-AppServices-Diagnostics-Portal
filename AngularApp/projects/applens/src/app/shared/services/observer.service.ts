import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DiagnosticApiService } from './diagnostic-api.service';
import { ObserverAseResponse, ObserverContainerAppResponse, ObserverSiteDetailsResponse, ObserverSiteInfo, ObserverSiteResponse, ObserverSiteSku, ObserverStampResponse, ObserverStaticWebAppResponse } from '../models/observer';

@Injectable()
export class ObserverService {

  constructor(private _diagnosticApiService: DiagnosticApiService) { }

  public getSite(site: string): Observable<ObserverSiteResponse> {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/sites/${site}`).pipe(
      map((siteRes: ObserverSiteResponse) => {
        if (siteRes && siteRes.details && Array.isArray(siteRes.details)) {
          siteRes.details.map(info => this.getSiteInfoWithSlot(info));
        }

        return siteRes;
      }));
  }

  public getSiteSku(stamp: string, site: string): Observable<ObserverSiteSku> {
    return this._diagnosticApiService.get<{ details: ObserverSiteSku }>(`api/stamps/${stamp}/sites/${site}/sku`).pipe(map(res => res.details));
  }

  public getContainerApp(containerAppName: string): Observable<ObserverContainerAppResponse> {
    return this._diagnosticApiService.get<ObserverContainerAppResponse>(`api/containerapps/${containerAppName}`).pipe(
      map((containerAppRes: ObserverContainerAppResponse) => {
        if (containerAppRes && containerAppRes.details && Array.isArray(containerAppRes.details)) {
          containerAppRes.details.map(info => info);
        }

        return containerAppRes;
      }));
  }

  public getStaticWebApp(defaultHostNameOrAppName: string): Observable<ObserverStaticWebAppResponse> {
    return this._diagnosticApiService.get<ObserverStaticWebAppResponse>(`api/staticwebapps/${defaultHostNameOrAppName}`).pipe(
      map((staticWebAppRes: ObserverStaticWebAppResponse) => {
        if (staticWebAppRes && staticWebAppRes.details && Array.isArray(staticWebAppRes.details)) {
          staticWebAppRes.details.map(info => info);
        }
        return staticWebAppRes;
      }));
  }

  public getAse(ase: string): Observable<ObserverAseResponse> {
    return this._diagnosticApiService.get<ObserverAseResponse>(`api/hostingEnvironments/${ase}`);
  }

  public getSiteRequestBody(site: string, stamp: string) {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/stamps/${stamp}/sites/${site}/postBody`);
  }

  public getSiteRequestDetails(site: string, stamp: string) {
    return this._diagnosticApiService.get<ObserverSiteDetailsResponse>(`api/stamps/${stamp}/sites/${site}/details`);
  }

  public getAseRequestBody(name: string) {
    return this._diagnosticApiService.get<ObserverSiteResponse>(`api/hostingEnvironments/${name}/postBody`);
  }

  public getStamp(stampName: string): Observable<ObserverStampResponse> {
    return this._diagnosticApiService.get<ObserverStampResponse>(`api/stamps/${stampName}`);
  }

  private getSiteInfoWithSlot(site: ObserverSiteInfo): ObserverSiteInfo {
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
