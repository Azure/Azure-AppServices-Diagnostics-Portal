import { Injectable, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { AggregatedInsight } from '../../models/optinsights';
import { AppInsightsService } from '../appinsights/appinsights.service';
import { ResourceType, StartupInfo } from '../../models/portal';
import { AuthService } from '../../../startup/services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class OptInsightsService {

  private readonly GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private OAUTH_TOKEN_API: string = "/token";
  private optInsightsRole: string = 'ProfileReader';
  private authEndpoint: "https://management.azure.com"
  private optInsightsResponse: any;
  private aRMToken: string = "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiI5ZDViYjgxZi04YzQwLTRjMDAtOTQzMi1lNmI4ZGI1ZjA2OWEiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC83MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcvIiwiaWF0IjoxNjc5MzI2OTcwLCJuYmYiOjE2NzkzMjY5NzAsImV4cCI6MTY3OTMzMjIwNiwiYWNyIjoiMSIsImFpbyI6IkFWUUFxLzhUQUFBQUR4bGlrbDRocG04bHFHQ3JwNldZWDA2dG5tYXF4b3RNdFVMOEJCeGIybjlsZFdFaTBweE1LcjdMZHk3MkZpbVk5eklraThOa2ZTa0lacXAxWTFGbjJxZlcxeStFTThzcm5Xak82Qmo2Q1k4PSIsImFtciI6WyJyc2EiLCJtZmEiXSwiYXBwaWQiOiI5NWE1ZDk0Yy1hMWEwLTQwZWItYWM2ZC00OGM1YmRlZTk2ZDUiLCJhcHBpZGFjciI6IjIiLCJkZXZpY2VpZCI6ImM5ZjlkZjliLWVjZmUtNDk5YS1iMzhiLTM2YjhlYThhMzcyNCIsImZhbWlseV9uYW1lIjoiVXJpYmUiLCJnaXZlbl9uYW1lIjoiQ3Jpc3RoaWFuIiwiaXBhZGRyIjoiNDcuMTg3LjExMS42MiIsIm5hbWUiOiJDcmlzdGhpYW4gVXJpYmUiLCJvaWQiOiI2MDhkZmFmMy0wN2VhLTQ3MGEtODliNC00ZWE3YjcxYTc0NzUiLCJvbnByZW1fc2lkIjoiUy0xLTUtMjEtMTI0NTI1MDk1LTcwODI1OTYzNy0xNTQzMTE5MDIxLTk1OTE1IiwicHVpZCI6IjEwMDM3RkZFODAxQjEyQUMiLCJyaCI6IjAuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUngtNFc1MUFqQUJNbERMbXVOdGZCcG9hQUVFLiIsInNjcCI6ImRhdGEucmVhZCIsInN1YiI6IjM3eW1JbThKN3NzdHplU05rVElWLXlWSWhDRV9FQUJUeTNtVXBMSzJOOG8iLCJ0aWQiOiI3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDciLCJ1bmlxdWVfbmFtZSI6ImN1cmliZUBtaWNyb3NvZnQuY29tIiwidXBuIjoiY3VyaWJlQG1pY3Jvc29mdC5jb20iLCJ1dGkiOiJ5cFNqaG53RktrZWV6a0IzTjNrMEFBIiwidmVyIjoiMS4wIn0.eubMvHTqsQ49h5TcYX1gO441adZziMN4qaoHYAYzWHZFfFciqMHdmg--CLNnPGnUHdxvnDYuR1uWvlb2wCPg3jGqp12rz1K7_PZ2XksZIr_gR9pkCQywkjocfNrEPudkVSBDe_TJRUgKWfA9yw5sd5IwN4Ajt6_joH9bZI7sISiegQnR-XbYZW2ShsEio0eRvB-_r7pK9Xhrlo20xYJBxuaJN4_ld92Vmid4TQmZeskuioNQUfm-jE5DokvpBGrpH7AV7JLyqdJ99-ouAeckNiytx7fJogbzrKTrbOaHRRKGpSQsZqBZAIh_BMZAaZqI4fSKHQGP9BI_hW4Rci6dNQ";
  //private appInsightsResourceId: string = "/subscriptions/a2c49f0f-548f-4f3b-86a4-39c8eafc0780/resourceGroups/OptInsights/providers/microsoft.insights/components/BishopTrouble";
  loading: boolean;
  dependencies: any = [];

  constructor(private appInsightsService: AppInsightsService, private http: HttpClient, private authService: AuthService) {
  }

  private getARMToken(): Observable<string | null> {
    return this.authService.getStartupInfo().pipe(map((startupInfo: StartupInfo) => {
      if (startupInfo.resourceType === ResourceType.Site) {
        this.aRMToken = startupInfo.token;
        return this.aRMToken;
      }
      else {
        return "";//of(null);
      }
    }));
  }

  private getAppInsightsInfo(): Observable<{ appInsightsResourceId: string, appId: string } | null> {
    return this.appInsightsService.loadAppDiagnosticPropertiesObservable.pipe(map(propertiesLoadStatus => {
      return this.appInsightsService.appInsightsSettings.validForStack;
    }
    ), mergeMap((validForStack: boolean) => {
      if (validForStack) {
        return this.appInsightsService.loadAppInsightsResourceObservable.pipe(map(loadStatus => {
          const appInsightsResourceId = this.appInsightsService.appInsightsSettings.resourceUri;
          const appId = this.appInsightsService.appInsightsSettings.appId;
          return { appInsightsResourceId, appId };
        }));
      }
      else {
        return of(null);
      }
    }));
  }

  private getOAuthAccessToken(_armToken: string, _appInsightsResourceId: string): Observable<string> {
    var _token: string = "";
    const data = `grant_type=password&username=${_appInsightsResourceId}&password=${_armToken}&endpoint=${this.authEndpoint}&role=${this.optInsightsRole}`;
    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      //"Authorization": "" // override the default portal token
    });

    return this.http.post(`${this.GATEWAY_HOST_URL}${this.OAUTH_TOKEN_API}`, data, { headers }).pipe(
      map((response: any) => {
        _token = response.access_token;
        return _token;
      }));
  }

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, appInsightsResourceId: string, appId: string): Observable<AggregatedInsight[]> {
    var _startTime = new Date(-30);
    var _endTime = new Date();
    const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${appId}/aggregatedInsights/timeRange?startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}&role=${this.optInsightsRole}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${oAuthAccessToken}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(query, { headers: headers }).pipe(
      map((aggregatedInsights: AggregatedInsight) => {
        this.optInsightsResponse = aggregatedInsights;
        return this.optInsightsResponse;
      }));
  }


  getInfoForOptInsights(): Observable<AggregatedInsight[] | null> {
    const requests = forkJoin([this.getARMToken(), this.getAppInsightsInfo()]);
    return requests.pipe(mergeMap(res => {
      const armToken = res[0];
      const appInsightInfo = res[1];
      if (armToken === null || appInsightInfo === null || appInsightInfo.appInsightsResourceId === null || appInsightInfo.appId === null) return of(null);
      return this.getOAuthAccessToken(armToken, appInsightInfo.appInsightsResourceId).pipe(map(accessToken => {
        return { accessToken, appInsightInfo };
      }))
    }), mergeMap(res => {
      if (res === null) return of(null);
      return this.getAggregatedInsightsbyTimeRange(res.accessToken, res.appInsightInfo.appInsightsResourceId, res.appInsightInfo.appId);
    }));
  }

}
