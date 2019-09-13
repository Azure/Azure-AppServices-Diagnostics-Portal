
import { map, retry, catchError } from 'rxjs/operators';
import { Http, Headers, Response } from '@angular/http';
import { Injectable } from '@angular/core';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';

@Injectable()
export class GenericApiService {
    private localEndpoint = 'http://localhost:5000';

    resourceId: string;

    detectorList: DetectorMetaData[];

    useLocal: boolean = false;

    constructor(private _http: Http, private _armService: ArmService, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(info => {
            this.resourceId = info.resourceId;
        });
    }

    public getDetectorById(detectorId: string) {
        return this.detectorList.find(detector => detector.id === detectorId);
    }

    public getDetectors(): Observable<DetectorMetaData[]> {

        if (this.useLocal) {
            const path = `v4${this.resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${this.resourceId}/detectors`;
            return this._armService.getResourceCollection<DetectorResponse[]>(path).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                this.detectorList = response.map(listItem => listItem.properties.metadata);
                return this.detectorList;
            }));
        }
    }

    public getDetectorsSearch(searchTerm): Observable<DetectorMetaData[]> {

        if (this.useLocal) {
            const path = `v4${this.resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net&text=` + encodeURIComponent(searchTerm);
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${this.resourceId}/detectors?text=` + encodeURIComponent(searchTerm);
            return this._armService.getResourceCollection<DetectorResponse[]>(path).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                var searchResults = response.map(listItem => listItem.properties.metadata).sort((a,b) => {return b.score>a.score? 1: -1;});
                return searchResults;
            }));
        }
    }

    public getDetector(detectorName: string, startTime: string, endTime: string, refresh?: boolean, internalView?: boolean, additionalQueryParams?: string) {

        if (this.useLocal) {
            const path = `v4${this.resourceId}/detectors/${detectorName}?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse>(path, 'POST');
        } else {
            let path = `${this.resourceId}/detectors/${detectorName}?startTime=${startTime}&endTime=${endTime}`;
            if (additionalQueryParams != undefined) {
                path += additionalQueryParams;
            }
            return this._armService.getResource<DetectorResponse>(path, null, refresh).pipe(
                map((response: ResponseMessageEnvelope<DetectorResponse>) => response.properties));
        }
    }

    public invoke<T>(path: string, method = 'GET', body: any = {}): Observable<T> {
        const url = `${this.localEndpoint}/api/invoke`;

        const request = this._http.post(url, body, {
            headers: this._getHeaders(path, method)
        }).pipe(
            retry(2),
            map((response: Response) => <T>(response.json())
            ));

        return request;
    }

    private _getHeaders(path?: string, method?: string): Headers {
        const headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        if (path) {
            headers.append('x-ms-path-query', path);
        }

        if (method) {
            headers.append('x-ms-method', method);
        }

        return headers;
    }

}
