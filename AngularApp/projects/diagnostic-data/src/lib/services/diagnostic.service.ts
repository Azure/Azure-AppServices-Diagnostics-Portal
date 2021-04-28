import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { DetectorResponse, DetectorMetaData } from '../models/detector';
import { QueryResponse } from '../models/compiler-response';

@Injectable()
export class DiagnosticService {
    // TODO: Figure out if this can be done with an abstract class
    // Ran into difficulties in Support Center when this was abstract
    // This class is never supposed to be used directly
    // In applens we provide this withValue: applens-diagnostics.service
    // In Support Center we provide this withValue: generic-api.service
    public resourceId:string = "";
    public getDetectorById(detectorId: string) {
        return null;
    }

    public getDetector(detector: string, startTime: string, endTime: string, refresh?: boolean, internalView?: boolean, formQueryParams?: string,overrideResourceUri?:string): Observable<DetectorResponse> {
        return null;
    }

    public getDetectors(overrideResourceUri:string = "",internalClient:boolean = true): Observable<DetectorMetaData[]> {
        return null;
    }

    public getDetectorsSearch(searchTerm: string, internalClient:boolean = true): Observable<DetectorMetaData[]> {
        return null;
    }

    getCompilerResponse(body: any, isSystemInvoker: boolean, detectorId: string = '', startTime: string = '',
            endTime: string = '', dataSource: string = '', timeRange: string = '', additionalParams?: any):
            Observable<QueryResponse<DetectorResponse>> {
        return null;
    }
}
