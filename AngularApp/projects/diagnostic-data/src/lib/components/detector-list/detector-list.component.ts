import { BehaviorSubject, forkJoin as observableForkJoin, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Pipe, PipeTransform, Inject, OnInit } from '@angular/core';
import {
  DetectorListRendering, DetectorMetaData, DetectorResponse, DiagnosticData, DownTime, HealthStatus
} from '../../models/detector';
import { LoadingStatus } from '../../models/loading';
import { StatusStyles } from '../../models/styles';
import { DetectorControlService } from '../../services/detector-control.service';
import { DiagnosticService } from '../../services/diagnostic.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { ParseResourceService } from '../../services/parse-resource.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { Insight, InsightUtils } from '../../models/insight';
import { Solution } from '../solution/solution';
import { ActivatedRoute, Router } from '@angular/router';
import { PanelType } from 'office-ui-fabric-react';
import { numberFormat } from 'highcharts';


@Component({
  selector: 'detector-list',
  templateUrl: './detector-list.component.html',
  styleUrls: ['./detector-list.component.scss'],
  animations: [
    trigger('expand', [
      state('shown', style({ height: '*' })),
      state('hidden', style({ height: '0px', visibility: 'hidden' })),
      transition('* => *', animate('.25s'))
    ])
  ]
})
export class DetectorListComponent extends DataRenderBaseComponent {

  LoadingStatus = LoadingStatus;
  renderingProperties: DetectorListRendering;
  detectorMetaData: DetectorMetaData[];
  detectorViewModels: any[] = [];
  DetectorStatus = HealthStatus;
  private childDetectorsEventProperties = {};
  overrideResourceUri: string = "";
  resourceType: string = "";
  errorMsg: string = "";
  internalErrorMsg: string = "";
  isPublic: boolean;
  imgSrc: string = "";
  resourceText: string = "";

  inDrillDownMode: boolean = false;
  drilldownDetectorName: string = "";
  drillDownDetectorId: string = "";
  issueDetectedViewModels: any[] = [];
  successfulViewModels: any[] = [];
  allSolutionsMap: Map<string, Solution[]> = new Map<string, Solution[]>();
  solutionPanelOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  panelType: PanelType = PanelType.custom;
  allSolutions: Solution[] = [];

  childDetectorPanelOpen: boolean = false;


  constructor(private _diagnosticService: DiagnosticService, protected telemetryService: TelemetryService, private _detectorControl: DetectorControlService, private parseResourceService: ParseResourceService, @Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig, private _router: Router, private _activatedRoute: ActivatedRoute) {
    super(telemetryService);
    this.isPublic = this.config && this.config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DetectorListRendering>data.renderingProperties;
    if (this._activatedRoute.firstChild && this._activatedRoute.firstChild.snapshot.params["drilldownDetectorName"]) {
      this.drillDownDetectorId = this._activatedRoute.firstChild.snapshot.params["drilldownDetectorName"];
    }
    this.getResponseFromResource();
  }

  private getResponseFromResource() {
    let isFromDependentResource = this.checkIsFromDependentResource();
    if (isFromDependentResource) {
      this.parseResourceService.checkIsResourceSupport(this.overrideResourceUri, false).subscribe(error => {
        this.internalErrorMsg = error;
        if (error === "") {
          this.resourceType = this.parseResourceService.resourceType;
          this.imgSrc = this.parseResourceService.resource.imgSrc;

          if (this.isPublic) {
            this.resourceText = `Showing diagnostics from the dependent resource type: ${this.resourceType}`;
          } else {
            this.resourceText = `Showing detectors from the dependent resource type: ${this.resourceType}`;
          }

          this.logEvent("DependentChildDetectorsLoaded", {
            DependentResourceUri: this.overrideResourceUri,
            DependentResourceType: this.resourceType
          });
          this.getDetectorResponses();
        }
      });
    } else {
      //From parent resource
      this.getDetectorResponses();
    }
  }

  // private getDetectorResponses() {
  //   this._diagnosticService.getDetectors(this.overrideResourceUri).subscribe(detectors => {
  //     this.detectorMetaData = detectors.filter(detector => this.renderingProperties.detectorIds.indexOf(detector.id) >= 0);
  //     this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, this.renderingProperties.additionalParams, this.overrideResourceUri));

  //     const requests: Observable<any>[] = [];
  //     this.detectorViewModels.forEach((metaData, index) => {
  //       requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
  //         map((response: DetectorResponse) => {
  //           this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);
  //           return {
  //             'ChildDetectorName': this.detectorViewModels[index].title,
  //             'ChildDetectorId': this.detectorViewModels[index].metadata.id,
  //             'ChildDetectorStatus': this.detectorViewModels[index].status,
  //             'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
  //           };
  //         })
  //         , catchError(err => {
  //           this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
  //           return throwError(err);
  //         })
  //       ));
  //     });

  //     // Log all the children detectors
  //     observableForkJoin(requests).subscribe(childDetectorData => {
  //       this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
  //       this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
  //     });
  //   },
  //     (err => {
  //       if (this.overrideResourceUri !== "") {
  //         const e = JSON.parse(err);
  //         let code: string = "";
  //         if (e && e.error && e.error.code) {
  //           code = e.error.code;
  //         }
  //         switch (code) {
  //           case "InvalidAuthenticationTokenTenant":
  //             this.errorMsg = `No Access for resource ${this.resourceType} , please check your access`;
  //             break;

  //           case "":
  //             break;

  //           default:
  //             this.errorMsg = code;
  //             break;
  //         }
  //       }
  //     })
  //   );
  // }

  private getDetectorResponses(): void {
    this._diagnosticService.getDetectors(this.overrideResourceUri).subscribe(detectors => {
      this.startDetectorRendering(detectors, null, false);

      const defaultSelectedDetector = detectors.find(d => d.id === this.drillDownDetectorId);
      if (defaultSelectedDetector) {
        this.drilldownDetectorName = defaultSelectedDetector.name;
        this.childDetectorPanelOpen = true;
      }
    });
  }

  public retryRequest(metaData: any) {
    metaData.loadingStatus = LoadingStatus.Loading;
    metaData.request.subscribe(
      (response: DetectorResponse) => {
        metaData = this.updateDetectorViewModelSuccess(metaData, response);
      },
      (error) => {
        metaData.loadingStatus = LoadingStatus.Failed;
      });
  }

  private getDetectorViewModel(detector: DetectorMetaData, additionalParams?: string, overwriteResourceUrl?: string) {
    let queryString = null;
    if (additionalParams) {
      let contextToPass = <Object>JSON.parse(additionalParams);
      queryString = '';
      for (var key in contextToPass) {
        if (contextToPass.hasOwnProperty(key)) {
          queryString += `&${key}=${encodeURIComponent(contextToPass[key])}`;
        }
      }
    }
    return {
      title: detector.name,
      metadata: detector,
      loadingStatus: LoadingStatus.Loading,
      status: null,
      statusColor: null,
      statusIcon: null,
      expanded: false,
      response: null,
      request: this._diagnosticService.getDetector(detector.id, this._detectorControl.startTimeString, this._detectorControl.endTimeString, this._detectorControl.shouldRefresh, this._detectorControl.isInternalView, queryString, overwriteResourceUrl)
    };
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

  toggleDetectorHeaderStatus(viewModel: any) {
    viewModel.expanded = viewModel.loadingStatus === LoadingStatus.Success && !viewModel.expanded;
    const clickDetectorEventProperties = {
      'ChildDetectorName': viewModel.title,
      'ChildDetectorId': viewModel.metadata.id,
      'IsExpanded': viewModel.expanded,
      'Status': viewModel.status
    };

    // Log children detectors click
    this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);
  }

  checkIsFromDependentResource(): boolean {
    if (!this.renderingProperties.resourceUri || this.renderingProperties.resourceUri === "") return false;
    this.overrideResourceUri = this.renderingProperties.resourceUri;

    return true;
  }


  //Get from detector-list-analysis
  startDetectorRendering(detectorList: DetectorMetaData[], downTime: DownTime, containsDownTime: boolean) {
    // if (this.showWebSearchTimeout) {
    //     clearTimeout(this.showWebSearchTimeout);
    // }
    // this.showWebSearchTimeout = setTimeout(() => { this.showWebSearch = true; }, 10000);
    this.issueDetectedViewModels = [];
    const requests: Observable<any>[] = [];

    this.detectorMetaData = detectorList.filter(detector => this.renderingProperties.detectorIds.indexOf(detector.id) >= 0);
    //this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, downTime, containsDownTime));
    this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, this.renderingProperties.additionalParams, this.overrideResourceUri));
    // if (this.detectorViewModels.length > 0) {
    //     this.loadingChildDetectors = true;
    //     this.startLoadingMessage();
    // }
    this.detectorViewModels.forEach((metaData, index) => {
      requests.push((<Observable<DetectorResponse>>metaData.request).pipe(
        map((response: DetectorResponse) => {
          this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(metaData, response);

          if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
            if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
              let insight = this.getDetectorInsight(this.detectorViewModels[index]);
              let issueDetectedViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };

              if (this.issueDetectedViewModels.length > 0) {
                this.issueDetectedViewModels = this.issueDetectedViewModels.filter(iVM => (!!iVM.model && !!iVM.model.metadata && !!iVM.model.metadata.id && iVM.model.metadata.id != issueDetectedViewModel.model.metadata.id));
              }

              this.issueDetectedViewModels.push(issueDetectedViewModel);
              this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => {
                // if(this.allSolutionsMap.has(issueDetectedViewModel.model.title)) return Number.MIN_SAFE_INTEGER;
                return n1.model.status - n2.model.status
              });
            } else {
              let insight = this.getDetectorInsight(this.detectorViewModels[index]);
              let successViewModel = { model: this.detectorViewModels[index], insightTitle: insight.title, insightDescription: insight.description };

              if (this.successfulViewModels.length > 0) {
                this.successfulViewModels = this.successfulViewModels.filter(sVM => (!!sVM.model && !!sVM.model.metadata && !!sVM.model.metadata.id && sVM.model.metadata.id != successViewModel.model.metadata.id));
              }

              this.successfulViewModels.push(successViewModel);
            }
          }

          return {
            'ChildDetectorName': this.detectorViewModels[index].title,
            'ChildDetectorId': this.detectorViewModels[index].metadata.id,
            'ChildDetectorStatus': this.detectorViewModels[index].status,
            'ChildDetectorLoadingStatus': this.detectorViewModels[index].loadingStatus
          };
        })
        , catchError(err => {
          this.detectorViewModels[index].loadingStatus = LoadingStatus.Failed;
          return of({});
        })
      ));
    });

    // Log all the children detectors
    observableForkJoin(requests).subscribe(childDetectorData => {
      setTimeout(() => {
        let dataOutput = {};
        dataOutput["status"] = true;
        dataOutput["data"] = {
          // 'searchMode': this.searchMode,
          // 'detectors': this.detectors,
          'successfulViewModels': this.successfulViewModels,
          'issueDetectedViewModels': this.issueDetectedViewModels
        };

        // this.onComplete.emit(dataOutput);
      }, 10);

      // this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
      // if (this.searchId && this.searchId.length > 0) {
      //     this.childDetectorsEventProperties['SearchId'] = this.searchId;
      // }
      this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
    });

    // if (requests.length === 0) {
    //     let dataOutput = {};
    //     dataOutput["status"] = true;
    //     dataOutput["data"] = {
    //         'detectors': []
    //     };

    //     this.onComplete.emit(dataOutput);
    // }
  }

  getDetectorInsight(viewModel: any): any {
    let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response);
    let insight: any;
    if (allInsights.length > 0) {

      let detectorInsight = allInsights.find(i => i.status === viewModel.status);
      if (detectorInsight == null) {
        detectorInsight = allInsights[0];
      }

      let description = null;
      if (detectorInsight.hasData()) {
        description = detectorInsight.data["Description"];
      }
      insight = { title: detectorInsight.title, description: description };

      // now populate solutions for all the insights
      const solutions: Solution[] = [];
      allInsights.forEach(i => {
        if (i.solutions != null && i.solutions.length > 0) {
          i.solutions.forEach(s => {
            if (solutions.findIndex(x => x.Name === s.Name) === -1) {
              solutions.push(s);
            }
          });
          this.allSolutionsMap.set(viewModel.title, solutions);
        }
      });
    }
    return insight;
  }

  public selectDetector(viewModel: any) {
    if (viewModel != null && viewModel.model.metadata.id) {
      let drilldownDetectorId = viewModel.model.metadata.id;

      // if (viewModel.model.metadata.category) {
      //   categoryName = viewModel.model.metadata.category.replace(/\s/g, '');
      // }
      // else {
      //   // For uncategorized detectors:
      //   // If it is home page, redirect to availability category. Otherwise stay in the current category page.
      //   categoryName = this._router.url.split('/')[11] ? this._router.url.split('/')[11] : "availabilityandperformance";
      // }

      if (drilldownDetectorId !== "") {
        const clickDetectorEventProperties = {
          'ChildDetectorName': viewModel.model.title,
          'ChildDetectorId': viewModel.model.metadata.id,
          'IsExpanded': true,
          'Status': viewModel.model.status,
          // 'SearchMode': this.searchMode
        };

        // Log children detectors click
        this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);

        if (drilldownDetectorId === 'appchanges' && !this._detectorControl.internalClient) {
          // this._portalActionService.openChangeAnalysisBlade(this._detectorControl.startTimeString, this._detectorControl.endTimeString);
        } else {
          this.updateDrillDownMode(true, viewModel);
          if (viewModel.model.startTime != null && viewModel.model.endTime != null) {
            this._router.navigate([`./drillDownDetector/${drilldownDetectorId}`], {
              relativeTo: this._activatedRoute,
              queryParams: { startTime: viewModel.model.startTime, endTime: viewModel.model.endTime },
              queryParamsHandling: 'merge',
              replaceUrl: true
            });
          }
          else {
            this._router.navigate([`./drilldownDetector/${drilldownDetectorId}`], {
              relativeTo: this._activatedRoute,
              queryParamsHandling: 'merge',
              preserveFragment: true
            });
          }
          this.childDetectorPanelOpen = true;
        }
      }
    }
  }

  private updateDrillDownMode(inDrillDownMode: boolean, viewModel: any): void {
    this.inDrillDownMode = inDrillDownMode;
    if (!this.inDrillDownMode) {
      this.drilldownDetectorName = '';
      this.drillDownDetectorId = '';
    }
    else {
      if (!!viewModel && !!viewModel.model && !!viewModel.model.metadata && !!viewModel.model.metadata.name) {
        this.drilldownDetectorName = viewModel.model.metadata.name;
        this.drillDownDetectorId = viewModel.model.metadata.id;
      }
    }
  }

  goBackToParentView() {
    this.updateDrillDownMode(false, null);
    // if (this.analysisId === "searchResultsAnalysis" && this.searchTerm) {
    //   this._router.navigate([`../../../../${this.analysisId}/search`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge', queryParams: { searchTerm: this.searchTerm } });
    // }
    // else {
    //   if (!!this.analysisId && this.analysisId.length > 0) {
    //     this._router.navigate([`../${this.analysisId}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
    //   }
    // }
    this._router.navigate([`../../detectors/${this.detector}`], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge'
    });
  }

  refresh() {
    // this._activatedRoute.paramMap.subscribe(params => {
    //   this.detectorId = params.get("detectorName") ? this.de
    // });
  }

  openSolutionPanel(title: string) {
    this.allSolutions = this.allSolutionsMap.get(title);
    // this.solutionPanelOpen = true;
    this.solutionPanelOpenSubject.next(true);

  }

  // dismissSolutionPanel() {
  //   this.solutionPanelOpen = false;
  // }

  dismissChildDetectorPanel() {
    this.childDetectorPanelOpen = false;
    this.goBackToParentView();
  }
}

@Pipe({
  name: 'detectorOrder',
  pure: false
})
export class DetectorOrderPipe implements PipeTransform {
  transform(items: any[]) {
    return items.sort((a, b) => {
      return a.status > b.status ? 1 : -1;
    });
  }
}
