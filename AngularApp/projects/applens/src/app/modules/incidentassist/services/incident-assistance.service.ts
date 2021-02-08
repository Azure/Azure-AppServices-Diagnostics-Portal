import { AdalService } from 'adal-angular4';
import { TelemetryService } from 'diagnostic-data';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable} from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

@Injectable()
export class IncidentAssistanceService {

  public readonly localDiagnosticApi = "http://localhost:5000/";
  
  constructor(private _httpClient: HttpClient, private _adalService: AdalService, private _telemetryService: TelemetryService, private _router: Router) { }

  public get diagnosticApi(): string {
    return environment.production ? '' : this.localDiagnosticApi;
  }

  public isIncidentAssistanceEnabled(): Observable<any> {
    let url = `${this.diagnosticApi}api/icm/isFeatureEnabled`;
    let request = this._httpClient.get<HttpResponse<Object>>(url, {
      headers: this._getHeaders(),
      observe: 'response'
    });
    return request;
  }

  public getIncident(incidentId: string): Observable<any> {
    let url = `${this.diagnosticApi}api/icm/getIncident/${incidentId}`;
    let request = this._httpClient.get<HttpResponse<Object>>(url, {
      headers: this._getHeaders(),
      observe: 'response'
    });
    return request;
  }

  public validateAndUpdateIncident(body: any): Observable<any> {
    let url = `${this.diagnosticApi}api/icm/validateAndUpdateIncident`;
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
      headers = headers.set('Authorization', `Bearer ${this._adalService.userInfo.token}`)
    }
    return headers;
  }
}