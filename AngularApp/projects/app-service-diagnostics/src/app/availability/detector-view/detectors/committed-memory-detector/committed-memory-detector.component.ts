import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import { ChartType } from '../../../../shared/models/chartdata';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';

declare let d3: any;

@Component({
  templateUrl: 'committed-memory-detector.component.html'
})
export class CommittedMemoryUsageComponent extends DetectorViewBaseComponent {
  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _detectorControlService);
    this.detectorMetricsTitle = 'Committed MBytes per Instance';
    this.detectorMetricsDescription =
      'Committed MBytes is the amount of committed virtual memory, in MegaBytes. Committed memory is the physical memory which has space reserved on the disk paging file(s).';
    this.metricsChartType = ChartType.lineChart;
  }

  static getDetectorName(): string {
    return 'committedmemoryusage';
  }

  getDetectorName(): string {
    return 'committedmemoryusage';
  }
}
