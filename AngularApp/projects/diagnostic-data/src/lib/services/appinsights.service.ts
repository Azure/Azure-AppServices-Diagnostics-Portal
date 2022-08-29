import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, ReplaySubject } from 'rxjs';

@Injectable()

export class AppInsightsQueryService {

    public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;

    public appInsightsSettings: any = {
        validForStack: undefined,
        enabledForWebApp: undefined,
        connectedWithSupportCenter: undefined,
        resourceUri: undefined,
        name: undefined,
        appId: undefined
    };

    CheckIfAppInsightsEnabled(): Observable<boolean> {
        return null;
    }

    ExecuteQuerywithPostMethod(query: string): Observable<any> {
        return null;
    }

    openAppInsightsFailuresBlade() {
    }

    openAppInsightsBlade() {
    }

    openAppInsightsPerformanceBlade() {
    }

    openAppInsightsExtensionBlade(detailBlade?: string) {

    }

    logAppInsightsError(resourceUri: string, telmetryEvent: string, error: any) {
    }

    logAppInsightsEvent(resourceUri: string, telmetryEvent: string) {
    }

    connectAppInsights(resourceUri: string, appInsightsResourceUri: string, appId: string): Observable<any> {
        return null;
    }

    updateAppInsightsEncryptedAppSettings(encryptedKey: string, appId: string): Observable<any> {
        return null;
    }

    checkAppInsightsAccess(appInsightsResourceUri: string): Observable<boolean> {
        return null;
    }

    getAppInsightsStoredConfiguration(resourceUri: string): Observable<any> {
        return null;
    }

    getAppInsightsApiKeysCount(): Observable<number> {
        return null;
    }

    getAppInsightsConnected(resourceId: string): Observable<boolean> {
        return null;
    }
}

