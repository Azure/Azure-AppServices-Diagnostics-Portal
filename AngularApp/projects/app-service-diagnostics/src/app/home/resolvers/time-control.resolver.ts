import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { DetectorControlService, TimePickerOptions } from 'diagnostic-data';
import { Observable, of } from 'rxjs';

@Injectable()
export class TimeControlResolver implements Resolve<Observable<boolean>> {
    constructor(private _detectorControlService: DetectorControlService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        let startTime = route.queryParams['startTime'];
        let endTime = route.queryParams['endTime'];
        if (!!startTime && !!endTime)
        {
            this._detectorControlService.setCustomStartEnd(startTime, endTime, "TimeControlResolver");
            this._detectorControlService.updateTimePickerInfo({
                selectedKey: TimePickerOptions.Custom,
                selectedText: TimePickerOptions.Custom,
                startDate: new Date(startTime),
                endDate: new Date(endTime)
            });
        }

        if (!this._detectorControlService.startTime) {
            this._detectorControlService.setDefault();
        }
        return of(true);
    }
}
