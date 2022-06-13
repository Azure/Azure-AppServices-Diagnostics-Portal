import { Component, OnInit } from '@angular/core';
import { TelemetryService } from 'diagnostic-data';
import { DiagnosticApiService } from '../services/diagnostic-api.service';

@Component({
  selector: 'applens-preview-banner',
  templateUrl: './applens-preview-banner.component.html',
  styleUrls: ['./applens-preview-banner.component.scss']
})
export class ApplensBannerComponent implements OnInit {
  public showBanner: boolean = this._diagnosticApiService.caseNumberNeededForUser;
  private url: URL = new URL(window.location.href);
  private readonly prodHostName = "applens.trafficmanager.net";
  private readonly previewHostName = "applens-preview.trafficmanager.net";
  public isPreview: boolean = true;
  constructor(private _telemetryService: TelemetryService, private _diagnosticApiService: DiagnosticApiService) {
    this._diagnosticApiService.getCaseNumberNeededForUser().subscribe(res => {
      this.showBanner = this._diagnosticApiService.caseNumberNeededForUser;
    });
  }

  ngOnInit() {}

  switchView(event: Event) {
    event.stopPropagation();
    const url = this.url;
    this._telemetryService.logEvent("SwitchApplensSlot", {
      currentSlot: this.isPreview ? "Preview" : "Prod",
      url: window.location.href
    });

    url.hostname = this.isPreview ? this.prodHostName : this.previewHostName;
    url.port = "";
    window.location.href = url.href;
  }

  emailToApplensTeam(event: Event) {
    event.stopPropagation();

    const body = encodeURIComponent('Current site: ' + window.location.href + '\n' + 'Please provide feedback here:');
    const subject = `Feedback for AppLens Secure Preview`;
    const link = `mailto:applensv2team@microsoft.com?subject=${subject}&body=${body}`;
    window.open(link);
  }

}
