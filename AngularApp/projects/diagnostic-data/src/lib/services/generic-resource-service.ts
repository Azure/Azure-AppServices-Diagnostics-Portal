import { Observable } from "rxjs/Rx";
import { Injectable } from '@angular/core';

@Injectable()
export class GenericResourceService {
    // TODO: Figure out if this can be done with an abstract class
    // Ran into difficulties in Support Center when this was abstract
    // This class is never supposed to be used directly
    // In applens we provide this withValue: applens-diagnostics.service
    // In Support Center we provide this withValue: generic-api.service
    public getPesId(): Observable<string>{
        return Observable.of(null);
    }

    public getSapProductId(): Observable<string>{
        return Observable.of(null);
    }

    public get searchSuffix(): string {
        return "Azure";
    }
}
