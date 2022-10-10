
import { throwError as observableThrowError, of as observableOf, Observable, Subscription as RxSubscription, Subject, ReplaySubject } from 'rxjs';

import { tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { TelemetryService, TelemetryPayload } from 'diagnostic-data';

interface CacheContent {
    value: any;
}

@Injectable()
export class CacheService {
    private cache: Map<string, CacheContent> = new Map<string, CacheContent>();
    private inFlightObservables: Map<string, Subject<any>> = new Map<string, Subject<any>>();

    // This is useful to enable if you are trying to test and make sure this service is working properly
    private enableConsoleLogging: boolean = false;

    constructor() { }

    get(key: string, fallback?: Observable<any>, invalidateCache: boolean = false, logDataForActualCall?: TelemetryPayload): Observable<any> | Subject<any> {

        if (this.has(key)) {
            if (invalidateCache) {
                this.log(`%cInvalidating ${key}`, 'color: orange');
                this.cache.delete(key);
            }
            else {
                this.log(`%cGetting from cache ${key}`, 'color: green');
                return observableOf(this.cache.get(key).value);
            }
        }

        if (this.inFlightObservables.has(key)) {
            return this.inFlightObservables.get(key);
        } else if (fallback && fallback instanceof Observable) {

            this.inFlightObservables.set(key, new Subject());
            this.log(`%c Calling api for ${key}`, 'color: purple');
            if (!!logDataForActualCall && !!logDataForActualCall.eventIdentifier && !!logDataForActualCall.eventPayload) {
                //this._telemetryService.logEvent(logDataForActualCall.eventIdentifier, logDataForActualCall.eventPayload);
            }
            return fallback.pipe(tap((value) => { this.set(key, value); }, error => this.inFlightObservables.delete(key)));
        } else {
            return observableThrowError('Requested key is not available in Cache');
        }
    }

    private set(key: string, value: any): void {
        this.cache.set(key, { value: value });
        this.notifyInFlightObservers(key, value);
    }

    private has(key: string): boolean {
        return this.cache.has(key);
    }

    private log(message: string, color: string) {
        if (this.enableConsoleLogging && !environment.production) {
            console.log(message, color);
        }
    }

    private notifyInFlightObservers(key: string, value: any): void {
        if (this.inFlightObservables.has(key)) {
            const inFlight = this.inFlightObservables.get(key);
            const observersCount = inFlight.observers.length;
            if (observersCount) {
                this.log(`%cNotifying ${inFlight.observers.length} flight subscribers for ${key}`, 'color: blue');
                inFlight.next(value);
            }
            inFlight.complete();
            this.inFlightObservables.delete(key);
        }
    }
}
