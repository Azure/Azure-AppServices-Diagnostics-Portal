import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IDetectorResponse } from '../../../../shared/models/detectorresponse';
import { DetectorViewBaseComponent } from '../../detector-view-base/detector-view-base.component';
import { GraphHelper } from '../../../../shared/utilities/graphHelper';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';

declare let d3: any;

@Component({
  templateUrl: 'docker-container-start-stop-detector.component.html',
  styles: ['.row { margin-top: 5px; }']
})
export class DockerContainerIntializationComponent extends DetectorViewBaseComponent {
  showMetadata: boolean;

  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _detectorControlService);
    this.detectorMetricsTitle = 'Docker Container Intialization';
    this.detectorMetricsDescription =
      'The above graph displays when container started, stopped or failed to start';
    this.showMetadata = false;
    this.chartOptions = GraphHelper.getDefaultChartOptions();
    this.chartOptions.chart.useInteractiveGuideline = false;
    this.chartOptions.chart.yAxis.tickFormat = d3.format('d');
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
    this.showMetadata =
      this.detectorResponse && this.detectorResponse.data.length > 0;
  }

  static getDetectorName(): string {
    return 'dockercontainerstartstop';
  }

  getDetectorName(): string {
    return 'dockercontainerstartstop';
  }

  formatDate(dateString: string): string {
    var date = new Date(dateString);

    return (
      date.getUTCMonth() +
      '/' +
      date.getUTCDate() +
      ' ' +
      (date.getUTCHours() < 10 ? '0' : '') +
      date.getUTCHours() +
      ':' +
      (date.getUTCMinutes() < 10 ? '0' : '') +
      date.getUTCMinutes() +
      ':' +
      (date.getUTCSeconds() < 10 ? '0' : '') +
      date.getUTCSeconds()
    );
  }
}
