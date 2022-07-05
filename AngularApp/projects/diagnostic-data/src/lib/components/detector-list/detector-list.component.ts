import { BehaviorSubject, forkJoin as observableForkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Pipe, PipeTransform, Inject, Optional } from '@angular/core';
import {
  DetectorListRendering, DetectorMetaData, DetectorResponse, DetectorType, DiagnosticData, HealthStatus
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
import { PortalActionGenericService } from '../../services/portal-action.service';
import { UriUtilities } from '../../utilities/uri-utilities';
import { GenericBreadcrumbService } from '../../services/generic-breadcrumb.service';
import { ILinkProps } from 'office-ui-fabric-react';
import { SolutionService } from '../../services/solution.service';
import { GenericUserSettingService } from '../../services/generic-user-setting.service';

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
  detectorName: string = "";
  detectorMetaData: DetectorMetaData[];
  detectorViewModels: DetectorViewModel[] = [];
  detectorViewModelsWaterfall: DetectorViewModel[] = [];
  HealthStatus = HealthStatus;
  private childDetectorsEventProperties = {};
  overrideResourceUri: string = "";
  resourceType: string = "";
  errorMsg: string = "";
  internalErrorMsg: string = "";
  isPublic: boolean;
  imgSrc: string = "";
  resourceText: string = "";


  issueDetectedViewModels: DetectorViewModeWithInsightInfo[] = [];
  successfulViewModels: DetectorViewModeWithInsightInfo[] = [];
  failedLoadingViewModels: any[] = [];
  allSolutionsMap: Map<string, Solution[]> = new Map<string, Solution[]>();
  solutionPanelOpenSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  allSolutions: Solution[] = [];
  solutionTitle: string = "";
  loading = LoadingStatus.Loading;
  expandIssuedChecks: boolean = false;
  isWaterfallViewMode: boolean = false;

  constructor(private _diagnosticService: DiagnosticService, protected telemetryService: TelemetryService, private _detectorControl: DetectorControlService, private _solutionService: SolutionService,
    private parseResourceService: ParseResourceService, @Inject(DIAGNOSTIC_DATA_CONFIG) private config: DiagnosticDataConfig, private _router: Router,
    private _activatedRoute: ActivatedRoute, private _portalActionService: PortalActionGenericService, private _breadcrumbService: GenericBreadcrumbService, private _genericUserSettingsService: GenericUserSettingService) {
    super(telemetryService);
    this.isPublic = this.config && this.config.isPublic;

    this._genericUserSettingsService.isWaterfallViewSub.subscribe(isWaterfallViewMode => {
      this.isWaterfallViewMode = isWaterfallViewMode;
    });

  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <DetectorListRendering>data.renderingProperties;
    this.getResponseFromResource();
    this._genericUserSettingsService.getExpandAnalysisCheckCard().subscribe(expandIssuedChecks => {
      this.expandIssuedChecks = expandIssuedChecks;
    });

    this._genericUserSettingsService.isWaterfallViewMode().subscribe(isWaterfallViewMode => {
      this.isWaterfallViewMode = isWaterfallViewMode;
    });
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

  private getDetectorResponses(): void {
    this._diagnosticService.getDetectors(this.overrideResourceUri).subscribe(detectors => {
      this.startDetectorRendering(detectors);

      const detectorMetaData = detectors.find(d => d.id === this.detector);
      if (detectorMetaData) {
        this.detectorName = detectorMetaData.name;
      }
    }, (error => {
      if (this.overrideResourceUri !== "") {
        const e = JSON.parse(error);
        let code: string = "";
        if (e && e.error && e.error.code) {
          code = e.error.code;
        }
        switch (code) {
          case "InvalidAuthenticationTokenTenant":
            this.errorMsg = `No Access for resource ${this.resourceType} , please check your access`;
            break;

          case "":
            break;

          default:
            this.errorMsg = code;
            break;
        }
      }
    }));
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

  private getDetectorViewModel(detector: DetectorMetaData, additionalParams?: string, overwriteResourceUrl?: string): DetectorViewModel {
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
    const viewModel: DetectorViewModel = {
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

    return viewModel;
  }

  private updateDetectorViewModelSuccess(viewModel: DetectorViewModel, res: DetectorResponse) {
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

  public openBladeDiagnoseDetectorId(viewModel, type: DetectorType = DetectorType.Detector) {
    if (viewModel != null && viewModel.model.metadata.id) {
      let detector = viewModel.model.metadata.id;
      let category = "";

      if (viewModel.model.metadata.category) {
        category = viewModel.model.metadata.category.replace(/\s/g, '');
      }
      else {
        // For uncategorized detectors:
        // If it is home page, redirect to availability category. Otherwise stay in the current category page.
        category = this._router.url.split('/')[11] ? this._router.url.split('/')[11] : "availabilityandperformance";
      }

      const bladeInfo = {
        title: category,
        detailBlade: 'SCIFrameBlade',
        extension: 'WebsitesExtension',
        detailBladeInputs: {
          id: this.overrideResourceUri,
          categoryId: category,
          optionalParameters: [{
            key: "categoryId",
            value: category
          },
          {
            key: "detectorId",
            value: detector
          },
          {
            key: "detectorType",
            value: type
          }]
        }
      };
      this._solutionService.GoToBlade(this.overrideResourceUri, bladeInfo);
    }
  }


  //Get from detector-list-analysis
  startDetectorRendering(detectorList: DetectorMetaData[]) {
    this.issueDetectedViewModels = [];
    const requests: Observable<any>[] = [];

    this.detectorMetaData = detectorList.filter(detector => this.renderingProperties.detectorIds.indexOf(detector.id) >= 0);
    let detectorMetaData1 = this.renderingProperties.detectorIds.filter(id => this.detectorMetaData.findIndex(metaData => metaData.id == id) >= 0);
    detectorList.filter(detector => this.renderingProperties.detectorIds.indexOf(detector.id) >= 0);
    this.detectorViewModels = this.detectorMetaData.map(detector => this.getDetectorViewModel(detector, this.renderingProperties.additionalParams, this.overrideResourceUri));
    this.detectorViewModelsWaterfall = this.detectorViewModels;
    if (this.detectorViewModels.length === 0) {
      this.loading = LoadingStatus.Success;
    }
    this.detectorViewModels.forEach((viewModel, index) => {
      requests.push((<Observable<DetectorResponse>>viewModel.request).pipe(
        map((response: DetectorResponse) => {
          this.detectorViewModels[index] = this.updateDetectorViewModelSuccess(viewModel, response);

          this.loading = this.detectorViewModels.findIndex(vm => vm.loadingStatus === LoadingStatus.Loading) > -1 ? LoadingStatus.Loading : LoadingStatus.Success;

          if (this.detectorViewModels[index].loadingStatus !== LoadingStatus.Failed) {
            if (this.detectorViewModels[index].status === HealthStatus.Critical || this.detectorViewModels[index].status === HealthStatus.Warning) {
              let insightInfo = this.getDetectorInsightInfo(this.detectorViewModels[index]);
              let issueDetectedViewModel: DetectorViewModeWithInsightInfo = { model: this.detectorViewModels[index], ...insightInfo };

              if (this.issueDetectedViewModels.length > 0) {
                this.issueDetectedViewModels = this.issueDetectedViewModels.filter(iVM => (!!iVM.model && !!iVM.model.metadata && !!iVM.model.metadata.id && iVM.model.metadata.id != issueDetectedViewModel.model.metadata.id));
              }

              this.issueDetectedViewModels.push(issueDetectedViewModel);
              this.issueDetectedViewModels = this.issueDetectedViewModels.sort((n1, n2) => {
                return n1.model.status - n2.model.status
              });
            } else {
              let insightInfo = this.getDetectorInsightInfo(this.detectorViewModels[index]);
              let successViewModel: DetectorViewModeWithInsightInfo = { model: this.detectorViewModels[index], ...insightInfo };

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
          this.loading = this.detectorViewModels.findIndex(vm => vm.loadingStatus === LoadingStatus.Loading) > -1 ? LoadingStatus.Loading : LoadingStatus.Success;
          const viewModel: any = this.detectorViewModels[index];
          if (viewModel && viewModel.model && viewModel.model.title) {
            this.failedLoadingViewModels.push({
              model: viewModel
            });
          }
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

      this.childDetectorsEventProperties['ChildDetectorsList'] = JSON.stringify(childDetectorData);
      // if (this.searchId && this.searchId.length > 0) {
      //     this.childDetectorsEventProperties['SearchId'] = this.searchId;
      // }
      this.logEvent(TelemetryEventNames.ChildDetectorsSummary, this.childDetectorsEventProperties);
    });
  }

  getDetectorInsightInfo(viewModel: DetectorViewModel): BasicInsightInfo {
    let allInsights: Insight[] = InsightUtils.parseAllInsightsFromResponse(viewModel.response, true);
    let insightInfo: BasicInsightInfo = {
      insightTitle: "",
      insightDescription: ""
    }
    if (allInsights.length > 0) {

      let detectorInsight = allInsights.find(i => i.status === viewModel.status);
      if (detectorInsight == null) {
        detectorInsight = allInsights[0];
      }

      let description: string = null;
      if (detectorInsight.hasData()) {
        description = detectorInsight.data["Description"];
      }
      insightInfo.insightTitle = detectorInsight.title;
      insightInfo.insightDescription = description;
    }

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
    return insightInfo;
  }


  queryParams = {};
  linkStyle: ILinkProps['styles'] = {
    root: {
      padding: '10px'
    }
  }
  public selectDetector(viewModel: DetectorViewModeWithInsightInfo) {
    if (viewModel != null && viewModel.model.metadata.id) {
      let targetDetector = viewModel.model.metadata.id;

      if (targetDetector !== "") {
        const clickDetectorEventProperties = {
          'ChildDetectorName': viewModel.model.title,
          'ChildDetectorId': viewModel.model.metadata.id,
          'IsExpanded': true,
          'Status': viewModel.model.status,
        };

        // Log children detectors click
        this.logEvent(TelemetryEventNames.ChildDetectorClicked, clickDetectorEventProperties);
        this.queryParams = UriUtilities.removeChildDetectorStartAndEndTime(this._activatedRoute.snapshot.queryParams);
        const additionalParams = this.renderingProperties.additionalParams ? JSON.parse(this.renderingProperties.additionalParams) : {};
        const combinedParams = { ...this.queryParams, ...additionalParams };
        if (targetDetector === 'appchanges' && this.isPublic) {
          this._portalActionService.openChangeAnalysisBlade(this._detectorControl.startTimeString, this._detectorControl.endTimeString);
        } else {
          if (this.isPublic && !(this.overrideResourceUri == "")) {
            this.openBladeDiagnoseDetectorId(viewModel);
          }
          else if (this.isPublic) {
            const url = this._router.url.split("?")[0];
            const routeUrl = url.endsWith("/overview") ? `../detectors/${targetDetector}` : `../../detectors/${targetDetector}`;
            this._router.navigate([routeUrl], {
              queryParams: combinedParams,
              relativeTo: this._activatedRoute
            });
          }
          else {
            const resourceId = this._diagnosticService.resourceId;
            if (!this.isPublic) {
              this._breadcrumbService.updateBreadCrumbSubject({
                name: this.detectorName,
                id: this.detector,
                isDetector: true,
                queryParams: combinedParams
              });
            }
            this._router.navigate([`${resourceId}/detectors/${targetDetector}`], { queryParams: combinedParams });
          }
        }
      }
    }
  }


  public selectDetectorNewTab(viewModel: DetectorViewModeWithInsightInfo) {
    if (viewModel != null && viewModel.model.metadata.id) {
      let targetDetector = viewModel.model.metadata.id;

      if (targetDetector !== "") {
        const queryParams = this._activatedRoute.snapshot.queryParams;
        const additionalParams = this.renderingProperties.additionalParams ? JSON.parse(this.renderingProperties.additionalParams) : {};
        const combinedParams = { ...queryParams, ...additionalParams };
        const resourceId = this._diagnosticService.resourceId;

        let paramString = "";
        Object.keys(combinedParams).forEach(x => {
          paramString = paramString === "" ? `${paramString}${x}=${combinedParams[x]}` : `${paramString}&${x}=${combinedParams[x]}`;
        });
        const linkAddress = this.overrideResourceUri == "" ? `${resourceId}/detectors/${targetDetector}?${paramString}` : `${this.overrideResourceUri}/detectors/${targetDetector}?${paramString}`;
        window.open(linkAddress, '_blank');
      }
    }
  }

  openSolutionPanel(viewModel: DetectorViewModeWithInsightInfo) {
    if (viewModel != null && viewModel.model != null && viewModel.model.title) {
      let title: string = viewModel.model.title;
      let detectorId: string = (viewModel.model.metadata != null) && (viewModel.model.metadata.id != null) ? viewModel.model.metadata.id : "";
      let status: string = viewModel.model.status != null ? JSON.stringify(viewModel.model.status) : "";
      this.allSolutions = this.allSolutionsMap.get(title);
      this.solutionTitle = `${title} Solution`;
      this.solutionPanelOpenSubject.next(true);
      this.logEvent("ViewSolutionPanelButtonClicked", {
        SolutionTitle: title,
        DetectorId: detectorId,
        Status: status
      });
    }
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

interface DetectorViewModel {
  title: string;
  metadata: DetectorMetaData;
  loadingStatus: LoadingStatus;
  status: HealthStatus;
  statusColor: string;
  statusIcon: string;
  expanded: boolean;
  response: DetectorResponse;
  request: Observable<DetectorResponse>
}

interface BasicInsightInfo {
  insightTitle: string;
  insightDescription: string;
}

interface DetectorViewModeWithInsightInfo extends BasicInsightInfo {
  model: DetectorViewModel;
}
