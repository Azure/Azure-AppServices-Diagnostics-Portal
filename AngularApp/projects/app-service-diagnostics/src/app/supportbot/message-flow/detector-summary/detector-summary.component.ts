import {
  DetectorControlService,
  DetectorListRendering,
  DetectorMetaData,
  DetectorResponse,
  DiagnosticData,
  DiagnosticService,
  HealthStatus,
  LoadingStatus,
  Rendering
} from 'diagnostic-data';
import { forkJoin, Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Injector,
  OnInit,
  Output
} from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { Message } from '../../models/message';

@Component({
  selector: 'detector-summary',
  templateUrl: './detector-summary.component.html',
  styleUrls: ['./detector-summary.component.scss']
})
export class DetectorSummaryComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  loading: boolean = true;

  detectorSummaryViewModels: DetectorSummaryViewModel[] = [];

  detector: DetectorMetaData;
  fullReportPath: string;
  showTopLevelFullReport: boolean = false;

  constructor(
    private _injector: Injector,
    private _diagnosticService: DiagnosticService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _chatState: CategoryChatStateService,
    private _detectorControlService: DetectorControlService,
    private _resourceService: ResourceService,
    private _logger: LoggingV2Service
  ) {}

  ngOnInit() {
    this._diagnosticService
      .getDetector(
        this._chatState.selectedFeature.id,
        this._detectorControlService.startTimeString,
        this._detectorControlService.endTimeString
      )
      .subscribe((response) => {
        this.detector = response.metadata;
        this.fullReportPath = `detectors/${this.detector.id}`;
        this.processDetectorResponse(response).subscribe(() => {
          this.onComplete.emit({ status: true });
        });
      });
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  processDetectorResponse(
    detectorResponse: DetectorResponse
  ): Observable<void[]> {
    const detectorList = detectorResponse.dataset.filter(
      (set) => (<Rendering>set.renderingProperties).type === 10
    );

    if (detectorList && detectorList.length > 0) {
      this.showTopLevelFullReport = true;
      return this._diagnosticService.getDetectors().pipe(
        mergeMap((detectors: DetectorMetaData[]) => {
          const subDetectors: string[] = [];
          detectorList.forEach((childSet) =>
            (<DetectorListRendering>(
              childSet.renderingProperties
            )).detectorIds.forEach((detector) => subDetectors.push(detector))
          );

          this.detectorSummaryViewModels = detectors
            .filter((detector) => subDetectors.indexOf(detector.id) != -1)
            .map((detector) => {
              return <DetectorSummaryViewModel>{
                id: detector.id,
                loading: LoadingStatus.Loading,
                name: detector.name,
                path: `detectors/${detector.id}`,
                status: null,
                type: DetectorSummaryType.ChildDetector
              };
            });

          this.loading = false;

          const tasks = this.detectorSummaryViewModels.map((detector) => {
            return this._diagnosticService
              .getDetector(
                detector.id,
                this._detectorControlService.startTimeString,
                this._detectorControlService.endTimeString
              )
              .pipe(
                map((response) => {
                  detector.status = response.status.statusId;
                  detector.loading = LoadingStatus.Success;
                })
              );
          });

          return forkJoin(tasks);
        })
      );
    } else {
      const insightResponses = detectorResponse.dataset.filter(
        (set) => (<Rendering>set.renderingProperties).type === 7
      );
      insightResponses.forEach((diagnosticData) => {
        const insights = this.parseInsights(
          diagnosticData,
          detectorResponse.metadata.id
        );
        insights.forEach((insight) => {
          this.detectorSummaryViewModels.push(insight);
        });
      });

      let changeSetResponses = detectorResponse.dataset.filter(
        (set) => (<Rendering>set.renderingProperties).type === 16
      );
      changeSetResponses.forEach((element) => {
        let changeSet = this.parseChangeSets(
          element,
          detectorResponse.metadata.id
        );
        changeSet.forEach((element) => {
          this.detectorSummaryViewModels.push(element);
        });
      });

      let onboardingResponses = detectorResponse.dataset.filter(
        (set) => set.renderingProperties.type === 17
      );
      onboardingResponses.forEach((element) => {
        let summary = this.parseOnboarding(
          element,
          detectorResponse.metadata.id
        );
        summary.forEach((summary) => {
          this.detectorSummaryViewModels.push(summary);
        });
      });

      let showDefaultMsg =
        insightResponses.length <= 0 &&
        changeSetResponses.length <= 0 &&
        onboardingResponses.length <= 0;
      if (showDefaultMsg) {
        // If no insights and no change sets found, return default message
        this.detectorSummaryViewModels.push(<DetectorSummaryViewModel>{
          id: 'default',
          loading: LoadingStatus.Success,
          name: 'No insights found. Click to view full output.',
          path: `detectors/${detectorResponse.metadata.id}`,
          status: HealthStatus.Info,
          type: DetectorSummaryType.Insight
        });
      }

      this.loading = false;

      return of(null);
    }
  }

  openFullReport() {
    this._logger.LogDetectorSummaryFullReportSelection(
      this.detector.id,
      this.detector.category
    );
    this.navigateTo(this.fullReportPath);
  }

  selectDetectorSummaryItem(item: DetectorSummaryViewModel) {
    if (item.type === DetectorSummaryType.ChildDetector) {
      this._logger.LogChildDetectorSelection(
        this.detector.id,
        item.id,
        item.name,
        item.status,
        this.detector.category
      );
    } else {
      this._logger.LogDetectorSummaryInsightSelection(
        this.detector.id,
        item.name,
        item.status,
        this.detector.category
      );
    }
    this.navigateTo(item.path);
  }

  navigateTo(path: string) {
    const navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute.parent
    };

    this._router.navigate(path.split('/'), navigationExtras);
  }

  private parseInsights(
    diagnosticData: DiagnosticData,
    detectorId: string
  ): DetectorSummaryViewModel[] {
    const insights: DetectorSummaryViewModel[] = [];
    const data = diagnosticData.table;

    const statusColumnIndex = 0;
    const insightColumnIndex = 1;

    for (let i: number = 0; i < data.rows.length; i++) {
      const row = data.rows[i];
      const insightName: string = row[insightColumnIndex];
      let insight: DetectorSummaryViewModel = insights.find(
        (insight) => insight.name === insightName
      );

      if (insight == null) {
        insights.push(<DetectorSummaryViewModel>{
          id: <string>insightName,
          loading: LoadingStatus.Success,
          name: <string>insightName,
          path: `detectors/${detectorId}`,
          status: HealthStatus[<string>row[statusColumnIndex]],
          type: DetectorSummaryType.ChildDetector
        });
      }
    }

    return insights;
  }

  parseChangeSets(
    diagnosticData: DiagnosticData,
    detectorId: string
  ): DetectorSummaryViewModel[] {
    let summary: DetectorSummaryViewModel[] = [];
    let data = diagnosticData.table;
    let totalChangeSets = data.rows.length;
    let name = '';
    if (data.rows.length == 0) {
      name = 'No change groups detected';
    } else {
      name =
        totalChangeSets == 1
          ? '1 change group has been detected'
          : `${totalChangeSets} change groups have been detected`;
    }
    summary.push(<DetectorSummaryViewModel>{
      id: <string>detectorId,
      loading: LoadingStatus.Success,
      name: name,
      path: `detectors/${detectorId}`,
      status: HealthStatus.Info,
      type: DetectorSummaryType.ChildDetector
    });
    return summary;
  }

  parseOnboarding(
    diagnosticData: DiagnosticData,
    detectorId: string
  ): DetectorSummaryViewModel[] {
    let summary: DetectorSummaryViewModel[] = [];
    let name =
      'Enable Change Analysis to investigate the changes made to your web application.';
    summary.push(<DetectorSummaryViewModel>{
      id: <string>detectorId,
      loading: LoadingStatus.Success,
      name: name,
      path: `settings`,
      status: HealthStatus.Onboarding,
      type: DetectorSummaryType.ChildDetector
    });
    return summary;
  }
}

export class DetectorSummaryMessage extends Message {
  constructor(messageDelayInMs: number = 1000) {
    super(DetectorSummaryComponent, {}, messageDelayInMs);
  }
}

interface DetectorSummaryViewModel {
  id: string;
  name: string;
  path: string;
  loading: LoadingStatus;
  status: HealthStatus;
  type: DetectorSummaryType;
}

enum DetectorSummaryType {
  ChildDetector,
  Insight
}
