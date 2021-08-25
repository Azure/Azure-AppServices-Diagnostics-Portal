import { Injectable, isDevMode } from '@angular/core';
import { Observable, of, ReplaySubject, throwError } from 'rxjs';
import { StartupInfo, Event, Data, Verbs, Action, LogEntryLevel, Message, OpenBladeInfo, KeyValuePair } from '../../shared/models/portal';
import { ErrorEvent } from '../../shared/models/error-event';
import { BroadcastService } from './broadcast.service';
import { BroadcastEvent } from '../models/broadcast-event';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../src/environments/environment';
import { catchError, map, retry } from 'rxjs/operators';
import { TelemetryEventNames } from 'diagnostic-data';

const publicOrigins = [
    'portal.azure.com'
];

@Injectable()
export class PortalService {
    public sessionId = '';
    private portalSignature: string = 'FxFrameBlade';
    private iFrameSignature: string = 'AppServiceDiagnosticsIFrame';
    private startupInfoObservable: ReplaySubject<StartupInfo>;
    private appInsightsResourceObservable: ReplaySubject<any>;

    private isIFrameForCaseSubmissionSolution: ReplaySubject<boolean>;

    private sendChatAvailabilityObservable: ReplaySubject<any>;
    private sendbuiltChatUrlObservable: ReplaySubject<any>;
    private sendChatUrlObservable: ReplaySubject<any>;
    private getBladeReturnValueObservable: ReplaySubject<KeyValuePair>;
    private setBladeReturnValueObservable: ReplaySubject<any>;
    private sendIFrameInfoObservable: ReplaySubject<any>;

    public shellSrc: string;
    private tokenObservable: ReplaySubject<string>;
    private origin: string;
    private acceptedOriginsSuffix: string[] = [];

    constructor(private _broadcastService: BroadcastService, private _http: HttpClient) {
        this.sessionId = '';

        this.startupInfoObservable = new ReplaySubject<StartupInfo>(1);
        this.tokenObservable = new ReplaySubject<string>(1);
        this.appInsightsResourceObservable = new ReplaySubject<any>(1);

        this.isIFrameForCaseSubmissionSolution = new ReplaySubject<boolean>(1);
        this.sendIFrameInfoObservable = new ReplaySubject<any>(1);

        //CXP Chat messages
        this.sendChatAvailabilityObservable = new ReplaySubject<any>(1);
        this.sendbuiltChatUrlObservable = new ReplaySubject<any>(1);
        this.sendChatUrlObservable = new ReplaySubject<any>(1);

        this.getBladeReturnValueObservable = new ReplaySubject<KeyValuePair>(1);
        this.setBladeReturnValueObservable = new ReplaySubject<any>(1);
        if (this.inIFrame()) {
            this.initializeIframe();
        }
    }

    getStartupInfo(): ReplaySubject<StartupInfo> {
        return this.startupInfoObservable;
    }

    isWithinCaseSubmissionSolution(): ReplaySubject<boolean> {
        return this.isIFrameForCaseSubmissionSolution;
    }

    getToken(): ReplaySubject<string> {
        return this.tokenObservable;
    }

    getAppInsightsResourceInfo(): ReplaySubject<any> {
        return this.appInsightsResourceObservable;
    }

    getChatAvailability(): ReplaySubject<any> {
        return this.sendChatAvailabilityObservable;
    }

    buildChatUrl(): ReplaySubject<any> {
        return this.sendbuiltChatUrlObservable;
    }

    getChatUrl(): ReplaySubject<any> {
        return this.sendChatUrlObservable;
    }

    getBladeReturnValue(): ReplaySubject<KeyValuePair> {
        return this.getBladeReturnValueObservable;
    }

    getIFrameInfo(): ReplaySubject<any> {
        return this.sendIFrameInfoObservable;
    }
    public setBladeReturnValue(dataToSet: KeyValuePair): ReplaySubject<any> {
        if (!!dataToSet) {
            this.postMessage(Verbs.setBladeReturnValue, JSON.stringify(dataToSet));
            return this.setBladeReturnValueObservable;
        }
        else {
            this.logException("NULL data cannot be set as blade return value");
            return null;
        }
    }



    initializeIframe(): void {
        this.shellSrc = this.getQueryStringParameter('trustedAuthority');
        // This is a required message. It tells the shell that your iframe is ready to receive messages.
        this.postMessage(Verbs.ready, null);
        this.postMessage(Verbs.getStartupInfo, null);

        window.addEventListener(Verbs.message, this.iframeReceivedMsg.bind(this), false);

        this._broadcastService.subscribe<ErrorEvent>(BroadcastEvent.Error, error => {
            if (error.details) {
                this.logException('broadcast get error', { error: error.details });
            }
        });
    }

    openBlade(bladeInfo: OpenBladeInfo, source: string) {
        this.postMessage(Verbs.openBlade, JSON.stringify(bladeInfo));
    }

    updateBladeInfo(bladeInfo: any, source: string) {
        this.postMessage("update-blade-info", JSON.stringify(bladeInfo));
    }

    openSupportRequestBlade(obj: any, source: string): void {
        this.logAction(source, 'open-blade-input' + obj.bladeName, null);
        const inputStr = JSON.stringify(obj);
        this.postMessage(Verbs.openSupportRequestBlade, inputStr);
    }

    closeBlades() {
        this.postMessage(Verbs.closeBlades, '');
    }

    logAction(subcomponent: string, action: string, data?: any): void {
        const actionStr = JSON.stringify(<Action>{
            subcomponent: subcomponent,
            action: action,
            data: data
        });

        if (isDevMode()) {
            console.log({ id: subcomponent, category: action, data: data });
        }

        this.postMessage(Verbs.logAction, actionStr);
    }

    logMessage(level: LogEntryLevel, message: string, properties?: { [name: string]: string }) {
        const info: Message = {
            level: level,
            message: message
        }
        if (properties) {
            const restArgs = Object.entries(properties).map(entry => {
                let obj = {};
                obj[entry[0]] = JSON.stringify(entry[1]);
                return obj;
            });
            info.restArgs = restArgs;
        }

        this.postMessage(Verbs.logMessage, JSON.stringify(info));
    }

    setDirtyState(dirty: boolean): void {
        this.postMessage(Verbs.setDirtyState, JSON.stringify(dirty));
    }

    private iframeReceivedMsg(event: Event): void {
        if (!event || !event.data || event.data.signature !== this.portalSignature) {
            return;
        }

        const data = event.data.data;
        const methodName = event.data.kind;

        console.log('[iFrame] Received validated mesg: ' + methodName, event, event.srcElement, event.srcElement.location, event.srcElement.location.host);

        this._checkAcceptOrigins(event).subscribe(foundOrigin => {
            if (!foundOrigin) {
                return;
            }

            const isIFrameForCaseSubmissionSolution = event.srcElement.location.host.toString().includes("appservice-diagnostics-am2");

            if (methodName === Verbs.sendStartupInfo) {
                const info = <StartupInfo>data;
                this.sessionId = info.sessionId;
                info.isIFrameForCaseSubmissionSolution = isIFrameForCaseSubmissionSolution;
                this.startupInfoObservable.next(info);
                this.isIFrameForCaseSubmissionSolution.next(isIFrameForCaseSubmissionSolution);
                this.logMessage(LogEntryLevel.Verbose, TelemetryEventNames.PortalIFrameLoadingSuccess, {
                    'portalSessionId': this.sessionId
                });
                this.logEvent(TelemetryEventNames.PortalIFrameLoadingSuccess,{});
            } else if (methodName === Verbs.sendAppInsightsResource) {
                const aiResource = data;
                this.appInsightsResourceObservable.next(aiResource);
            } else if (methodName === Verbs.sendChatAvailability) {
                const chatAvailability = data;
                this.sendChatAvailabilityObservable.next(chatAvailability);
            } else if (methodName === Verbs.sendbuiltChatUrl) {
                const chatUrl = data;
                this.sendbuiltChatUrlObservable.next(chatUrl);
            } else if (methodName === Verbs.sendChatUrl) {
                const chatUrlAfterAvailability = data;
                this.sendChatUrlObservable.next(chatUrlAfterAvailability);
            } else if (methodName == Verbs.getBladeReturnValueResponse) {
                const getBladeReturnValueResponse = data;
                this.getBladeReturnValueObservable.next(getBladeReturnValueResponse);
            } else if (methodName == Verbs.setBladeReturnValueResponse) {
                const setBladeReturnValueResponse = data;
                this.setBladeReturnValueObservable.next(setBladeReturnValueResponse);
            } else if (methodName == Verbs.sendToken) {
                const token = data;
                this.tokenObservable.next(token);
            } else if (methodName == Verbs.sendIFrameInfo) {
                const iFrameInfo = data;
                this.sendIFrameInfoObservable.next(iFrameInfo);
            }
        });
    }



    public postMessage(verb: string, data: string) {
        if (this.inIFrame()) {
            let dataString = data;
            try {
                var dataJsonObject = data === null ? {} : JSON.parse(data);
                const dataObjectWithEventType = {
                    signature: this.iFrameSignature,
                    eventType: verb,
                    ...dataJsonObject,
                }

                dataString = JSON.stringify(dataObjectWithEventType);
            }
            catch (error) {
                // If Json is misformatted, log json string without verb in data only.
            }

            window.parent.postMessage(<Data>{
                signature: this.portalSignature,
                kind: verb,
                data: dataString
            }, this.shellSrc);
        }
    }

    private inIFrame(): boolean {
        return window.parent !== window;
    }

    private getQueryStringParameter(name: string) {
        return this.getQueryMap()[name] || '';
    }

    private getQueryMap(): any {
        const query = window.location.search.substring(1);
        const parameterList = query.split('&');
        const map = {};
        for (let i = 0; i < parameterList.length; i++) {
            const pair = parameterList[i].split('=');
            map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }

        return map;
    }

    private _getAcceptOrigins(event: Event): Observable<string[]> {
        const apiEndPoint = environment.backendHost;
        const path = "api/appsettings/AcceptOriginSuffix:Origins"
        const url = `${apiEndPoint}${path}`;
        if (this.acceptedOriginsSuffix.length > 0) {
            return of(this.acceptedOriginsSuffix);
        }

        if (event.data.kind === Verbs.sendStartupInfo) {
            const startupInfo = <StartupInfo>event.data.data;
            const request = this._http.get<string>(url, {
                headers: this._getHeaders(startupInfo)
            }).pipe(map(res => {
                let originList: string[] = [];
                if (res !== null && res !== undefined) {
                    const s = res.replace(/\s/g, "");
                    originList = s.split(",");
                    this.acceptedOriginsSuffix = originList;
                }
                return originList;
            }), retry(2), catchError(error => {
                this.logException("cannot get origin list from backend appsetting", { error: JSON.stringify(error) });

                return throwError(error);
            }));

            return request;
        }

        return of([]);
    }

    private _getHeaders(startupInfo: StartupInfo) {
        let headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${startupInfo.token}`
        });
        return headers;
    }

    private _checkAcceptOrigins(event: Event): Observable<boolean> {
        if (event.data.kind === Verbs.sendStartupInfo) {
            const info = <StartupInfo>(event.data.data);
            this.sessionId = info.sessionId;
            this.logMessage(LogEntryLevel.Verbose, TelemetryEventNames.PortalIFrameLoadingStart, {
                'portalSessionId': this.sessionId
            });
            this.logEvent(TelemetryEventNames.PortalIFrameLoadingStart,{});
        }

        if (!event.origin) {
            this.logException("iFrame event does not include origin property");
            return of(false);
        }
        this.origin = event.origin;
        //If can find from public origins,no need backend call
        if (publicOrigins.findIndex(o => event.origin.toLocaleLowerCase().endsWith(o.toLowerCase())) > -1) {
            return of(true);
        }

        return this._getAcceptOrigins(event).pipe(map(originsSuffix => {
            const originIndex = originsSuffix.findIndex(o => event.origin.toLowerCase().endsWith(o.toLowerCase()));
            if (originIndex === -1) {
                this.logException("cannot find origin from origin list");
            }
            return originIndex > -1;
        }));
    }

    private logException(exceptionMessage: string, properties?: {[name:string]:string}) {
        properties = properties || {};
        this.logMessage(LogEntryLevel.Error, exceptionMessage, properties);
        this.logEvent(TelemetryEventNames.PortalIFrameLoadingException,properties);
    }

    //log into Kusto for portal event
    private logEvent(eventMessage: string, properties: { [name: string]: string }, measurements?: any) {
        const eventProp = {
            ...properties,
            'measurements': measurements,
            'url': window.location.href,
            'origin': this.origin
        };
        if (!eventProp["portalSessionId"] && this.sessionId !== "") {
            eventProp["portalSessionId"] = this.sessionId;
        }
        this.logAction('diagnostic-data', eventMessage, eventProp);
    }
}
