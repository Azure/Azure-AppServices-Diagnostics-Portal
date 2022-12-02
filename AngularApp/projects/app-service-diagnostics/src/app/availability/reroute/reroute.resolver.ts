import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  Resolve,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

@Injectable()
export class RerouteResolver implements Resolve<Observable<boolean>> {
  constructor(private _router: Router) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const subscriptionId = route.params['subscriptionid'];
    const resourceGroup = route.params['resourcegroup'];
    const siteName = route.params['resourcename'];
    const analysisId = route.data['analysisId'];

    const reroutePath = `/resource/subscriptions/${subscriptionId}/resourcegroups/${resourceGroup}/providers/microsoft.web/sites/${siteName}/analysis/${analysisId}`;

    this._router.navigateByUrl(reroutePath);

    return of(true);
  }
}
