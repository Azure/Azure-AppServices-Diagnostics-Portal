import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

@Injectable()
export class GenericUserSettingService {
  getExpandAnalysisCheckCard(): Observable<boolean> {
    return of(false);
  }

  isWaterfallViewMode(): Observable<boolean> {
    return of(false);
  }

  getUserSetting(): Observable<any> {
    return of(null);
  }

  isWaterfallViewSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
}
