import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolutionService {
  ArmApi(resourceUri: string, actionOptions: {}): Observable<any> {
    return null;
  }

  OpenTab(resourceUri: string, actionOptions: {}): Observable<any> {
    return null;
  }

  GoToBlade(resourceUri: string, actionOptions: {}): Observable<any> {
    return null;
  }

  ToggleStdoutSetting(resourceUri: string, actionOptions: {}): Observable<any> {
    return null;
  }
}
