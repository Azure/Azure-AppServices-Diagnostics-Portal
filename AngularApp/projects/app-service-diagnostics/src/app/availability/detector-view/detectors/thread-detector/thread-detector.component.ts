import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import { ChartType } from '../../../../shared/models/chartdata';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';
declare let d3: any;

@Component({
  templateUrl: '../../detector-view-base/detector-view-base.component.html',
  styles: ['.row { margin-top: 5px; }']
})
export class ThreadDetectorComponent extends DetectorViewBaseComponent {
  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _detectorControlService);
    this.detectorMetricsTitle = 'App Process Thread Count per Instance';
    this.metricsChartType = ChartType.lineChart;
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
  }

  static getDetectorName(): string {
    return 'threadcount';
  }

  getDetectorName(): string {
    return 'threadcount';
  }
}
