import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";

@Injectable()
export class GenericPortalService {
    getStartupInfo(): Observable<any> {
        return of(null);
    }
}