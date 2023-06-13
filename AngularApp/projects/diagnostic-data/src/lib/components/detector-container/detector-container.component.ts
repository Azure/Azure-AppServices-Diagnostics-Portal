import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { ActivatedRoute, Router, UrlSegment } from '@angular/router';
import { DetectorResponse, RenderingType, DownTime } from '../../models/detector';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Moment } from 'moment';
import * as momentNs from 'moment';
import { XAxisSelection, zoomBehaviors } from '../../models/time-series';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { Inject } from '@angular/core';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import { AlertInfo, ConfirmationOption, UserAccessStatus } from '../../models/alerts';
import { HealthStatus } from "../../models/detector";
import { StringUtilities } from '../../utilities/string-utilities';

const moment = momentNs;

const hideTimePickerDetectors: string[] = [
  'eventviewer',
  'LinuxLogViewer',
  'DiagnosticTools',
  'LinuxDiagnosticTools',
  'networktroubleshooter'
];

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
  @Input() hideDetectorHeader: boolean = false;
  @Input() isKeystoneSolution: boolean = false;
  @Input() isWorkflowDetector: boolean = false;
  hideTimerPicker: boolean = false;

  detectorName: string;
  detectorRefreshSubscription: any;
  refreshInstanceIdSubscription: any;
  isPublic: boolean = true;
  workflowLastRefreshed: string = '';
  detectorSubject = new BehaviorSubject<string>(null);

  @Input() set detector(detector: string) {
    this.detectorSubject.next(detector);
  }

  @Input() analysisMode: boolean = false;
  @Input() isAnalysisView: boolean = false;
  @Input() overWriteDetectorDescription: string = "";
  @Input() overWriteDetectorName: string = "";

  private _downtimeZoomBehavior: zoomBehaviors = zoomBehaviors.Zoom;
  @Input() public set downtimeZoomBehavior(zoomBehavior: zoomBehaviors) {
    if (!!zoomBehavior) {
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
  isUserConsentRequired: boolean = false;  
  alertDialogStyles = { main: { maxWidth: "70vw!important", minWidth: "40vw!important" } };
  alertDialogProps = {isBlocking: true};
  alertInfo: AlertInfo = {
    header: "",
    details: "",
    seekConfirmation: true,
    confirmationOptions: [{ label: 'Yes, I consent', value: 'yes' }, { label: 'No, I do not consent', value: 'no' }],
    alertStatus: HealthStatus.Warning,
    userAccessStatus: UserAccessStatus.HasAccess
  };;


  constructor(private _route: ActivatedRoute, private _diagnosticService: DiagnosticService,
    public detectorControlService: DetectorControlService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private featureNavigationService: FeatureNavigationService, private router: Router) {
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
    this.hideTimerPicker = this.hideDetectorControl || this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === "categories") > -1;

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


      //For now hard code detectors which are not show time picker, next step is to read it from detector definition
      if (detector && hideTimePickerDetectors.find(d => d.toLowerCase() === detector.toLowerCase())) {
        this.hideDetectorControl = true;
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
      if (!this.featureNavigationService.lastIsAnalysisView && !param["analysisId"]) {
        // this.removeQueryParam();
      }
      this.featureNavigationService.lastIsAnalysisView = !!param["analysisId"];
    });
  }

  refresh(hardRefresh: boolean, additionalHeaders?: Map<string, string>) {
    this.error = null;
    this.detectorResponse = null;
    this.getDetectorResponse(hardRefresh, additionalHeaders);
  }

  public get getStartTime(): Moment {
    let startTime: Moment = this.detectorControlService.startTime;
    return startTime;
  }

  public get getEndTime(): Moment {
    let endTime: Moment = this.detectorControlService.endTime;
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
  getDetectorResponse(hardRefresh: boolean, additionalHeaders?: Map<string, string>) {
    let startTime = this.detectorControlService.startTimeString;
    let endTime = this.detectorControlService.endTimeString;
    let invalidateCache = hardRefresh ? hardRefresh : this.detectorControlService.shouldRefresh;
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    // Keeping knownQueryParams in case we need to append query parameters in the future
    let knownQueryParams = [];
    let queryParamsToSkipForAnalysis = ['startTime', 'endTime', 'startTimeChildDetector', 'endTimeChildDetector'];

    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) >= 0 || this.isAnalysisDetector() && queryParamsToSkipForAnalysis.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });

    if (this.isWorkflowDetector) {

      //
      // workflowLastRefreshed is assigned to the lastRefreshed property of the workflow-view component, changing
      // this triggers the ngOnChanges for the WorkflowViewComponent and that causes the component to reload
      //

      this.workflowLastRefreshed = Date.now().toString();
    } else {
      this._diagnosticService.getDetector(this.detectorName, startTime, endTime, invalidateCache, this.detectorControlService.isInternalView, additionalQueryString, null, additionalHeaders).subscribe((response: DetectorResponse) => {
        this.shouldHideTimePicker(response);
        this.detectorResponse = response;
      }, (error: any) => {    
        if (StringUtilities.isValidJSON(error.error) && error.status == 403 && error.url.includes("api/invoke")) {         
            let errorObj = JSON.parse(error.error);
            if (errorObj.Status == UserAccessStatus.ConsentRequired) { this.handleForbidden(errorObj); }          
        }     
        this.error = error;       
      });
    }
  }

  // TODO: Right now this is hardcoded to hide for cards, but make this configurable from backend
  shouldHideTimePicker(response: DetectorResponse) {
    if (response && response.dataset && response.dataset.length > 0) {
      const cardRenderingIndex = response.dataset.findIndex(data => data.renderingProperties.type == RenderingType.Cards);
      this.hideDetectorControl = cardRenderingIndex >= 0 || this.hideDetectorControl;

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

  handleForbidden(errorObj:any) {
    this.isUserConsentRequired = true;
    let message = errorObj.DetailText;
    let userAccessStatus =  errorObj.Status;
    message = message.trim();
    if (message) {
      if (message[message.length - 1] == '.') {
        message = message.substring(0, message.length - 1);
      }
    }
    this.alertInfo = {
      header: "You are accessing sensitive data",
      details: `This detector contains sensitive data. Before proceeding, please attest that you have a valid business reason to view the sensitive data and will be handing data in compliance with GDPR. Your attestation will be valid for 7 days if you choose to proceed. Please note that all access attempts will be logged and audited for security purposes.`,
      seekConfirmation: true,
      confirmationOptions: [{ label: 'Yes, I attest', value: 'yes' }, { label: 'No, I do not attest', value: 'no' }],
      alertStatus: HealthStatus.Warning,
      userAccessStatus: userAccessStatus
    };
  }

  handleUserResponse(userResponse: ConfirmationOption) {
    if (userResponse.value === 'yes') {
      this.isUserConsentRequired = false;
      let additionalHeaders = new Map<string, string>();
      additionalHeaders.set("x-ms-diag-consent", "true");
      this.refresh(true, additionalHeaders );
    }
    else if (userResponse.value == 'no') {
      this.consentDialogCancel();
    }
  }
  consentDialogCancel() {
    this.isUserConsentRequired = false;
  }
}
