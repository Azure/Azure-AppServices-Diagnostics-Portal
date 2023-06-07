import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, flatMap, map, mergeMap, retry, take, tap } from 'rxjs/operators';
import { ScopeAuthorizationToken } from '../../models/portal';
import { PortalService } from '../../../startup/services/portal.service';
import { CacheService } from '../cache.service';
import { OperatingSystem } from 'projects/app-service-diagnostics/src/app/shared/models/site';
import { WebSitesService } from 'projects/app-service-diagnostics/src/app/resources/web-sites/services/web-sites.service';
import { ResourceService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/resource.service';
import { AppType } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { Sku } from 'projects/app-service-diagnostics/src/app/shared/models/server-farm';
import { CodeOptimizationsRequest, CodeOptimizationsLogEvent, CodeOptimizationType, DetectorControlService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import * as moment from 'moment';


interface IssueData {
  [issueId: string]: string;
}

@Injectable()
export class OptInsightsService {

  private readonly GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private readonly OAUTH_TOKEN_API: string = "/token";
  private readonly optInsightsRole: string = 'ProfileReader';
  private readonly authEndpoint: string = "https://management.azure.com"
  private readonly timeRangeAPIVersion: string = "api-version=2023-03-19-preview"
  private optInsightsResponse: any;
  isEnabledInProd: boolean = true;
  loading: boolean;
  dependencies: any = [];
  appInsightsValidationError: string;
  isAppInsightsEnabled: boolean = false;
  appInsightsResourceUri: string = "";
  appId: string = "";
  error: any;
  subscriptionId: string;
  resourcePlatform: OperatingSystem = OperatingSystem.any;
  resourceAppType: AppType = AppType.WebApp;
  resourceSku: Sku = Sku.All;
  site: any;
  startTime: string;
  endTime: string;
  OPIResources: any = [];



  constructor(private http: HttpClient, private _portalService: PortalService, private _cache: CacheService, private telemetryService: TelemetryService, private _resourceService: ResourceService, private _detectorControlService: DetectorControlService) {
  }

  private getARMToken(): Observable<string | null> {
    const scope: ScopeAuthorizationToken = { resourceName: "profile" };
    return this._portalService.getScopedToken(scope).pipe(take(1), map(data => {
      let authData = JSON.parse(data);
      if (!authData.error) {
        let scopedToken = authData.token
        let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
          resourceUri: this.appInsightsResourceUri,
          telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsARMTokenSuccessful
        };
        this.logOptInsightsEvent(codeOptimizationsLogEvent);
        return scopedToken;
      }
      else {
        let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
          resourceUri: this.appInsightsResourceUri,
          telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsARMTokenFailure,
          error: authData.error
        };
        this.logOptInsightsEvent(codeOptimizationsLogEvent);
        return null;
      }
    }));
  }

  private getOAuthAccessToken(_armToken: string, _appInsightsResourceId: string): Observable<string> {
    var _token: string = "";
    const data = `grant_type=password&username=${_appInsightsResourceId}&password=Bearer ${_armToken}&endpoint=${this.authEndpoint}&role=${this.optInsightsRole}`;
    const headers = new HttpHeaders({
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "" // override the default portal token
    });
    return this.http.post(`${this.GATEWAY_HOST_URL}${this.OAUTH_TOKEN_API}`, data, { headers }).pipe(
      map((response: any) => {
        _token = response.access_token;
        let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
          resourceUri: this.appInsightsResourceUri,
          telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsOAuthAccessTokenSuccessful
        };
        this.logOptInsightsEvent(codeOptimizationsLogEvent);
        return _token;
      }, (error: any) => {
        this.error = error;
        let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
          resourceUri: this.appInsightsResourceUri,
          telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsOAuthAccessTokenFailure,
          error: error
        };
        this.logOptInsightsEvent(codeOptimizationsLogEvent);
      }));
  }

  getAggregatedInsightsbyTimeRange(oAuthAccessToken: string, codeOptimizationsRequest: CodeOptimizationsRequest): Observable<any[]> {
    const _startTime = codeOptimizationsRequest.startTime.clone();
    const _endTime = codeOptimizationsRequest.endTime.clone();

    const query: string = `${this.GATEWAY_HOST_URL}/api/apps/${codeOptimizationsRequest.appId}/aggregatedInsights/timeRange?${this.timeRangeAPIVersion}&startTime=${_startTime.toISOString()}&endTime=${_endTime.toISOString()}&roleName=${codeOptimizationsRequest.site}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${oAuthAccessToken}`,
      'Content-Type': 'application/json'
    });
    const request = this.http.get(query, { headers: headers }).pipe(
      retry(2),
      mergeMap((aggregatedInsights: any) => {
        return this.getOPIResources(false).pipe(map((oPIResources: any) => { 
          return { aggregatedInsights, oPIResources } 
        }));
      }),
      map((response) => {        
          this.optInsightsResponse = this.parseRowsIntoTable(response.aggregatedInsights, response.oPIResources);
          let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
            resourceUri: this.appInsightsResourceUri,
            telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeSuccessful,
            totalInsights: response.aggregatedInsights.length
          };
          this.logOptInsightsEvent(codeOptimizationsLogEvent);
        }),
        catchError(error => {
          let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
            resourceUri: this.appInsightsResourceUri,
            telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeFailure,
            error: error
          };
          this.logOptInsightsEvent(codeOptimizationsLogEvent);
          return throwError(error);          
      }),
        
        );
    return this._cache.get(query, request, codeOptimizationsRequest.invalidateCache);
  }

  getOPIResources(invalidateCache: boolean): Observable<any[]> {
    const query = 'assets/OPIResources.json';
    const oPIResourcesRequest = this.http.get<any>(query).pipe(
      retry(2),
      map((oPIResources: any) => {
        return oPIResources;
      },
        (error: any) => {
          this.error = error;
          let codeOptimizationsLogEvent: CodeOptimizationsLogEvent = {
            resourceUri: this.appInsightsResourceUri,
            telemetryEvent: TelemetryEventNames.AICodeOptimizerInsightsFailureGettingOPIResources,
            error: error
          };
          this.logOptInsightsEvent(codeOptimizationsLogEvent);
        }));
    return this._cache.get(query, oPIResourcesRequest, invalidateCache);
  }

  parseRowsIntoTable(rows: any, oPIResources: any) {
    let table: any = [];
    if (!rows || rows.length === 0) {
      return table;
    }
    rows.forEach(element => {
      table.push({
        type: element.issueCategory,
        issue: `${oPIResources[element.issueId]?.title || this.defaultStrings(element.issueCategory, element.function)}`,
        component: element.function,
        count: element.count,
        impact: `${element.value.toFixed(2)}%`,
        role: element.roleName,
      });
    });
    return table;
  }

  getIssueStrings(issueId: string): any | undefined {
    if (this.OPIResources.hasOwnProperty(issueId)) {
      return this.OPIResources[issueId];
    }
    return undefined;
  }

  defaultStrings(type: CodeOptimizationType, functionName: string): string {
    switch (type) {
      case CodeOptimizationType.CPU:
        return `${functionName} is causing high CPU usage`;
      case CodeOptimizationType.Memory:
        return `Excessive allocations due to ${functionName}`;
      case CodeOptimizationType.Blocking:
        return `Excessive thread blocking by ${functionName}`;
      default:
        return `Issue caused by ${functionName}`;
    }
  }

  getTopTypeByImpact(array: any, type: CodeOptimizationType, top: number): any {
    var result: any[];
    if (type == CodeOptimizationType.All) {
      result = array;
    }
    else {
      result = array.filter(insight => insight.type == CodeOptimizationType[type]);
    }
    if (result.length == 1) {
      return result;
    }
    else {
      if (result.length == 0) {
        result = array;
      }
      return result
        .sort((a, b) => (Number(b.impact.replace("%", ""))) - (Number(a.impact.replace("%", ""))))
        .slice(0, top);
    }
  }

  getInfoForOptInsights(codeOptimizationsRequest: CodeOptimizationsRequest): Observable<any[] | null> {
    this.appInsightsResourceUri = codeOptimizationsRequest.appInsightsResourceId;
    this.site = codeOptimizationsRequest.site;
    return this.getARMToken().pipe(
      (mergeMap(aRMToken => {
        if (aRMToken === null || codeOptimizationsRequest.appInsightsResourceId === null || codeOptimizationsRequest.appId === null) return of(null);
        return this.getOAuthAccessToken(aRMToken, codeOptimizationsRequest.appInsightsResourceId).pipe(map(accessToken => {
          return accessToken;
        }), mergeMap(accessToken => {
          if (accessToken === null || codeOptimizationsRequest.appInsightsResourceId === null || codeOptimizationsRequest.appId === null) return of(null);
          return this.getAggregatedInsightsbyTimeRange(accessToken, codeOptimizationsRequest);
        }), mergeMap(aggregatedInsights => {
          if (this.optInsightsResponse.length <= 1) {
            return this.optInsightsResponse;
          }
          else {
            if (codeOptimizationsRequest.type != undefined) {
              return of(this.getTopTypeByImpact(this.optInsightsResponse, codeOptimizationsRequest.type, 3));
            }
            else {
              return of(this.getTopTypeByImpact(this.optInsightsResponse, CodeOptimizationType.All, 3));
            }
          }
        }));
      })));
  }

  logOptInsightsEvent(codeOptimizationsLogEvent: CodeOptimizationsLogEvent) {
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    this.startTime = this._detectorControlService.startTime.toISOString();
    this.endTime = this._detectorControlService.endTime.toISOString();
    const aICodeEventProperties = {
      'Site': codeOptimizationsLogEvent.site != undefined ? codeOptimizationsLogEvent.site : this.site != undefined ? `${this.site}` : "",
      'AppInsightsResourceUri': `${codeOptimizationsLogEvent.resourceUri}`,
      'Platform': this.resourcePlatform != undefined ? `${this.resourcePlatform}` : "",
      'AppType': this.resourceAppType != undefined ? `${this.resourceAppType}` : "",
      'ResourceSku': this.resourceSku != undefined ? `${this.resourceSku}` : "",
      'StartTime': this.startTime != undefined ? `${this.startTime}` : "",
      'EndTime': this.endTime != undefined ? `${this.endTime}` : "",
      'Error': codeOptimizationsLogEvent.error != undefined ? `${codeOptimizationsLogEvent.error}` : "",
      'TotalInsights': codeOptimizationsLogEvent.totalInsights != undefined ? `${codeOptimizationsLogEvent.totalInsights}` : ""
    };
    this.telemetryService.logEvent(codeOptimizationsLogEvent.telemetryEvent, aICodeEventProperties);
  }
}