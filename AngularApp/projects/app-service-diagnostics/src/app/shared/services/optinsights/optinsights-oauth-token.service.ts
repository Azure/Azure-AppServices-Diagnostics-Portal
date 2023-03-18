import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../startup/services/auth.service';
import { StartupInfo } from '../../models/portal';
import { DiagnosticDataConfig,  } from 'diagnostic-data';
import { AppInsightsService } from '../appinsights/appinsights.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class OptInsightsOAuthTokenService {

  private GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private optInsightsRole: string = 'ProfileReader';
  subscriptionId: string;
  resourceGroup: string;
  siteName: any;
  slotName: any;
  appInsightsResourceId: string;
  appInsightsAppId: any;
  armToken: string;
  oAuthToken: string;
  isPublic: boolean;
  isAppInsightsEnabled: boolean = false;
  appInsightsResourceUri: string = "";
  appId: string = "";
  isEnabledInProd: boolean = true;
  appInsightsValidationError = "";
    
  constructor(public appInsightsService: AppInsightsService, private http: HttpClient, private authService: AuthService, 
    config: DiagnosticDataConfig) {    
    this.isPublic = config && config.isPublic;    
  }

  ngOnInit() {
    if (this.appInsightsService.appInsightsSettings.enabledForWebApp) {
        this.appInsightsResourceId = this.appInsightsService.appInsightsSettings.resourceUri;
        this.appInsightsAppId = this.appInsightsService.appInsightsSettings.appId;
    }
    else{
      return this.oAuthToken = "";
    }
    this.authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
      this.armToken = startupInfo.token;
    });
  }


  getAccessToken(): Observable<string> {
    const data = {
      grant_type: 'password',
      username: this.appInsightsResourceId,
      password: this.armToken,
      role: this.optInsightsRole
      }
    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
       "Authorization": "" // override the default portal token
    });

    return this.http.post(this.GATEWAY_HOST_URL, data, { headers }).pipe(
      map((data: any) => {
        return data.access_token;}));
  }
}
