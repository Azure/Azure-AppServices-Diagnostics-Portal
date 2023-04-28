import { AdalService } from 'adal-angular4';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

@Component({
  selector: 'network-trace-analysis',
  templateUrl: './network-trace-analysis.component.html',
  styleUrls: ['./network-trace-analysis.component.scss']
})
export class NetworkTraceAnalysisComponent implements OnInit {
  iframeUrl : SafeResourceUrl;
  userId: string = "";

  constructor(private _diagnosticApi: DiagnosticApiService, private _adalService: AdalService, public sanitizer:DomSanitizer) {
    if (environment.adal.enabled) {
      let alias: string = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
      this.userId = alias.replace('@microsoft.com', '');
    }
   }

  ngOnInit(): void {
    this._diagnosticApi.getAppSetting("NetworkTraceAnalysisTool:APIUrl").subscribe(url => {
      this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${url}?userId=${this.userId}`);
    });
  }
}
