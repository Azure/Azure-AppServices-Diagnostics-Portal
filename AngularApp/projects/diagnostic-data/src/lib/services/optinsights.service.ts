import { Injectable } from '@angular/core';
import { CodeOptimizationsLogEvent, CodeOptimizationsRequest } from '../../lib/models/optinsights';
import { Observable, of } from 'rxjs';


@Injectable()
export class OptInsightsGenericService {

    getInfoForOptInsights(codeOptimizationsRequest: CodeOptimizationsRequest): Observable<any[] | null> {
        return of(null);
    }

    logOptInsightsEvent(codeOptimizationsLogEvent: CodeOptimizationsLogEvent) {
    }
}