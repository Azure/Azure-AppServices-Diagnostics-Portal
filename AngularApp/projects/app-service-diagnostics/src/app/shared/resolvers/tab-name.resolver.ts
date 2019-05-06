import { DiagnosticService } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Resolve, RouterStateSnapshot, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable()
export class TabTitleResolver implements Resolve<Observable<string>> {
  constructor(private _diagnosticService: DiagnosticService) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
    if (!route.data['navigationTitle']) {
      let detectorId = route.params['detectorName'];
      let analysisId = route.params['analysisId'];

      if (analysisId != null && detectorId != null) {
        detectorId = analysisId;
      }

      if (detectorId == null && analysisId != null) {
        detectorId = analysisId;
      }

      //const detectorId = route.params['detectorName'] != null ? route.params['detectorName'] : route.params['analysisId'];
      console.log("TabTitleResolver has detectorId = " + detectorId);
      return this._diagnosticService.getDetectors().pipe(map(detectors => {
        return this._diagnosticService.getDetectorById(detectorId).name;
      }));
    }

    return of('Tab');
  }
}
