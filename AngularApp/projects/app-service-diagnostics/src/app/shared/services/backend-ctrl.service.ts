
import { mergeMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CacheService } from '../../shared/services/cache.service';
import { AuthService } from '../../startup/services/auth.service';
import { StartupInfo } from '../../shared/models/portal';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class BackendCtrlService {

  constructor(private _http: HttpClient, private _cacheService: CacheService, private _authService: AuthService) { }

  public get apiEndpoint(): string {
    return environment.backendHost;
  }

  public get<T>(path: string, headers: HttpHeaders = null, invalidateCache: boolean = false): Observable<T> {

    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        const url = `${this.apiEndpoint}${path}`;

        const request = this._http.get(url, {
          headers: this._getHeaders(startupInfo, headers)
        });

        return this._cacheService.get(path, request, invalidateCache);
      }));
  }

  public put<T, S>(path: string, body?: S, headers: HttpHeaders = null): Observable<T> {

    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        const url = `${this.apiEndpoint}${path}`;
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.put(url, bodyString, {
          headers: this._getHeaders(startupInfo, headers)
        });

        return this._cacheService.get(path, request, true);
      }));
  }

  public post<T, S>(path: string, body?: S, headers: HttpHeaders = null): Observable<T> {

    return this._authService.getStartupInfo().pipe(
      mergeMap((startupInfo: StartupInfo) => {
        const url = `${this.apiEndpoint}${path}`;
        let bodyString: string = '';
        if (body) {
            bodyString = JSON.stringify(body);
        }

        const request = this._http.post(url, bodyString, {
          headers: this._getHeaders(startupInfo, headers)
        });

        return this._cacheService.get(path, request, true);
      }));
  }

  private _getHeaders(startupInfo: StartupInfo, additionalHeaders: HttpHeaders): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (additionalHeaders) {
      additionalHeaders.keys().forEach(key => {
        if (!headers.has(key)) {
          headers = headers.set(key, additionalHeaders.get(key));
        }
      });
    }
    return headers;
  }
}
