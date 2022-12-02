import { DiagnosticService } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { of as observableOf, Observable, BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';

@Injectable()
export class TabTitleResolver implements Resolve<Observable<string>> {
  constructor(private _diagnosticService: DiagnosticService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<string> {
    if (!route.data['navigationTitle']) {
      let detectorId = route.params['detectorName'];
      let analysisId = route.params['analysisId'];

      if (analysisId != null) {
        detectorId = analysisId;
      }

      if (detectorId === 'searchResultsAnalysis') {
        return observableOf('Diagnose and Solve');
      }

      return this._diagnosticService.getDetectors().pipe(
        map((detectors) => {
          if (this._diagnosticService.getDetectorById(detectorId)) {
            return this._diagnosticService.getDetectorById(detectorId).name;
          } else {
            return 'Diagnose and Solve';
          }
        })
      );
    }

    return of('Tab');
  }
}
