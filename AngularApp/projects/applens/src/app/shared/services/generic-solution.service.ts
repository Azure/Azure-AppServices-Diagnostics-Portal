import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GenericSolutionService {
  ArmApi(resourceUri: string, actionOptions: {}): Observable<any> {
    return of('Not implemented');
  }

  OpenTab(resourceUri: string, actionOptions: {}): Observable<any> {
    return of('Not implemented');
  }

  GoToBlade(resourceUri: string, actionOptions: {}): Observable<any> {
    return of('Not implemented');
  }

  ToggleStdoutSetting(resourceUri: string, actionOptions: {}): Observable<any> {
    return of('Not implemented');
  }
}
