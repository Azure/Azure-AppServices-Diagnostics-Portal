import {Component, OnInit} from '@angular/core';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { Router, ActivatedRoute } from '@angular/router';

const postAuthRedirectKey = 'post_auth_redirect';

@Component({
    selector: 'app-unauthorized',
    templateUrl: './unauthorized.component.html',
    styleUrls: ['./unauthorized.component.scss']
  })
export class UnauthorizedComponent implements OnInit {
    temporaryAccessFailed: boolean = false;
    accessFailedReason: string = "";
    temporaryAccessSucceeded: boolean = false;
    temporaryAccessSuccessMessage: string = "";
    isDurianEnabled: boolean = false;

    public constructor(private _router: Router, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute){
      
    }
    ngOnInit(){
      this._activatedRoute.snapshot.queryParams['isDurianEnabled'] ? this.isDurianEnabled = true : this.isDurianEnabled = false;
    }

    navigateToRedirectUrl(){
      var returnUrl = localStorage.getItem(postAuthRedirectKey);
      if (returnUrl && returnUrl != '') {
          this._router.navigateByUrl(returnUrl);
          localStorage.removeItem(postAuthRedirectKey);
      }
      else{
          this._router.navigateByUrl('/');
      }
    }

    requestTemporaryAccess(){
      this._diagnosticApiService.requestTemporaryAccess().subscribe(res => {
        this.temporaryAccessSuccessMessage = res;
        this.temporaryAccessSucceeded = true;
        setTimeout(() => {
          this.navigateToRedirectUrl();
        }, 2000);
      },
      (err) => {
        this.temporaryAccessFailed = true;
        this.accessFailedReason = err.error;
      });
    }
}