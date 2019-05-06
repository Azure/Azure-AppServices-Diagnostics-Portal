import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, LoadingStatus, DetectorMetaData, DetectorResponse, TelemetryEventNames, HealthStatus, InsightUtils, Insight, DetectorControlService, TelemetryService, FeatureNavigationService } from 'diagnostic-data';
import { map, catchError } from 'rxjs/operators';
import { forkJoin as observableForkJoin, Observable, throwError } from 'rxjs';
import { StatusStyles } from '../../models/styles';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'analysis-view',
  templateUrl: './analysis-view.component.html',
  styleUrls: ['./analysis-view.component.scss']
})
export class AnalysisViewComponent extends DataRenderBaseComponent implements OnInit {

  analysisId: string;
  detectorId: string;
  detectorName: string;
  contentHeight: string;
  detectors: any[] = [];
  LoadingStatus = LoadingStatus;
  detectorViewModels: any[];
  detectorMetaData: DetectorMetaData[];
  private childDetectorsEventProperties = {};

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _diagnosticService: DiagnosticService, private _detectorControl: DetectorControlService, protected telemetryService: TelemetryService, private _navigator: FeatureNavigationService) {
    super(telemetryService);
  }

  @Input()
  detectorParmName:string;

  ngOnInit() {
    this._activatedRoute.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
      this.detectorId = params.get(this.detectorParmName) === null ? "" : params.get(this.detectorParmName);

      this.detectors = [];
      this._diagnosticService.getDetectors().subscribe(detectorList => {
        if (detectorList) {

          if (this.detectorId !== "") {
            let currentDetector = detectorList.find(detector => detector.id == this.detectorId)
            this.detectorName = currentDetector.name;
          }

          detectorList.forEach(element => {
            if (element.analysisTypes != null && element.analysisTypes.length > 0) {
              element.analysisTypes.forEach(analysis => {
                if (analysis === this.analysisId) {
                  this.detectors.push({ name: element.name, id: element.id });
                }
              });
            }
          });

          this.detectorMetaData = detectorList.filter(detector => this.detectors.findIndex(d => d.id === detector.id) >= 0);
          this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector));

          const requests: Observable<any>[] = [];
          this.detectorViewModels.forEach((metaData, index) => {
            requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
              map((response: DetectorResponse) => {
                this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);
                return {
                  'ChildDetectorName': this.detectorViewModels[index].title,
                  'ChildDetectorId': this.detectorViewModels[index].metadata.id,
                  'ChildDetectorStatus': this.detectorViewModels[index].status,
                  'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
                };
              })
              , catchError(err => {
                this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
                return throwError(err);
              })
            ));
          });

          // Log all the children detectors
          observableForkJoin(requests).subscribe(childDetectorData => {
            this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
            this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
          });

        }
      });
    });

  }

  getDetectorInsightSummary(viewModel: any) {
    let response: DetectorResponse = viewModel.response;
    if (response.status.statusId === HealthStatus.Critical || response.status.statusId === HealthStatus.Warning) {
      let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(response);

      let insightDescription = "";
      if (allInsights[0].hasData()) {
        let description = allInsights[0].data["Description"];
        if (description != null) {
          insightDescription = description;
        }
      }
      return insightDescription;
    }
  }

  ngOnChanges() {

  }

  getRouterLink(detectorId: string): any[] {
    let link = [];
    if (this.detectorId !== "") {
      link = ['../' + detectorId];
    } else {
      link = ['./' + detectorId];
    }
    return link;
  }

  private updateDetectorViewModelSuccess(viewModel: any, res: DetectorResponse) {
    const status = res.status.statusId;

    viewModel.loadingStatus = LoadingStatus.Success,
      viewModel.status = status;
    viewModel.statusColor = StatusStyles.getColorByStatus(status),
      viewModel.statusIcon = StatusStyles.getIconByStatus(status),
      viewModel.response = res;
    return viewModel;
  }

  private getDetectorViewModel(detector: DetectorMetaData) {
    return {
      title: detector.name,
      metadata: detector,
      loadingStatus: LoadingStatus.Loading,
      status: null,
      statusColor: null,
      statusIcon: null,
      expanded: false,
      response: null,
      request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString)
    };
  }

  public selectDetector(detectorId: string) {
    if (detectorId !== "") {
      //this.logCardClick(card.title);
      //this._navigator.NavigateToDetector(this._activatedRoute.snapshot.params['detector'], detectorId);
      this._router.navigate([`../../analysis/${this.analysisId}/${detectorId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', preserveFragment: true });

    }
  }
}
