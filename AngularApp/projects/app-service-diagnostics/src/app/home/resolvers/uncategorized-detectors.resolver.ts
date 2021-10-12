import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DetectorCategorizationService } from '../../shared/services/detector-categorized.service';
import { FeatureService } from '../../shared-v2/services/feature.service';

@Injectable()
export class UncategorizedDetectorsResolver implements Resolve<Observable<boolean>> {
    constructor(private _detectorCategorization: DetectorCategorizationService) { }

    resolve(activatedRouteSnapshot: ActivatedRouteSnapshot): Observable<boolean> {
        let detectorId = activatedRouteSnapshot.params["detectorName"];
        let categoryId = activatedRouteSnapshot.parent.params["category"];
        // this._detectorCategorization.addDetectorToCategory(detectorId, categoryId);
        return of(true);
    }
}
