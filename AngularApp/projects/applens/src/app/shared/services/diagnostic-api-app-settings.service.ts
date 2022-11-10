import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpMethod } from '../models/http';
import { CacheService } from './cache.service';
import { environment } from '../../../environments/environment';
import { AdalService } from 'adal-angular4';

@Injectable({
  providedIn: 'root'
})
export class DiagnosticApiAppSettingsService {
  public readonly localDiagnosticApi = "http://localhost:5000/";
  public GeomasterServiceAddress: string = null;
  public GeomasterName: string = null;
  public Location: string = null;
  public effectiveLocale: string = "";
  constructor(private _httpClient: HttpClient, private _cacheService: CacheService, private _adalService: AdalService) { }

  public get diagnosticApi(): string {
    return environment.production ? '' : this.localDiagnosticApi;
  }

  public get<T>(path: string, invalidateCache: boolean = false): Observable<T> {
    let url = `${this.diagnosticApi}${path}`;
    let request = this._httpClient.get<T>(url, {
      headers: this._getHeaders()
    });

    return this._cacheService.get(path, request, invalidateCache);
  }

  private _getHeaders(path?: string, method?: HttpMethod, internalClient: boolean = true, internalView: boolean = true, additionalHeaders?: Map<string, string>): HttpHeaders {
    let headers = new HttpHeaders();
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('x-ms-internal-client', String(internalClient));
    headers = headers.set('x-ms-internal-view', String(internalView));

    if (environment.adal.enabled) {
      headers = headers.set('Authorization', `Bearer ${this._adalService.userInfo.token}`)
    }

    if (this.GeomasterServiceAddress)
      headers = headers.set("x-ms-geomaster-hostname", this.GeomasterServiceAddress);

    if (this.GeomasterName)
      headers = headers.set("x-ms-geomaster-name", this.GeomasterName);

    if (path) {
      headers = headers.set('x-ms-path-query', encodeURI(path));
    }

    if (method) {
      headers = headers.set('x-ms-method', HttpMethod[method]);
    }

    if (this.Location) {
      headers = headers.set('x-ms-location', encodeURI(this.Location));
    }

    if (this.isLocalizationApplicable(this.effectiveLocale)) {
      headers = headers.set('x-ms-localization-language', encodeURI(this.effectiveLocale.toLowerCase()));
    }

    if (additionalHeaders) {
      additionalHeaders.forEach((headerVal: string, headerKey: string) => {
        if (headerVal.length > 0 && headerKey.length > 0) {
          headers = headers.set(headerKey, headerVal);
        }
      });
    }

    return headers;
  }

  private isLocalizationApplicable(locale: string): boolean {
    return locale != null && locale != "" && locale != "en" && !locale.startsWith("en");
  }
}
