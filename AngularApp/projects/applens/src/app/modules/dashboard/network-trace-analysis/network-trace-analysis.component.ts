import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

@Component({
  selector: 'network-trace-analysis',
  templateUrl: './network-trace-analysis.component.html',
  styleUrls: ['./network-trace-analysis.component.scss']
})
export class NetworkTraceAnalysisComponent implements OnInit {
  iframeUrl : SafeResourceUrl;

  constructor(private _diagnosticApi: DiagnosticApiService, public sanitizer:DomSanitizer) { }

  ngOnInit(): void {
    this._diagnosticApi.getAppSetting("NetworkTraceAnalysisTool:APIUrl").subscribe(url => {
      this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    });
  }
}
