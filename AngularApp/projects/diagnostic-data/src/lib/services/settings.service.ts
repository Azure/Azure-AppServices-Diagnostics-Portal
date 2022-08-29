import { Injectable } from '@angular/core';
import { Observable, pipe} from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor() { }

  public getUrlToNavigate(): string {
    return null;
   }

   public getScanEnabled(): Observable<boolean>  {
       return null;
   }
}
