
import { throwError as observableThrowError, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from "@angular/router";
import { Injectable } from "@angular/core";
import { AdalService } from "adal-angular4";
import { DiagnosticApiService } from '../services/diagnostic-api.service';
import { ApplensAppinsightsTelemetryService } from '../services/applens-appinsights-telemetry.service';

const loginRedirectKey = 'login_redirect';
const postAuthRedirectKey = 'post_auth_redirect';

@Injectable()
export class AadAuthGuard implements CanActivate {
    isAuthorized: Boolean = false;

    constructor(private _router: Router, private _adalService: AdalService, private _diagnosticApiService: DiagnosticApiService, private _applensAITelemetry: ApplensAppinsightsTelemetryService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {
        this._adalService.handleWindowCallback();

        if (!this._adalService.userInfo.authenticated) {
            if (state.url.indexOf('#') === -1) {
                localStorage.setItem(loginRedirectKey, state.url);
                this._router.navigate(['login'])
            }
        }
        else {
            this.clearHash();
            var returnUrl = localStorage.getItem(loginRedirectKey);
            if (returnUrl && returnUrl != '') {
                this._router.navigateByUrl(returnUrl);
                localStorage.removeItem(loginRedirectKey);
            }
            if (this.isAuthorized || state.url.startsWith("/icm/")) {
                return true;
            }
            return this._diagnosticApiService.hasApplensAccess().pipe(map(res => {
                // Application insights initialization call requires user to be authorized first.
                this._applensAITelemetry.initialize();
                this.isAuthorized = true;
                return true;
            }),
                catchError(err => {
                    this.isAuthorized = false;
                    this.saveReturnUrlToStorage(state);
                    if (err.status == 403) {
                        this._router.navigate(['unauthorized']);
                    }
                    else if (err.status == 401) {
                        this._router.navigate(['tokeninvalid']);
                    }
                    else {
                        this._router.navigate(['authRequestFailed']);
                    }
                    return observableThrowError(false);
                }));
        }
    }

    saveReturnUrlToStorage(state: RouterStateSnapshot) {
        if (state.url.indexOf('#') === -1) {
            localStorage.setItem(postAuthRedirectKey, state.url);
        }
    }

    clearHash() {
        if (window.location.hash) {
            if (window.history.replaceState) {
                window.history.replaceState('', '/', window.location.pathname)
            } else {
                window.location.hash = '';
            }
        }
    }
}
