import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import {
  SupportBladeDefinitions,
  SupportBladeDefinition,
  BladeOptions
} from '../../../../shared/models/portal';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { PortalActionService } from '../../../../shared/services/portal-action.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';
import { DetectorControlService } from 'diagnostic-data';

declare let d3: any;

@Component({
  templateUrl: 'freb-analysis-detector.component.html',
  styles: ['.row { margin-top: 5px; }']
})
export class FrebAnalysisDetectorComponent extends DetectorViewBaseComponent {
  frebLog: SupportBladeDefinition = SupportBladeDefinitions.FREBLogs;
  eventLog: SupportBladeDefinition = SupportBladeDefinitions.EventViewer;

  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    private _portalActionService: PortalActionService,
    private _windowService: WindowService,
    private _logger: AvailabilityLoggingService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _detectorControlService);
    this.detectorMetricsTitle = 'Failed Request Traces by Status Code';
    this.detectorMetricsDescription =
      'The above graph displays the distribution of failed requests by HTTP status code.';
  }

  openSupportBlade(definition: SupportBladeDefinition) {
    this._logger.LogClickEvent(definition.Identifier, 'FrebAnalysisDetector');
    this._portalActionService.openSupportIFrame(definition);
  }

  openAppInsightsBlade() {
    this._logger.LogClickEvent(
      BladeOptions.applicationInsights,
      'FrebAnalysisDetector'
    );
    this._portalActionService.openAppInsightsBlade();
  }

  openNewTab(url: string) {
    this._logger.LogClickEvent(url, 'FrebAnalysisDetector');
    this._windowService.window.open(url);
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
  }

  static getDetectorName(): string {
    return 'frebanalysis';
  }

  getDetectorName(): string {
    return 'frebanalysis';
  }
}
