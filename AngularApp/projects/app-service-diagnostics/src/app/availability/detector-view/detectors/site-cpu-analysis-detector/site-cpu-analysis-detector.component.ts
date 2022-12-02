import { Component } from '@angular/core';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import {
  IDetectorResponse,
  IDetectorAbnormalTimePeriod
} from '../../../../shared/models/detectorresponse';
import { DetectorViewInstanceDetailComponent } from '../../detector-view-instance-detail/detector-view-instance-detail.component';
import { StartupInfo } from '../../../../shared/models/portal';
import { MetaDataHelper } from '../../../../shared/utilities/metaDataHelper';
import { AppAnalysisService } from '../../../../shared/services/appanalysis.service';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';
import { AuthService } from '../../../../startup/services/auth.service';
import { DetectorViewStateService } from '../../../../shared/services/detector-view-state.service';
import { DetectorControlService } from 'diagnostic-data';
declare let d3: any;

@Component({
  templateUrl: 'site-cpu-analysis-detector.component.html',
  styles: ['.row { margin-top: 5px; }']
})
export class SiteCpuAnalysisDetectorComponent extends DetectorViewInstanceDetailComponent {
  showProblemsAndSolutions: boolean = false;
  bladeOpenedFromSupportTicketFlow: boolean = false;
  highlightedAbnormalTimePeriod: IDetectorAbnormalTimePeriod;
  instancesToSelect: string[];
  instanceToSelect: string;
  instanceSelectedDescription: string;

  constructor(
    protected _route: ActivatedRoute,
    protected _appAnalysisService: AppAnalysisService,
    protected _logger: AvailabilityLoggingService,
    private _authService: AuthService,
    private _detectorViewService: DetectorViewStateService,
    protected _detectorControlService: DetectorControlService
  ) {
    super(_route, _appAnalysisService, _logger, _detectorControlService);
    this.detectorMetricsTitle = 'Overall CPU Usage per Instance';
    this.detectorMetricsDescription =
      'This graphs shows the total CPU usage on each of the instances where your application is running. ' +
      'Below you can look at a specific instance and see how much CPU each app is consuming.';
    this.instanceDetailTitle = 'App CPU Usage Breakdown';
    this.instanceDetailDescription =
      'This shows the average CPU usage, in percent out of 100, for each application in the given time window.';

    this.showProblemsAndSolutions =
      this._route.snapshot.url.findIndex(
        (x: UrlSegment) => x.path === 'focus'
      ) > 0;

    this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
      this.bladeOpenedFromSupportTicketFlow =
        startupInfo.source !== undefined &&
        startupInfo.source.toLowerCase() === 'casesubmission';
    });
  }

  ngOnInit() {
    super.ngOnInit();
    this.highlightedAbnormalTimePeriod =
      this._detectorViewService.getDetectorViewState(this.getDetectorName());

    if (this.highlightedAbnormalTimePeriod) {
      this.instancesToSelect = MetaDataHelper.getMetaDataValues(
        this.highlightedAbnormalTimePeriod.metaData,
        'instancename'
      );
      if (!this.instancesToSelect || this.instancesToSelect.length === 0) {
        this.instancesToSelect = MetaDataHelper.getMetaDataValues(
          this.highlightedAbnormalTimePeriod.metaData,
          'instance'
        );
      }
      if (this.instancesToSelect.length > 0) {
        this.instanceToSelect = this.instancesToSelect[0];
        this.instanceSelectedDescription =
          'Based on the selected high CPU period above, the following instance(s) were automatically selected: ' +
          this.instancesToSelect.join(', ');
      }
    }
  }

  processDetectorResponse(response: IDetectorResponse) {
    super.processDetectorResponse(response);
    this.detectorMetrics = response.metrics.filter(
      (x) => x.name === 'Overall CPU Percent'
    );
    this.instanceDetailMetrics = response.metrics.filter(
      (x) => x.name !== 'Overall CPU Percent'
    );
  }

  static getDetectorName(): string {
    return 'sitecpuanalysis';
  }

  getDetectorName(): string {
    return 'sitecpuanalysis';
  }
}
