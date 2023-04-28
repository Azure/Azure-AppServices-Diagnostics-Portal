import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';


@Injectable()
export class OptInsightsGenericService {

    getInfoForOptInsights(appInsightsResourceId: string, appId: string, site: string, startTime: moment.Moment, endTime: moment.Moment, invalidateCache: boolean = false): Observable<any[] | null> {
        return of(null);
    }

    logOptInsightsEvent(resourceUri: string, telemetryEvent: string, error?: string, totalInsights?: number, site?: string) {
    }
}
