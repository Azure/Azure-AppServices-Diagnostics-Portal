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
          siteRes.details.map(info => this.getSiteInfoWithSlotAndHostnames(info, siteRes.hostNames));
        }

        return siteRes;
      }));
  }

  public getAse(ase: string): Observable<Observer.ObserverAseResponse> {
    return this._diagnosticApiService.get<Observer.ObserverAseResponse>(`api/hostingEnvironments/${ase}`);
  }

  private getSiteInfoWithSlotAndHostnames(site: Observer.ObserverSiteInfo, hostnames: string[]): Observer.ObserverSiteInfo {
    const siteName = site.SiteName;
    let slot = '';

    if (siteName.indexOf('(') > 0) {
      const split = site.SiteName.split('(');
      slot = split[1].replace(')', '');
    }

    site.SlotName = slot;
    site.Hostnames = hostnames;

    return site;
  }

}
