import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IDetectorResponse,
  IMetricSet
} from '../../../shared/models/detectorresponse';
import { ChartType } from '../../../shared/models/chartdata';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { DetectorControlService } from 'diagnostic-data';
import { BehaviorSubject } from 'rxjs';
declare let d3: any;

@Component({
  templateUrl: 'detector-view-base.component.html',
  styles: ['.row { margin-top: 10px; }']
})
export class DetectorViewBaseComponent implements OnInit {
  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
  slotName: string;
  detectorName: string;
  topLevelDetector: string = 'runtimeavailability';
  category: string = 'availability';

  detectorResponse: IDetectorResponse;
  detectorMetrics: IMetricSet[];
  detectorMetricsTitle: string;
  detectorMetricsYAxisLabel: string;
  detectorMetricsDescription: string;

  chartOptions: any;

  isHealthyNow: boolean = true;

  metricsChartType: ChartType = ChartType.multiBarChart;

  setFirstValue: boolean;

  private detectorResponseSubject: BehaviorSubject<IDetectorResponse> =
    new BehaviorSubject<IDetectorResponse>(null);

  @Input() set detectorResponseObject(value: IDetectorResponse) {
    this.detectorResponseSubject.next(value);
  }

  @Input() loading: boolean;

  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _detectorControlService: DetectorControlService
  ) {
    this.detectorMetricsYAxisLabel = 'Count';
  }

  ngOnInit(): void {
    this.detectorName = this.getDetectorName();
    if (this._route.parent.snapshot.params['subscriptionid'] != null) {
      this.subscriptionId =
        this._route.parent.snapshot.params['subscriptionid'];
      this.resourceGroup = this._route.parent.snapshot.params['resourcegroup'];
      this.siteName = this._route.snapshot.params['resourcename'];
      this.slotName = this._route.snapshot.params['slot']
        ? this._route.snapshot.params['slot']
        : '';
    } else if (this._route.snapshot.params['subscriptionid'] != null) {
      this.subscriptionId = this._route.snapshot.params['subscriptionid'];
      this.resourceGroup = this._route.snapshot.params['resourcegroup'];
      this.siteName = this._route.snapshot.params['resourcename'];
      this.slotName = this._route.snapshot.params['slot']
        ? this._route.snapshot.params['slot']
        : '';
    }

    this.detectorResponseSubject.subscribe((response) => {
      if (this.setFirstValue && !response) {
        this.refresh();
      }

      if (response) {
        this.setFirstValue = true;
        this.processDetectorResponse(response);
      }
    });
  }

  protected refresh() {
    this.detectorResponse = null;
    this.detectorMetrics = null;
  }

  processTopLevelDetectorResponse(response: IDetectorResponse) {
    let currentAppHealth = response.data[0].find(
      (p) => p.name.toLowerCase() === 'currentapphealth'
    );
    if (
      currentAppHealth &&
      currentAppHealth.value.toLowerCase() === 'unhealthy'
    ) {
      this.isHealthyNow = false;
    }
  }

  processDetectorResponse(response: IDetectorResponse) {
    this.detectorResponse = response;
    this.detectorMetrics = response.metrics;
    this.detectorMetricsTitle =
      this.detectorMetricsTitle != undefined && this.detectorMetricsTitle != ''
        ? this.detectorMetricsTitle
        : response.detectorDefinition.displayName;
  }

  static getDetectorName(): string {
    return '';
  }

  getDetectorName(): string {
    return this._route.snapshot.params['detectorName'];
  }
}
