
import { map, retry, catchError, flatMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';
import { ArmResource } from '../../shared-v2/models/arm';

@Injectable()
export class GenericApiService {
    private localEndpoint = 'http://localhost:5000';

    resourceId: string;

    detectorList: DetectorMetaData[];

    useLocal: boolean = false;

    effectiveLocale: string = "";

    constructor(private _http: HttpClient, private _armService: ArmService, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(info => {
            this.resourceId = info.resourceId;
            this.effectiveLocale = !!info.effectiveLocale ? info.effectiveLocale.toLowerCase() : "";
        });
    }

    public getDetectorById(detectorId: string) {
        return this.detectorList.find(detector => detector.id === detectorId);
    }

    public getDetectors(overrideResourceUri: string = ""): Observable<DetectorMetaData[]> {
        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let queryParams = this.isLocalizationApplicable() ? [{"key":"l", "value": this.effectiveLocale}]: [];
        if (this.useLocal) {
            const path = `v4${resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${resourceId}/detectors`;
            return this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {

                this.detectorList = response.map(listItem => listItem.properties.metadata);
                return this.detectorList;
            }));
        }
    }

    public getDetectorsAndWorkflows(overrideResourceUri: string = ""): Observable<DetectorMetaData[]> {
        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let queryParams = this.isLocalizationApplicable() ? [{"key":"l", "value": this.effectiveLocale}]: [];
        if (this.useLocal) {
            const path = `v4${resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${resourceId}/detectors`;
            return this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {

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
            const path = `${this.resourceId}/detectors`;
            var queryParams = [{ "key": "text", "value": searchTerm }];
            return this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                var searchResults = response.map(listItem => listItem.properties.metadata).sort((a, b) => { return b.score > a.score ? 1 : -1; });
                return searchResults;
            }));
        }
    }

    public getDetector(detectorName: string, startTime: string, endTime: string, refresh?: boolean, internalView?: boolean, additionalQueryParams?: string, overrideResourceUri?: string) {
        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let languageQueryParam = this.isLocalizationApplicable() ? `&l=${this.effectiveLocale}` : "";

        if (this.useLocal) {
            const path = `v4${resourceId}/detectors/${detectorName}?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net${languageQueryParam}`;
            return this.invoke<DetectorResponse>(path, 'POST');
        } else {
            let path = `${resourceId}/detectors/${detectorName}?startTime=${startTime}&endTime=${endTime}${languageQueryParam}`;
            if (additionalQueryParams != undefined) {
                path += additionalQueryParams;
            }

            return this._armService.getArmResource<ArmResource>(resourceId).pipe(
                flatMap(resource => {
                    let requestHeaders = new Map<string, string>();
                    requestHeaders.set('x-ms-location', resource.location);
                    if (resource.properties && resource.properties.sku) {
                        requestHeaders.set('x-ms-sku', resource.properties.sku);
                    }
                    return this._armService.getResource<DetectorResponse>(path, null, refresh, requestHeaders).pipe(
                        map((response: ResponseMessageEnvelope<DetectorResponse>) => {
                            return response.properties;
                        })
                    )
                })
            );
        }
    }

    public invoke<T>(path: string, method = 'GET', body: any = {}): Observable<T> {
        const url = `${this.localEndpoint}/api/invoke`;

        const request = this._http.post(url, body, {
            headers: this._getHeaders(path, method)
        }).pipe(
            retry(2),
            map((response) => <T>(response)));

        return request;
    }

    private isLocalizationApplicable(): boolean
    {
      return this.effectiveLocale != null && !/^\s*$/.test(this.effectiveLocale) && this.effectiveLocale != "en" && !this.effectiveLocale.startsWith("en");
    }

    private _getHeaders(path?: string, method?: string): HttpHeaders {
        const headers = new HttpHeaders();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        if (path) {
            headers.append('x-ms-path-query', path);
        }

        if (method) {
            headers.append('x-ms-method', method);
        }

        if (this.isLocalizationApplicable())
        {
            headers.append('x-ms-localization-language', encodeURI(this.effectiveLocale));
        }

        return headers;
    }

}
