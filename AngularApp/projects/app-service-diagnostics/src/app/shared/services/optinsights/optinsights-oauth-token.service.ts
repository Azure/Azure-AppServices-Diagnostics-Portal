import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../startup/services/auth.service';
import { StartupInfo } from '../../models/portal';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OptinsightsOauthTokenService {

  private GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  public resourceId: string;
  public loadAppInsightsResourceObservable: BehaviorSubject<boolean>;
  
  constructor(private http: HttpClient, private authService: AuthService) { 
    this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
      this.resourceId = startupInfo.resourceId;
      this.loadAppInsightsResourceObservable = new BehaviorSubject<boolean>(null);
    }
  }

  getAccessToken(resourceId: string, password: string) {
    const credentials = {
      grant_type: 'password',
      username: resourceId,
      password: password
    };
  }
}
