import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';

declare let d3: any;

@Component({
  templateUrl: 'aspnetcore-detector.component.html',
  styles: ['.row { margin-top: 5px; }']
})
export class AspNetCoreComponent extends DetectorViewBaseComponent {
  showMetadata: boolean;

  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _detectorControlService);
    this.detectorMetricsTitle = 'AspNetCore Error Timeline';
    this.detectorMetricsDescription =
      'The above graph displays events via event log';
    this.showMetadata = false;
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
    this.showMetadata =
      this.detectorResponse && this.detectorResponse.data.length > 0;
  }

  static getDetectorName(): string {
    return 'aspnetcore';
  }

  getDetectorName(): string {
    return 'aspnetcore';
  }
}
