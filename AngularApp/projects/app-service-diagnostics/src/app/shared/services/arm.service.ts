
import { throwError as observableThrowError, ReplaySubject, Observable, throwError, timer } from 'rxjs';
import { Injectable } from '@angular/core';
import { Subscription } from '../models/subscription';
import { ResponseMessageEnvelope, ResponseMessageCollectionEnvelope } from '../models/responsemessageenvelope';
import { AuthService } from '../../startup/services/auth.service';
import { CacheService } from './cache.service';
import { catchError, retry, map, retryWhen, mergeMap, timeout } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { GenericArmConfigService } from './generic-arm-config.service';
import { StartupInfo } from '../models/portal';
import { PortalKustoTelemetryService } from './portal-kusto-telemetry.service';
import { Guid } from '../utilities/guid';
import { Router } from '@angular/router';
import { TelemetryPayload } from 'diagnostic-data';
import { ArmResource } from '../../shared-v2/models/arm';

@Injectable()
export class ArmService {
    public subscriptions = new ReplaySubject<Subscription[]>(1);

    public armApiVersion = '2016-02-01';
    public storageApiVersion = '2015-05-01-preview';
    public websiteApiVersion = '2015-08-01';
    private readonly publicAzureArmUrl = 'https://management.azure.com';
    private readonly chinaAzureArmUrl = 'https://management.chinacloudapi.cn';
    private readonly usGovernmentAzureArmUrl = 'https://management.usgovcloudapi.net';
    private readonly blackforestAzureArmUrl = 'https://management.microsoftazure.de';
    private readonly usnatAzureArmUrl = 'https://management.azure.eaglex.ic.gov';
    private readonly ussecAzureArmUrl = 'https://management.azure.microsoft.scloud';
    private diagRoleVersion: string = '';
    private readonly routeToLiberation = '2';
    private readonly routeToDiagnosticRole = '1';
    private armEndpoint: string = '';
    private isInCaseSubmissionFlow = false;
    private effectiveLocale: string = '';

    constructor(private _http: HttpClient, private _authService: AuthService, private _cache: CacheService, private _router: Router, private _genericArmConfigService?: GenericArmConfigService,
        private telemetryService?: PortalKustoTelemetryService) {
        this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
            if (!!startupInfo.armEndpoint && startupInfo.armEndpoint != '' && startupInfo.armEndpoint.length > 1) {
                this.armEndpoint = startupInfo.armEndpoint;
            }
            let resourceId = startupInfo.resourceId;
            this.effectiveLocale = !!startupInfo.effectiveLocale ? startupInfo.effectiveLocale.toLowerCase() : "";
            let subscriptionId = resourceId.split('/')[2];
            this.diagRoleVersion = this.routeToLiberation;
            this.isInCaseSubmissionFlow = startupInfo && startupInfo.source !== undefined && startupInfo.source.toLowerCase() === ("CaseSubmissionV2-NonContext").toLowerCase();
        });
    }

    get isPublicAzure(): boolean {
        return this.armUrl === this.publicAzureArmUrl;
    }

    get isFairfax(): boolean {
        return this.armUrl === this.usGovernmentAzureArmUrl;
    }

    get isBlackforest(): boolean {
        return this.armUrl === this.blackforestAzureArmUrl;
    }

    get isMooncake(): boolean {
        return this.armUrl === this.chinaAzureArmUrl;
    }

    get isUsnat(): boolean {
        return this.armUrl === this.usnatAzureArmUrl;
    }

    get isUssec(): boolean {
        return this.armUrl === this.ussecAzureArmUrl;
    }

    get isNationalCloud(): boolean {
        return this.isMooncake || this.isFairfax || this.isBlackforest || this.isUsnat || this.isUssec;
    }

    get armUrl(): string {
        if (this.armEndpoint != '' && this.armEndpoint.length > 1) {
            return this.armEndpoint;
        }
        else {
            let browserUrl = (window.location != window.parent.location) ? document.referrer : document.location.href;
            let armUrl = this.publicAzureArmUrl;

            if (browserUrl.includes("azure.cn")) {
                armUrl = this.chinaAzureArmUrl;
            }
            else if (browserUrl.includes("azure.us")) {
                armUrl = this.usGovernmentAzureArmUrl;
            } else if (browserUrl.includes("azure.de")) {
                armUrl = this.blackforestAzureArmUrl;
            }

            return armUrl;
        }
    }

    get storageUrl(): string {
        if (this.isNationalCloud) {
            let storageUrl = this.armUrl.replace("management", "core").replace("https://", "");
            return storageUrl;
        } else {
            return "core.windows.net";
        }
    }

    get isLocalizationApplicable(): boolean {
        return this.effectiveLocale != null && this.effectiveLocale != "" && this.effectiveLocale != "en" && !this.effectiveLocale.startsWith("en");
    }

    getApiVersion(resourceUri: string, apiVersion?: string): string {
        if (apiVersion) {
            return apiVersion;
        }
        else {
            if (this._genericArmConfigService) {
                apiVersion = this._genericArmConfigService.getApiVersion(resourceUri);
            }
            if (!apiVersion || apiVersion == '') {
                return this.websiteApiVersion;
            }
            else {
                return apiVersion;
            }
        }
    }

    createUrl(resourceUri: string, apiVersion?: string) {
        const uri = `${this.armUrl}${resourceUri}${resourceUri.indexOf('?') >= 0 ? '&' : '?'}` +
            `api-version=${this.getApiVersion(resourceUri, apiVersion)}`
        return uri;
    }

    getResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false, additionalHeaders?: Map<string, string>): Observable<{} | ResponseMessageEnvelope<T>> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }
        const url = this.createUrl(resourceUri, apiVersion);
        let subscriptionLocation = '';
        this.getSubscriptionLocation(resourceUri.split("subscriptions/")[1].split("/")[0]).subscribe(response => {
            subscriptionLocation = response.body['subscriptionPolicies'] ? response.body['subscriptionPolicies']['locationPlacementId'] : '';
        });

        if (!!additionalHeaders == false) {
            additionalHeaders = new Map<string, string>();
        }

        additionalHeaders.set('x-ms-subscription-location-placementid', subscriptionLocation);
        // When x-ms-diagversion is set to 1, the requests will be sent to DiagnosticRole.
        //If the value is set to other than 1 or if the header is not present at all, requests will go to runtimehost
        additionalHeaders.set('x-ms-diagversion', this.diagRoleVersion);
        // This is just for logs so that we know requests are coming from Portal.
        if (this.diagRoleVersion === this.routeToLiberation) {
            additionalHeaders.set('x-ms-azureportal', 'true');
        }

        let requestId: string = Guid.newGuid();
        additionalHeaders.set('x-ms-request-id', requestId);

        let eventProps = {
            'resourceId': resourceUri,
            'requestId': requestId,
            'requestUrl': url,
            'routerUrl': this._router.url,
            'targetRuntime': this.diagRoleVersion == this.routeToLiberation ? "Liberation" : "DiagnosticRole"
        };

        let logData = {
            eventIdentifier: "RequestRoutingDetails",
            eventPayload: eventProps
        } as TelemetryPayload;

        let requestHeaders = this.getHeaders(null, additionalHeaders);
        const request = this._http.get<ResponseMessageEnvelope<T>>(url, {
            headers: requestHeaders
        }).pipe(
            timeout(60000),
            retryWhen((attempts: Observable<any>) => {
                let maxRetryAttempts = 3;
                let scalingDuration = 1000;
                let excludedErrorNames = ["TimeoutErrors"];

                return attempts.pipe(
                    mergeMap((error, i) => {
                        const retryAttempt = i + 1;
                        // If maximum number of retries have been met
                        // or response is longer than 20 seconds with TimeoutErrors we don't wish to retry, throw error
                        let requestId: string = Guid.newGuid();
                        additionalHeaders.set('x-ms-request-id', requestId);
                        requestHeaders = this.getHeaders(null, additionalHeaders);

                        eventProps.requestId = requestId;
                        eventProps["retryCount"] = retryAttempt;

                        if (
                            retryAttempt > maxRetryAttempts ||
                            excludedErrorNames.find((e) => e === error.name)
                        ) {
                            this.telemetryService.logEvent("RetryRequestFailed", eventProps);
                            return throwError(() => error);
                        }

                        this.telemetryService.logEvent("RetryRequestRoutingDetails", eventProps);
                        return timer(retryAttempt * scalingDuration);
                    })
                );
            }
            ),
            map(r => this.getDecodedDetectorResponseMessageEnvelope<T>(url, resourceUri, r)),
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache, logData);
    }

    getDecodedDetectorResponseMessageEnvelope<T>(url: string, resourceId: string, response: ResponseMessageEnvelope<T>): ResponseMessageEnvelope<T> {
        let isDetectorsCall = url.toLowerCase().indexOf("/detectors/") > 0 || url.toLowerCase().indexOf("/detectors?") > 0;
        if (isDetectorsCall && this._genericArmConfigService && this._genericArmConfigService.isArmApiResponseBase64Encoded(resourceId)) {
            const loggingError = new Error();
            const loggingProps = {};
            loggingProps['Name'] = 'PartnerResponseBase64DecodingFailure';
            if (response && response.properties && (((response.properties) as any).value)) {
                let encodedDetectorResponse: string = ((response.properties) as any).value;
                let decodedDetectorResponseString: string = '';
                try {
                    decodedDetectorResponseString = atob(encodedDetectorResponse); //Decode the base64 response here
                } catch (error) {
                    //The string to be decoded is not properly base64 encoded.
                    loggingError.message = `Failed to decode ${(url.toLowerCase().indexOf("/detectors?") > 0) ? 'List' : 'Get'} Detector response.`;
                    loggingProps['Assertion condition'] = 'Base64 decoding failed';
                    loggingProps['String being decoded'] = encodedDetectorResponse;
                    if (error instanceof DOMException && error.name && error.name == "InvalidCharacterError") {
                        loggingProps['Error Name'] = error.name;
                        loggingProps['Error Message'] = error.message;
                    }
                    else {
                        loggingProps['Error Object'] = JSON.stringify(error);
                    }
                    loggingProps['Next Steps'] = 'Confirm the browser version supports atob. Verify if the string being decoded is properly encoded, contact partner if not.';
                    this.telemetryService.logException(loggingError, null, loggingProps);
                    return null;
                }
                try {
                    let decodedDetectorResponse: T = JSON.parse(decodedDetectorResponseString) as T;
                    response.properties = decodedDetectorResponse;
                    return response;
                } catch (error) {
                    //Log JSON parsing exception here
                    loggingError.message = 'Failed to parse decoded JSON';
                    loggingProps['Assertion condition'] = 'JSON parsing of decoded response failed';
                    loggingProps['String being parsed'] = decodedDetectorResponseString;
                    if (error instanceof SyntaxError) {
                        loggingProps['Error Name'] = error.name;
                        loggingProps['Error Message'] = error.message;
                    }
                    else {
                        loggingProps['Error Object'] = JSON.stringify(error);
                    }
                    loggingProps['Next Steps'] = 'Inspect the string that was being parsed. If the string is malformed, check to verify if we sent a valid response to partner API and then reach out to the partner contact to verify their encoding logic.';
                    this.telemetryService.logException(loggingError, null, loggingProps);
                    return null;
                }

            }
            else {
                loggingError.message = 'Encoded response not found.';
                loggingProps['Assertion condition'] = 'Looking for an encoded value failed.';
                loggingProps['Next Steps'] = 'Inspect the response to verify that it contains a encoded response. If not, confirm with the partner if this is expected and verify that the value in armconfig to force decoding is accurately configured.';
                this.telemetryService.logException(loggingError, null, loggingProps);
                return null;
            }
        }
        else {
            //No need to decode the response
            return response;
        }
    }

    getArmResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<T> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }

        const url = this.createUrl(resourceUri, apiVersion);

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            retry(2),
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache);
    }

    get(url: string): Observable<any> {

        const request = this._http.get(url, {
            headers: this.getHeaders(),
            observe: "response"
        });

        return request;
    }

    getResourceWithoutEnvelope<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<{} | T> {
        const url = this.createUrl(resourceUri, apiVersion);

        const request = this._http.get<T>(url, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, appendBodyToCacheKey: boolean = false): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post<S>(url, bodyString, { headers: this.getHeaders() }).pipe(
            retry(2),
            catchError(this.handleError.bind(this))
        );

        let cacheKey: string = appendBodyToCacheKey ? url + bodyString : url;

        return this._cache.get(cacheKey, request, invalidateCache);
    }

    requestResource<T, S>(method: string, resourceUri: string, body?: S, apiVersion?: string): Observable<{} | T> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.request<S>(method, url, { headers: this.getHeaders(), body: bodyString, observe: "response" });

        return request;
    }

    requestResourceWithCache<T, S>(method: string, resourceUri: string, body?: S, apiVersion?: string, invalidateCache = false): Observable<{} | T> {
        if (!resourceUri.startsWith('/')) {
            resourceUri = '/' + resourceUri;
        }
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.request<S>(method, url, { headers: this.getHeaders(), body: bodyString, observe: "response" });

        return this._cache.get(url, request, invalidateCache);
    }


    post(url: string, body?: any): Observable<any> {
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post(url, bodyString, { headers: this.getHeaders() }).pipe(
            retry(2),
            catchError(this.handleError.bind(this))
        );

        return request;
    }

    deleteResource<T>(resourceUri: string, apiVersion?: string, invalidateCache: boolean = false): Observable<any> {
        const url = this.createUrl(resourceUri, apiVersion);
        return this._http.delete(url, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError.bind(this))
        );
    }

    postResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false): Observable<boolean | {} | T> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post<T>(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache);
    }

    putResource<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, additionalHeaders?: Map<string, string>): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, { headers: this.getHeaders(undefined, additionalHeaders) }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache);
    }

    patchResource<T, S>(resourceUri: string, body?: S, apiVersion?: string): Observable<boolean | {} | ResponseMessageEnvelope<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.patch(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError.bind(this))
        );

        // Always invalidate cache for write calls as we dont want to just hit cache.
        // Setting InvalidateCache = true will make sure that there is an outbound call everytime this method is called.
        return this._cache.get(url, request, true);
    }

    putResourceWithoutEnvelope<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = true): Observable<boolean | {} | T> {
        const url = this.createUrl(resourceUri, apiVersion);
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, { headers: this.getHeaders() }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache);
    }

    postResourceFullResponse<T>(resourceUri: string, body: any, invalidateCache: boolean = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.post<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    putResourceFullResponse<T>(resourceUri: string, body: any = null, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.put<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    patchResourceFullResponse<T>(resourceUri: string, body: any = null, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.patch<T>(url, body, {
            headers: this.getHeaders(),
            observe: 'response'
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    getResourceFullResponse<T>(resourceUri: string, invalidateCache = false, apiVersion?: string):
        Observable<HttpResponse<T>> {
        const url = this.createUrl(resourceUri, apiVersion);
        const request = this._http.get<T>(url, {
            headers: this.getHeaders(),
            observe: 'response'
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    getResourceFullUrl<T>(resourceUri: string, invalidateCache: boolean = false): Observable<T> {
        const request = this._http.get<T>(resourceUri, {
            headers: this.getHeaders()
        }).pipe(
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(resourceUri, request, invalidateCache);
    }

    retryWithPostOnGetFailure<T, S>(resourceUri: string, body?: S, apiVersion?: string, invalidateCache: boolean = false, upatedResourceUri: string = ''): Observable<boolean | {} | T> {
        const url = this.createUrl(resourceUri, apiVersion);
        return this._http.get<T>(url, { headers: this.getHeaders() }).pipe(
            map(resp => {
                return resp;
            }),
            catchError(err => {
                if (err.status && err.status === 405) {
                    let actualResourceUri = upatedResourceUri ? upatedResourceUri : resourceUri;
                    return this.postResourceWithoutEnvelope<T, S>(actualResourceUri, body, apiVersion, invalidateCache);
                } else {
                    let actualError: string = JSON.stringify(err);
                    if (err.error && err.error.Message) {
                        actualError = err.error.Message;
                    }
                    return throwError(actualError)
                }
            }));
    }

    static prettifyError(error: any): string {
        let errorReturn = '';

        if (error.code) {
            errorReturn = "Code:" + error.code;
        } else if (error.StatusCode) {
            errorReturn = "StatusCode:" + error.StatusCode;
        }
        if (error.message) {
            errorReturn += ' ' + error.message;
        } else if (error.Message) {
            errorReturn += ' ' + error.Message;
        } else if (error.description) {
            errorReturn += ' ' + error.description;
        } else if (error.Description) {
            errorReturn += ' ' + error.Description;
        }

        if (errorReturn === '') {
            errorReturn = JSON.stringify(error);
        } else {
            errorReturn = errorReturn.trim();
        }
        return errorReturn;
    }

    private handleError(error: HttpErrorResponse): any {
        let actualError = "";
        const loggingError = new Error();
        const loggingProps = {};
        if (error) {
            loggingProps['rawError'] = JSON.stringify(error);
            if (error.error) {
                if (error.error.error) {
                    actualError = ArmService.prettifyError(error.error.error);
                } else {
                    actualError = ArmService.prettifyError(error.error);
                }

                if (error.error instanceof ErrorEvent) {
                    loggingError.message = error.error.message;
                    loggingProps['reason'] = "A client-side or network error occured.";
                }
            }
            else if (error.message) {
                loggingProps['reason'] = "Server side unsuccessful response code.";
            } else {
                actualError = 'Server Error';
            }
            loggingProps['url'] = `${error.url}`;
            loggingProps['status'] = `${error.status}`;
            loggingProps['statusText'] = `${error.statusText}`;
        }

        if (!loggingError.message) {
            loggingError.message = actualError;
        }

        if (this.telemetryService) {
            this.telemetryService.logException(loggingError, "arm.service", loggingProps);
        }
        return observableThrowError(actualError);
    }

    getResourceCollection<T>(resourceId: string, apiVersion?: string, invalidateCache: boolean = false, queryParams: any[] = []): Observable<{} | ResponseMessageCollectionEnvelope<T>> {
        if (!resourceId.startsWith('/')) {
            resourceId = '/' + resourceId;
        }
        var url = `${this.armUrl}${resourceId}?api-version=${this.getApiVersion(resourceId, apiVersion)}`;
        if (queryParams && queryParams.length > 0) {
            queryParams.forEach(param => {
                url = url + "&" + param["key"] + "=" + encodeURIComponent(param["value"]);
            });
        }

        let isDetectorsCall = url.toLowerCase().indexOf("/detectors?") > 0;
        let additionalHeaders = new Map<string, string>();
        // When x-ms-diagversion is set to 1, the requests will be sent to DiagnosticRole.
        //If the value is set to other than 1 or if the header is not present at all, requests will go to runtimehost
        additionalHeaders.set('x-ms-diagversion', this.diagRoleVersion);
        // This is just for logs so that we know requests are coming from Portal.
        if (this.diagRoleVersion === this.routeToLiberation) {
            additionalHeaders.set('x-ms-azureportal', 'true');
        }

        let requestId: string = Guid.newGuid();
        additionalHeaders.set('x-ms-request-id', requestId);

        let eventProps = {
            'resourceId': resourceId,
            'requestId': requestId,
            'requestUrl': url,
            'routerUrl': this._router.url,
            'targetRuntime': this.diagRoleVersion == this.routeToLiberation ? "Liberation" : "DiagnosticRole"
        };

        let logData = {
            eventIdentifier: "RequestRoutingDetails",
            eventPayload: eventProps
        } as TelemetryPayload;

        const request = this._http.get(url, { headers: this.getHeaders(null, additionalHeaders) }).pipe(
            map<ResponseMessageCollectionEnvelope<ResponseMessageEnvelope<T>>, ResponseMessageEnvelope<T>[]>(r => {
                if (isDetectorsCall && this._genericArmConfigService && this._genericArmConfigService.isArmApiResponseBase64Encoded(resourceId)) {
                    let decodedResponseArray: ResponseMessageEnvelope<T>[] = [];
                    r.value.forEach(response => {
                        let decodedResponse: ResponseMessageEnvelope<T> = this.getDecodedDetectorResponseMessageEnvelope(url, resourceId, response);
                        if (decodedResponse) {
                            decodedResponseArray.push(decodedResponse);
                        }
                    });
                    return decodedResponseArray;
                }
                else {
                    return r.value;
                }
            }),
            catchError(this.handleError.bind(this))
        );

        return this._cache.get(url, request, invalidateCache, logData);
    }

    getSubscriptionLocation(subscriptionId: string): Observable<HttpResponse<any>> {
        return this.getResourceFullResponse<any>(`/subscriptions/${subscriptionId}`, false, '2019-06-01');
    }

    getHeaders(etag?: string, additionalHeaders?: Map<string, string>): HttpHeaders {
        let headers = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/json');
        headers = headers.set('Accept', 'application/json');
        headers = headers.set('Authorization', `Bearer ${this._authService.getAuthToken()}`);

        if (etag) {
            headers = headers.set('If-None-Match', etag);
        }

        if (additionalHeaders) {
            additionalHeaders.forEach((headerVal: string, headerKey: string) => {
                if (headerVal.length > 0 && headerKey.length > 0) {
                    headers = headers.set(headerKey, headerVal);
                }
            });
        }

        if (this.isLocalizationApplicable) {
            headers = headers.set('x-ms-localization-language', encodeURI(this.effectiveLocale));
        }

        return headers;
    }

    clearCache(): void {
        this._cache.clear();
    }
}
