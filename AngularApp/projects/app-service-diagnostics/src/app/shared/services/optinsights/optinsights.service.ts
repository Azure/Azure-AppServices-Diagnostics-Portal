import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { OptInsightsOAuthTokenService } from './optinsights-oauth-token.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OptinsightsService {

  private GATEWAY_HOST_URL: string = "https://gateway.azureserviceprofiler.net";
  private optInsightsOAuthToken: string = "";
  private optInsightsRole: string = 'ProfileReader';
  private optInsightsResponse: any;
  constructor(private http: HttpClient, private optInsightsOAuthTokenService: OptInsightsOAuthTokenService) { 
    this.optInsightsOAuthTokenService.getAccessToken().subscribe((accessToken: any) => {
      this.optInsightsOAuthToken = accessToken;
    });
  }

  getAggregatedInsightsbyTimeRange(startTimeUTC: string, endtimeUTC: string): Observable<any> {
    const query: string = `https://gateway.azureserviceprofiler.net/api/aggregatedInsights/timeRange?startTime=${startTimeUTC}&endTime=${endtimeUTC}&role=${this.optInsightsRole}`;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.optInsightsOAuthToken}`,
      'Content-Type': 'application/json'
    });
    return this.http.get(query, { headers: headers }).pipe(
      map((aggregatedInsights: any) => {
        this.optInsightsResponse = aggregatedInsights;
        return this.optInsightsResponse;
      }));    
  }  
}
