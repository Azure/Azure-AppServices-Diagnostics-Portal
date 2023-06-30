
import { map, retry, catchError, flatMap, concatMap } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApolloDiagApiMap, ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { Observable, of, forkJoin } from 'rxjs';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { DetectorResponse, DetectorMetaData, workflowNodeResult, UriUtilities } from 'diagnostic-data';
import { ArmResource } from '../../shared-v2/models/arm';
import { GenericArmConfigService } from './generic-arm-config.service';

@Injectable()
export class GenericApiService {
    private localEndpoint = 'http://localhost:5000';

    resourceId: string;

    detectorList: DetectorMetaData[];

    useLocal: boolean = false;

    useApolloApi: boolean = false;

    effectiveLocale: string = "";

    constructor(private _http: HttpClient, private _armService: ArmService, private _authService: AuthService, private _genericArmConfigService: GenericArmConfigService) {
        this._authService.getStartupInfo().subscribe(info => {
            this.resourceId = info.resourceId;
            this.effectiveLocale = !!info.effectiveLocale ? info.effectiveLocale.toLowerCase() : "";
            // Use apollo api if this is a partial resource or explicitly configured in the config
            this.useApolloApi = UriUtilities.isNoResourceCall(info.resourceId) || this._genericArmConfigService.getArmApiConfig(info.resourceId)?.useApolloApi === true;
        });
    }

    public getDetectorById(detectorId: string) {
        return this.detectorList.find(detector => detector.id === detectorId);
    }

    public getDetectors(overrideResourceUri: string = ""): Observable<DetectorMetaData[]> {

        //
        // Enabling this flag to call both detectors and workflows
        //

        let fetchDetectorsAndWorkflows = true;
        if (fetchDetectorsAndWorkflows) {
            return this.getDetectorsAndWorkflows(overrideResourceUri);
        }

        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let queryParams = this.isLocalizationApplicable() ? [{ "key": "l", "value": this.effectiveLocale }] : [];
        if (this.useLocal) {
            const path = `v4${resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${resourceId}/detectors`;
            if (this.useApolloApi) {
                return this._armService.invokeApolloApiForPassThrough<DetectorResponse[]>(path, resourceId, ApolloDiagApiMap.ListDetectors, null, false, queryParams).pipe(map((response: DetectorResponse[]) => {
                    this.detectorList = response?.map(listItem => listItem.metadata);
                    return this.detectorList;
                }));
            } else {
                return this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {

                    this.detectorList = response.map(listItem => listItem.properties.metadata);
                    return this.detectorList;
                }));
            }
        }
    }

    public getDetectorsSearch(searchTerm): Observable<DetectorMetaData[]> {
        if (this.useLocal) {
            const path = `v4${this.resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net&text=` + encodeURIComponent(searchTerm);
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {
            const path = `${this.resourceId}/detectors`;
            var queryParams = [{ "key": "text", "value": searchTerm }];
            if (this.useApolloApi) {
                return this._armService.invokeApolloApiForPassThrough<DetectorResponse[]>(path, this.resourceId, ApolloDiagApiMap.ListDetectors, null, false, queryParams).pipe(map((response: DetectorResponse[]) => {
                    var searchResults = response.map(listItem => listItem.metadata).sort((a, b) => { return b.score > a.score ? 1 : -1; });
                    return searchResults;
                }));
            }
            else {
                return this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams).pipe(map((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                    var searchResults = response.map(listItem => listItem.properties.metadata).sort((a, b) => { return b.score > a.score ? 1 : -1; });
                    return searchResults;
                }));
            }
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

            if (this.useApolloApi) {
                if (resourceId.toLowerCase().indexOf('/resourcegroup/') > -1) {
                    return this._armService.getArmResource<ArmResource>(resourceId).pipe(
                        concatMap(resource => {
                            let requestHeaders = new Map<string, string>();
                            requestHeaders.set('x-ms-location', resource.location);
                            if (resource.properties && resource.properties.sku) {
                                requestHeaders.set('x-ms-sku', resource.properties.sku);
                            }
                            return this._armService.invokeApolloApiForPassThrough<DetectorResponse>(path, resourceId, ApolloDiagApiMap.GetDetector, null, refresh, null, requestHeaders).pipe(
                                map((response: DetectorResponse) => {
                                    return response;
                                })
                            );
                        })
                    );
                }
                else {
                    //There is no location or SKU if this is a partial resource. We can simply get the detectector.
                    return this._armService.invokeApolloApiForPassThrough<DetectorResponse>(path, resourceId, ApolloDiagApiMap.GetDetector, null, refresh).pipe(
                        map((response: DetectorResponse) => {
                            return response;
                        })
                    );
                }
            }
            else {
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
    }

    getWorkflowNode(workflowId: string, workflowExecutionId: string, nodeId: string, startTime: string, endTime: string, internalView: boolean = false, formQueryParams?: string, overrideResourceUri?: string, workflowUserInputs?: any): Observable<workflowNodeResult> {
        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let languageQueryParam = this.isLocalizationApplicable() ? `&l=${this.effectiveLocale}` : "";
        let path = `${resourceId}/detectors/${workflowId}?startTime=${startTime}&endTime=${endTime}${languageQueryParam}&diagnosticEntityType=workflow&workflowNodeId=${nodeId}&workflowExecutionId=${workflowExecutionId}`;
        if (formQueryParams != undefined) {
            path += formQueryParams;
        }

        let userInputsPath = '';
        if (workflowUserInputs != null) {
            userInputsPath += `&workflowUserInputs=${JSON.stringify(workflowUserInputs)}`;
        }

        if (this.useLocal) {
            const path = `v4${resourceId}/detectors/${workflowId}?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net${languageQueryParam}&diagnosticEntityType=workflow&workflowNodeId=${nodeId}&workflowExecutionId=${workflowExecutionId}${userInputsPath}`;
            return this.invoke<workflowNodeResult>(path, 'POST');
        } else {
            return this._armService.getArmResource<ArmResource>(resourceId).pipe(
                flatMap(resource => {
                    let requestHeaders = new Map<string, string>();
                    requestHeaders.set('x-ms-location', resource.location);
                    if (resource.properties && resource.properties.sku) {
                        requestHeaders.set('x-ms-sku', resource.properties.sku);
                    }

                    let invalidateCache = true;
                    path = path + userInputsPath;
                    return this._armService.getResource<workflowNodeResult>(path, null, invalidateCache, requestHeaders).pipe(
                        map((response: ResponseMessageEnvelope<workflowNodeResult>) => {
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

    private getDetectorsAndWorkflows(overrideResourceUri: string = ""): Observable<DetectorMetaData[]> {
        let resourceId = overrideResourceUri ? overrideResourceUri : this.resourceId;
        let queryParams = this.isLocalizationApplicable() ? [{ "key": "l", "value": this.effectiveLocale }] : [];
        if (this.useLocal) {
            const path = `v4${resourceId}/detectors?stampName=waws-prod-bay-085&hostnames=netpractice.azurewebsites.net`;
            return this.invoke<DetectorResponse[]>(path, 'POST').pipe(map(response => response.map(detector => detector.metadata)));
        } else {

            const path = `${resourceId}/detectors`;
            const allDetectors = this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams);

            queryParams.push({ key: 'diagnosticEntityType', value: 'workflow' })
            const allWorkflows = this._armService.getResourceCollection<DetectorResponse[]>(path, null, false, queryParams);

            return forkJoin([allDetectors, allWorkflows]).pipe(map(responses => {
                let allEntities: DetectorMetaData[] = [];
                responses.forEach((response: ResponseMessageEnvelope<DetectorResponse>[]) => {
                    let list = response.map(listItem => listItem.properties.metadata);
                    allEntities = allEntities.concat(list);
                });

                //
                // For some resource types (e.g. AKS), the query strings are not passed
                // to applens backend. They will up making 2 ListDetectors call. Till the
                // time this is fixed, just remove duplicates from the collection to
                // ensure that rest of the UI is not breaking or getting confused
                //

                let uniqueEntityList: DetectorMetaData[] = [];
                for (let i of allEntities) {
                    if (uniqueEntityList.findIndex(entity => entity.id === i.id) === -1) {
                        uniqueEntityList.push(i);
                    }
                }

                this.detectorList = uniqueEntityList;
                return this.detectorList;
            }));
        }
    }

    private isLocalizationApplicable(): boolean {
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

        if (this.isLocalizationApplicable()) {
            headers.append('x-ms-localization-language', encodeURI(this.effectiveLocale));
        }

        return headers;
    }

}
