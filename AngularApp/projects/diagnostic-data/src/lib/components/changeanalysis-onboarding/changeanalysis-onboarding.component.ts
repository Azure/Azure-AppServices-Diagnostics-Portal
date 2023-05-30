import { Component, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse } from '../../models/detector';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { SettingsService} from '../../services/settings.service';
@Component({
  selector: 'changeanalysis-onboarding',
  templateUrl: './changeanalysis-onboarding.component.html',
  styleUrls: ['./changeanalysis-onboarding.component.scss',
  '../../scss/insights.scss'],
})

export class ChangeAnalysisOnboardingComponent extends DataRenderBaseComponent {
  onboardingText: string = "";
  isPublic: boolean;
  renderingProperties: Rendering;
  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService,
  private activatedRoute: ActivatedRoute, private router: Router, private settingsService: SettingsService) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
   }

   protected processData(data: DiagnosticData) {
     super.processData(data);
     this.renderingProperties = <Rendering>data.renderingProperties;
     this.parseData(data.table);
   }

   private parseData(data: DataTableResponseObject) {
     let rows = data.rows;
     if (rows.length > 0 && rows[0].length > 0) {
       this.onboardingText = rows[0][0];
     }
     if(!this.onboardingText) {
       this.onboardingText = this.isPublic ? "Enable Change Analysis to investigate the changes made to your web application." : "Change Analysis is not enabled. Contact your customer to enable Change Analysis."
     }
   }

   navigateToSettings(): void {
       this.logEnablementClick();
        let path = this.settingsService.getUrlToNavigate();
        this.router.navigateByUrl(path);
   }

   logEnablementClick(): void {
       let eventProps = {
           'detector': this.detector
       };
       this.telemetryService.logEvent(TelemetryEventNames.ChangeAnalysisEnableClicked, eventProps);
   }
}
