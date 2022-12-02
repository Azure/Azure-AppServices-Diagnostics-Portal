import { AdalService } from 'adal-angular4';
import { TelemetryService } from 'diagnostic-data';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class SurveysService {
  public readonly localDiagnosticApi = 'http://localhost:5000/';

  constructor(
    private _httpClient: HttpClient,
    private _adalService: AdalService,
    private _telemetryService: TelemetryService,
    private _router: Router
  ) {}

  public get diagnosticApi(): string {
    return environment.production ? '' : this.localDiagnosticApi;
  }

  public isSurveyFeatureEnabled(): Observable<any> {
    let url = `${this.diagnosticApi}api/surveys/isFeatureEnabled`;
    let request = this._httpClient.get<HttpResponse<Object>>(url, {
      headers: this._getHeaders(),
      observe: 'response'
    });
    return request;
  }

  public getSurvey(caseId: string): Observable<any> {
    let url = `${this.diagnosticApi}api/surveys/getSurvey/${caseId}`;
    let request = this._httpClient.get<HttpResponse<Object>>(url, {
      headers: this._getHeaders(),
      observe: 'response'
    });
    return request;
  }

  public submitSurvey(body: any): Observable<any> {
    let url = `${this.diagnosticApi}api/surveys/submitSurvey`;
    let request = this._httpClient.post<HttpResponse<Object>>(url, body, {
      headers: this._getHeaders(),
      observe: 'response'
    });
    return request;
  }

  private _getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    if (environment.adal.enabled) {
      headers = headers.set(
        'Authorization',
        `Bearer ${this._adalService.userInfo.token}`
      );
    }
    return headers;
  }
}
