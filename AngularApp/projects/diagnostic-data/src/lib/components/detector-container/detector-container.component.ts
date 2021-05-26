import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { DetectorResponse, RenderingType, DownTime } from '../../models/detector';
import { BehaviorSubject } from 'rxjs';
import { VersionService } from '../../services/version.service';
import { Moment } from 'moment';
import * as momentNs from 'moment';
import { XAxisSelection, zoomBehaviors } from '../../models/time-series';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { Inject } from '@angular/core';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
const moment = momentNs;

@Component({
  selector: 'detector-container',
  templateUrl: './detector-container.component.html',
  styleUrls: ['./detector-container.component.scss']
})
export class DetectorContainerComponent implements OnInit {

  detectorResponse: DetectorResponse = null;
  error: any;

  startTimeChildDetector: Moment = null;
  endTimeChildDetector: Moment = null;

  @Input() hideDetectorControl: boolean = false;
  @Input() isKeystoneSolution: boolean = false;
  hideTimerPicker: boolean = false;

  detectorName: string;
  detectorRefreshSubscription: any;
  refreshInstanceIdSubscription: any;
  isPublic: boolean = true;


  @Input() detectorSubject: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  @Input() set detector(detector: string) {
    this.detectorSubject.next(detector);
  }

  @Input() analysisMode: boolean = false;
  @Input() isAnalysisView: boolean = false;
  @Input() overWriteDetectorDescription: string = "";

  private _downtimeZoomBehavior:zoomBehaviors = zoomBehaviors.Zoom;
  @Input() public set downtimeZoomBehavior(zoomBehavior:zoomBehaviors) {
    if(!!zoomBehavior) {
      this._downtimeZoomBehavior = zoomBehavior;
    }
    else {
      this._downtimeZoomBehavior = zoomBehaviors.Zoom;
    }
  }

  public get downtimeZoomBehavior() {
    return this._downtimeZoomBehavior;
  }

  @Output() XAxisSelection: EventEmitter<XAxisSelection> = new EventEmitter<XAxisSelection>();
  public onXAxisSelection(event: XAxisSelection) {
    this.XAxisSelection.emit(event);
  }
  @Output() downTimeChanged: EventEmitter<DownTime> = new EventEmitter<DownTime>();

  isCategoryOverview: boolean = false;
  private isLegacy: boolean;



  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService,
    public detectorControlService: DetectorControlService, private versionService: VersionService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig,private featureNavigationService:FeatureNavigationService,private router:Router) {
    this.isPublic = config && config.isPublic;
  }

  get isPopoutFromAnalysis(): boolean {
    if (!!this._route.parent) {
      return !!this._route.parent.snapshot.url.find(urlPart => urlPart.path === 'popout');
    }
    else {
      return false;
    }

  }

  public initialize(): void {
    this.versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    //Remove after A/B Test
    if (this.isLegacy) {
      this.hideTimerPicker = false;
    } else {
      this.hideTimerPicker = this.hideDetectorControl || this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === "categories") > -1;
    }

    this.detectorRefreshSubscription = this.detectorControlService.update.subscribe(isValidUpdate => {
      if (isValidUpdate && this.detectorName) {
        this.refreshInstanceIdSubscription = this.detectorControlService._refreshInstanceId.subscribe((instanceId) => {
          if (instanceId.toLowerCase() === this.detectorName.toLowerCase() || instanceId === "V3ControlRefresh") {
            this.refresh(true);
          }
        });
      }
    });

    this.detectorSubject.subscribe(detector => {
      if (detector && detector !== "searchResultsAnalysis") {
        this.detectorName = detector;
        this.refresh(false);
      }
    });

    const component: any = this._route.component;

    let startTimeChildDetector: string = this._route.snapshot.queryParams['startTimeChildDetector'];
    if (!!startTimeChildDetector && startTimeChildDetector.length > 1 && moment.utc(startTimeChildDetector).isValid()) {
      this.startTimeChildDetector = moment.utc(startTimeChildDetector);
    }

    let endTimeChildDetector: string = this._route.snapshot.queryParams['endTimeChildDetector'];
    if (!!endTimeChildDetector && endTimeChildDetector.length > 1 && moment.utc(endTimeChildDetector).isValid()) {
      this.endTimeChildDetector = moment.utc(endTimeChildDetector);
    }
  }

  ngOnInit() {
    this._route.queryParamMap.subscribe(paramMap => {
      if (this.detectorName == null || !this.isAnalysisDetector()) {
        this.initialize();
      }
    });

    this._route.params.subscribe(param => {
      if(!this.featureNavigationService.lastIsAnalysisView && !param["analysisId"]) {
        // this.removeQueryParam();
      }
      this.featureNavigationService.lastIsAnalysisView = !!param["analysisId"];
    });
  }

  refresh(hardRefresh: boolean) {
    this.error = null;
    this.detectorResponse = null;
    this.getDetectorResponse(hardRefresh);
  }

  public get getStartTime(): Moment {
    let startTime: Moment = this.detectorControlService.startTime;
    const startTimeChildDetector: string = this._route.snapshot.queryParams['startTimeChildDetector'];
    //If it is analysisView or no startTimeChildDetector query param -> use startTime
    if (this.isAnalysisView || !startTimeChildDetector) {
      return startTime;
    }

    if (!!startTimeChildDetector && startTimeChildDetector.length > 1 && moment.utc(startTimeChildDetector).isValid()) {
      startTime = moment.utc(startTimeChildDetector);
      this.startTimeChildDetector = startTime;
    }
    else {
      if (!!this.startTimeChildDetector && this.startTimeChildDetector.isValid()) {
        startTime = this.startTimeChildDetector;
      }
    }
    return startTime;
  }

  public get getEndTime(): Moment {
    let endTime: Moment = this.detectorControlService.endTime;
    let endTimeChildDetector: string = this._route.snapshot.queryParams['endTimeChildDetector'];
    if (this.isAnalysisView || !endTimeChildDetector) {
      return endTime;
    }

    if (!!endTimeChildDetector && endTimeChildDetector.length > 1 && moment.utc(endTimeChildDetector).isValid()) {
      endTime = moment.utc(endTimeChildDetector);
      this.endTimeChildDetector = endTime;
    }
    else {
      if (!!this.endTimeChildDetector && this.endTimeChildDetector.isValid()) {
        endTime = this.endTimeChildDetector;
      }
    }
    return endTime;
  }

  //Check if it is child detector in analysis
  //If analysisId is this.detector => true, analysisMode is false => true
  isAnalysisDetector(): boolean {
    let analysisId = '';
    if (this.analysisMode) {
      analysisId = this._route.parent.snapshot.paramMap.get("analysisId");
    }
    else {
      analysisId = this._route.snapshot.paramMap.get('analysisId');
    }

    return !(this.analysisMode && analysisId != this.detectorName);
  }

  //Need to tweak 
  getDetectorResponse(hardRefresh: boolean) {
    let startTime = this.detectorControlService.startTimeString;
    let endTime = this.detectorControlService.endTimeString;
    let invalidateCache = hardRefresh ? hardRefresh : this.detectorControlService.shouldRefresh;
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    // Keeping knownQueryParams in case we need to append query parameters in the future
    let knownQueryParams = [];
    let queryParamsToSkipForAnalysis = ['startTime','endTime','startTimeChildDetector', 'endTimeChildDetector'];

    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) >= 0 || this.isAnalysisDetector() && queryParamsToSkipForAnalysis.indexOf(key) < 0)
      {
         additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });

    //If not in analysis view and not change from time picker(change from time picker will remove startTimeChildDetector/endTimeChildDetector) => replace XXXTimeChildDetector to startTime/endTime
    if (!this.isAnalysisView && !this.detectorControlService.changeFromTimePicker && allRouteQueryParams['startTimeChildDetector'] && allRouteQueryParams['endTimeChildDetector']) {
      const startTimeChildDetector: string = allRouteQueryParams['startTimeChildDetector'];
      const endTimeChildDetector: string = allRouteQueryParams['endTimeChildDetector'];
      if (startTimeChildDetector != null) {
        startTime = startTimeChildDetector;
      }

      if (endTimeChildDetector != null) {
        endTime = endTimeChildDetector;
      }
    }

    this._diagnosticService.getDetector(this.detectorName, startTime, endTime,
      invalidateCache, this.detectorControlService.isInternalView, additionalQueryString)
      .subscribe((response: DetectorResponse) => {
        this.shouldHideTimePicker(response);
        this.detectorResponse = response;
      }, (error: any) => {
        this.error = error;
      });
  }

  // TODO: Right now this is hardcoded to hide for cards, but make this configurable from backend
  shouldHideTimePicker(response: DetectorResponse) {
    if (response && response.dataset && response.dataset.length > 0) {
      const cardRenderingIndex = response.dataset.findIndex(data => data.renderingProperties.type == RenderingType.Cards);

      //Remove after A/B Test
      if (this.isLegacy) {
        this.hideDetectorControl = cardRenderingIndex >= 0;
      } else {
        this.hideDetectorControl = cardRenderingIndex >= 0 || this.hideDetectorControl;
      }

    }
  }

  ngOnDestroy(): void {
    if (this.detectorRefreshSubscription) {
      this.detectorRefreshSubscription.unsubscribe();
    }
    if (this.refreshInstanceIdSubscription) {
      this.refreshInstanceIdSubscription.unsubscribe();
    }
  }

  onDowntimeChanged(event: DownTime) {
    this.downTimeChanged.emit(event);
  }

  removeQueryParam() {
    if (this.isAnalysisView) return;
    if (this._route.snapshot.queryParams["startTimeChildDetector"] || this._route.snapshot.queryParams["endTimeChildDetector"]) {
      const queryParams = { ...this._route.snapshot.queryParams };
      delete queryParams.startTimeChildDetector;
      delete queryParams.endTimeChildDetector;
      this.router.navigate([], {
        queryParams: queryParams
      });
    }
  }
}
