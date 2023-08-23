import { DetectorMetaData, DetectorResponse, DetectorType, ResiliencyScoreReportHelper, HealthStatus, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorControlService } from 'diagnostic-data';
import { ApplensCommandBarService } from '../../services/applens-command-bar.service';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';
import { ResourceService } from '../../../../shared/services/resource.service';
import { ObserverService } from '../../../../shared/services/observer.service';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { DirectionalHint } from 'office-ui-fabric-react';
import { HttpClient } from '@angular/common/http';
import { ObserverSiteSku, ObserverSkuType } from '../../../../shared/models/observer';
import { ApplensCopilotContainerService } from '../../services/copilot/applens-copilot-container.service';
import { ApplensDetectorCopilotService } from '../../services/copilot/applens-detector-copilot.service';
import { DiagnosticApiService } from '../../../../shared/services/diagnostic-api.service';
import { PortalUtils } from 'projects/applens/src/app/shared/utilities/portal-util';

@Component({
  selector: 'tab-data',
  templateUrl: './tab-data.component.html',
  styleUrls: ['./tab-data.component.scss']
})
export class TabDataComponent implements OnInit, OnDestroy {

  detectorResponse: DetectorResponse;

  detector: string;
  workflowId: string;
  detectorMetaData: DetectorMetaData;
  isWorkflowDetector: boolean = false;
  analysisMode: boolean = false;
  hideDetectorControl: boolean = false;

  internalExternalText: string = "";
  readonly internalViewText: string = "Internal view";
  readonly externalViewText: string = "Customer view";

  pinnedDetector: boolean = false;
  get pinUnpinDetectorText() {
    return this.pinnedDetector ? "UnPin" : "Pin"
  }

  get pinUnpinDetectorIcon() {
    return this.pinnedDetector ? "Unpin" : "Pinned"
  }
  panelStyles: IPanelProps['styles'] = {
    root: {
      height: "60px",
    },
    content: {
      padding: "0px"
    }
  }
  PanelType = PanelType;
  panelHealthStatus = HealthStatus.Success;
  panelTimer = null;
  showPanel: boolean = false;
  panelMessage: string = "";

  // Variables used by Download Report button
  resourceReady: Observable<any>;
  resource: any;
  siteSku: ObserverSiteSku;
  subscriptionId: string;
  displayDownloadReportButton: boolean = false;
  displayDownloadReportButtonStyle: any = {};
  downloadReportId: string;
  downloadReportText: string = "Download report";
  downloadReportIcon: any = { iconName: 'Download' };
  downloadReportButtonDisabled: boolean = false;
  downloadReportFileName: string;
  coachmarkId: string;
  showCoachmark: boolean = true;
  showTeachingBubble: boolean = false;
  generatedOn: string;
  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  };
  teachingBubbleCalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge
  };
  vfsFonts: any;

  // copilot variables
  copilotEnabled: boolean = true;
  copilotServiceMembersInitialized: boolean = false;

  constructor(public resourceService: ResourceService, public _copilotContainerService: ApplensCopilotContainerService, public _detectorCopilotService: ApplensDetectorCopilotService,
    private _route: ActivatedRoute, private _observerService: ObserverService, private _applensApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService,
    private _detectorControlService: DetectorControlService, private _applensCommandBarService: ApplensCommandBarService, private _applensGlobal: ApplensGlobal,
    private _telemetryService: TelemetryService, private _http: HttpClient) { }

  ngOnInit() {

    this.copilotServiceMembersInitialized = false;

    this._detectorCopilotService.isEnabled().subscribe(res => {
      this.copilotEnabled = res && !this.isWorkflowDetector;
    });

    // If route query params contains detectorQueryParams, setting the values in shared service so it is accessible in all components
    this._route.queryParams.subscribe((queryParams: Params) => {
      if (queryParams.detectorQueryParams != undefined) {
        this._detectorControlService.setDetectorQueryParams(queryParams.detectorQueryParams);
      } else {
        this._detectorControlService.setDetectorQueryParams("");
      }
      this.analysisMode = this._route.snapshot.data['analysisMode'];
      this.detector = this._route.snapshot.params['detector'] ? this._route.snapshot.params['detector'] : null;
      this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonDisplayed, { 'DownloadReportButtonDisplayed': this.displayDownloadReportButton.toString(), 'Detector:': this.detector, 'SubscriptionId': this._route.parent.snapshot.params['subscriptionid'], 'Resource': this.resource?.SiteName ?? 'NoResource' });

      this._detectorCopilotService.initializeMembers(this.analysisMode);
      this.copilotServiceMembersInitialized = true;
    });

    if (this._detectorControlService.isInternalView) {
      this.internalExternalText = this.internalViewText;
    }
    else {
      this.internalExternalText = this.externalViewText;
    }
    this.resourceReady = this.resourceService.getCurrentResource();
    this.resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;
      }
    });
    // Retrieving info about the site 
    // Sample response: {"kind":"app","is_linux":false,"sku":"Standard","actual_number_of_workers":3,"current_worker_size":1}    
    if (!!this.resource?.InternalStampName && !!this.resource?.SiteName) {
      this._observerService.getSiteSku(this.resource.InternalStampName, this.resource.SiteName).subscribe(siteSku => {
        if (siteSku) {
          this.siteSku = siteSku;
        }
      });
    }

    this._route.params.subscribe((params: Params) => {
      this.subscriptionId = params["subscriptionId"];
      this.refresh();
    });

    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean
    try {
      if (this.displayDownloadReportButton) {
        if (localStorage.getItem("showCoachmark") != undefined) {
          this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
        }
        else {
          this.showCoachmark = true;
        }
      }
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const eventProperties = {
        'Subscription': this._route.parent.snapshot.params['subscriptionid'],
        'Platform': this.siteSku.is_linux != undefined ? !this.siteSku.is_linux ? "Windows" : "Linux" : "",
        'AppType': this.siteSku.kind != undefined ? this.siteSku.kind.toLowerCase() === "app" ? "WebApp" : this.siteSku.kind.toString() : "",
        'resourceSku': this.siteSku.sku != undefined ? this.siteSku.sku.toString() : "",
        'ReportType': 'ResiliencyScore',
        'Error': error,
        'Message': 'Error trying to retrieve showCoachmark from localStorage'
      }
      this._telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
    }

    //
    // Retrieving custom fonts from assets/vfs_fonts.json in each project, to be passed to 
    // PDFMake to generate ResiliencyScoreReport. 
    // Using this as an alternative to using the vfs_fonts.js build with PDFMake's build-vfs.js
    // as this file caused problems when being compiled in a library project like diagnostic-data
    //
    this._http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => { this.vfsFonts = data });
  }

  ngOnDestroy(): void {

    if (this.copilotServiceMembersInitialized) {
      this._copilotContainerService.onCloseCopilotPanelEvent.next({ showConfirmation: false, resetCopilot: true });
    }
  }

  ngAfterViewInit() {
    // Async to get button element after grandchild is rendered
    setTimeout(() => {
      this.updateDownloadReportId();
    });
  }

  refresh() {

    if (this.copilotServiceMembersInitialized) {
      this._copilotContainerService.onCloseCopilotPanelEvent.next({ showConfirmation: false, resetCopilot: true });
    }

    if (this._route.snapshot.params['workflowId'] != null) {
      this.detector = this._route.snapshot.params['workflowId'];
      this.isWorkflowDetector = true;

      // disable copilot for workflows
      this.copilotEnabled = false;

    } else {
      this.detector = this._route.snapshot.params['detector'];
    }


    this._applensApiService.getDetectorMetaDataById(this.detector, this.isWorkflowDetector).subscribe(metaData => {
      if (metaData) {
        this._applensGlobal.updateHeader(metaData.name);
        this._applensGlobal.updateAuthorAndDescription(metaData.author, metaData.description);
        this.detectorMetaData = metaData;
      }
    });

    this._applensCommandBarService.getUserSetting().subscribe(userSetting => {
      if (userSetting && userSetting.favoriteDetectors) {
        const favoriteDetectorIds = Object.keys(userSetting.favoriteDetectors);
        this.pinnedDetector = favoriteDetectorIds.findIndex(d => d.toLowerCase() === this.detector.toLowerCase()) > -1;
      }
    });

    // Detecting whether Download Report button should be displayed or not
    this.displayDownloadReportButton = this.detector === "ResiliencyScore" && (this.checkIsWindowsApp() || this.checkIsLinuxApp());

    // Logging telemetry for Download Report button
    const dRBDEventProperties = {
      'ResiliencyScoreButtonDisplayed': `${this.displayDownloadReportButton}`,
      'Subscription': this._route.parent.snapshot.params['subscriptionid'],
      'Platform': this.siteSku?.is_linux != undefined ? !this.siteSku.is_linux ? "Windows" : "Linux" : "",
      'AppType': this.siteSku?.kind != undefined ? `${this.siteSku.kind}`.toLowerCase() === "app" ? "WebApp" : `${this.siteSku.kind}` : "",
      'resourceSku': this.siteSku?.sku != undefined ? `${this.siteSku.sku}` : "",
      'ReportType': 'ResiliencyScore',
    };
    this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonDisplayed, dRBDEventProperties);
  }

  refreshPage() {
    this._applensCommandBarService.refreshPage();
  }

  emailToAuthor() {
    this._applensCommandBarService.getDetectorMeatData(this.detector, this.isWorkflowDetector).subscribe(metaData => {
      this._applensCommandBarService.emailToAuthor(metaData);
    });
  }

  openFeedback() {
    this._copilotContainerService.onCloseCopilotPanelEvent.next({ showConfirmation: false, resetCopilot: false });
    this._applensGlobal.openFeedback = true;
  }

  internalExternalToggle() {
    if (this.internalExternalText === this.externalViewText) {
      this.internalExternalText = this.internalViewText;
    }
    else {
      this.internalExternalText = this.externalViewText;
    }

    this._detectorControlService.toggleInternalExternal();
    this.refreshPage();
  }

  addOrRemoveDetector() {
    this.showPanel = false;
    this.panelMessage = "";
    this.panelHealthStatus = HealthStatus.Success;

    if (this.pinnedDetector) {
      this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorRemoved, { 'detectorId': this.detector, 'location': 'CommandBar' });
      this.removeFavoriteDetector();
    } else {
      this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorAdded, { 'detectorId': this.detector, 'location': 'CommandBar' });
      this.addFavoriteDetector();
    }
  }

  private addFavoriteDetector() {
    //Pinned detector can be analysis
    const detectorType = this.detectorMetaData ? this.detectorMetaData.type : DetectorType.Detector;

    this._applensCommandBarService.addFavoriteDetector(this.detector, detectorType).subscribe(message => {
      this.setPanelStatusAndMessage(HealthStatus.Success, message);
    }, error => {
      this.setPanelStatusAndMessage(HealthStatus.Critical, error);
    })
  }

  openDetectorCopilot() {
    this._copilotContainerService.showCopilotPanel();
    PortalUtils.logEvent('detectorcopilot-open', '', this._telemetryService);
  }

  private removeFavoriteDetector() {
    this._applensCommandBarService.removeFavoriteDetector(this.detector).subscribe(message => {
      this.setPanelStatusAndMessage(HealthStatus.Success, message);
    }, err => {
      this.setPanelStatusAndMessage(HealthStatus.Critical, err);
    })
  }

  private setPanelStatusAndMessage(status: HealthStatus, message: string) {
    this.panelHealthStatus = status;
    this.panelMessage = message;
    this.autoDismissPanel();
  }

  private autoDismissPanel() {
    this.showPanel = true;
    if (this.panelTimer !== null) {
      clearTimeout(this.panelTimer);
    }
    this.panelTimer = setTimeout(() => {
      this.showPanel = false;
    }, 3000);
  }

  // Check if the app is an App Service Windows Standard or higher SKU
  private checkIsWindowsApp() {
    let _sku: ObserverSkuType = ObserverSkuType.All;
    _sku = ObserverSkuType[this.siteSku.sku];
    return this.siteSku && this.getAppType(this.siteSku.kind.toLowerCase()) === "WebApp" && !this.siteSku.is_linux && _sku > 8; //Only for Web App (Windows) in Standard or higher SKU     
  }

  // Check if the app is an App Service Linux Standard or higher SKU
  private checkIsLinuxApp() {
    let _sku: ObserverSkuType = ObserverSkuType.All;
    _sku = ObserverSkuType[this.siteSku.sku];
    return this.siteSku && this.getAppType(this.siteSku.kind.toLowerCase()) === "LinuxApp" && this.siteSku.is_linux && _sku > 8; //Only for Web App (Windows) in Standard or higher SKU 
  }

  //To do, Add a utility method to check kind and use in main.component and site.service
  private getAppType(kind: string) {
    if (kind && kind.toLowerCase().indexOf("workflowapp") !== -1) {
      return "WorkflowApp";
    } else if (kind && kind.toLowerCase().indexOf("functionapp") !== -1) {
      return "FunctionApp";
    } else if (kind && kind.toLowerCase().indexOf("linux") !== -1) {
      return "LinuxApp";
    } else return "WebApp";
  }


  updateDownloadReportId() {
    const btns = document.querySelectorAll("button");
    const downloadButtonId = "downloadReportId";
    const coachMarkId = "fab-coachmark";
    let downloadButtonIndex = -1;
    if (btns && btns.length > 0) {
      btns.forEach((btn, i) => {
        if (btn.textContent.includes(this.downloadReportText)) {
          downloadButtonIndex = i;
        }
      });

      if (downloadButtonIndex >= 0 && downloadButtonIndex < btns.length && btns[downloadButtonIndex]) {
        const downloadButton = btns[downloadButtonIndex];
        downloadButton.setAttribute("id", downloadButtonId);
      }
    }

    this.downloadReportId = `#${downloadButtonId}`;
    this.coachmarkId = `#${coachMarkId}`;
  }


  downloadReport() {
    // Start time when download report button is clicked
    let sT = new Date();

    const rSEventProperties = {
      'Subscription': this.subscriptionId,
      'TimeClicked': sT.toUTCString(),
      'ReportType': 'ResiliencyScore',
    };
    this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonClicked, rSEventProperties);
    // Once the button is clicked no need to show Coachmark anymore:
    const loggingError = new Error();
    try {
      if (localStorage.getItem("showCoachmark") != undefined) {
        this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
      }
      else {
        this.showCoachmark = false;
        localStorage.setItem("showCoachmark", "false");
      }
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const eventProperties = {
        'Subscription': this.subscriptionId,
        'TimeClicked': sT.toUTCString(),
        'ReportType': 'ResiliencyScore',
        'Error': error,
        'Message': 'Error trying to retrieve showCoachmark from localStorage',
      }
      this._telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
    }

    this.downloadReportText = "Downloading report...";
    this.downloadReportIcon = {
      iconName: 'Download',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
    this.downloadReportButtonDisabled = true;

    if (this._route.snapshot.params['detector']) {
      this.detector = this._route.snapshot.params['detector'];
    }
    else {
      this.detector = this._route.parent.snapshot.params['detector'];
    }
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });


    this._applensApiService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, this._detectorControlService.shouldRefresh, this._detectorControlService.isInternalView, additionalQueryString)
      .subscribe((httpResponse: DetectorResponse) => {
        //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
        let eT = new Date();
        let detectorTimeTaken = eT.getTime() - sT.getTime();
        if (this.downloadReportFileName == undefined) {
          this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
          this.downloadReportFileName = `ResiliencyReport-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":", "-")}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}`, this.generatedOn, this.vfsFonts);
        }
        else {
          this.downloadReportFileName = `${this.downloadReportFileName}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}_(cached)`, this.generatedOn, this.vfsFonts);
        }
        // Time after downloading report
        eT = new Date();
        // Estimate total time it took to download report
        let totalTimeTaken = eT.getTime() - sT.getTime();
        // log telemetry for interaction
        const eventProperties = {
          'Subscription': this._route.parent.snapshot.params['subscriptionid'],
          'CustomerName': JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName,
          'NameSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].Name,
          'ScoreSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].OverallScore,
          'DetectorTimeTaken': detectorTimeTaken.toString(),
          'TotalTimeTaken': totalTimeTaken.toString(),
          'ReportType': 'ResiliencyScore',
        };
        this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonClicked, eventProperties);
        this.downloadReportText = "Download report";
        this.downloadReportIcon = { iconName: 'Download' };
        this.downloadReportButtonDisabled = false;
      }, error => {
        loggingError.message = `Error calling ${this.detector} detector`;
        loggingError.stack = error;
        this._telemetryService.logException(loggingError);
      });
  }

  coachMarkViewed() {
    if (!this.showTeachingBubble) {

      //
      // TeachingBubbles inherit from Callout react component and they have a 
      // some issue in the current version of the libaray with *ngIf and they are
      // not disposed properly. Due to this, the event keeps getting fired when a
      //  user clicks anywhere in the portal. Avoid executing the rest of the function
      //  if teachingBubble was already dismissed
      //

      return;
    }
    const loggingError = new Error();
    // Stop showing TeachingBubble
    this.showTeachingBubble = false;

    //Once Coachmark has been seen, disable it by setting boolean value to local storage
    try {
      localStorage.setItem("showCoachmark", "false");
    }
    catch (error) {
      //Use TelemetryService logException
      loggingError.message = 'Error accessing localStorage. Most likely accessed via in InPrivate or Incognito mode';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this._telemetryService.logException(loggingError, null, null, _severityLevel);
    }

    this.removeTeachingBubbleFromDom();
  }

  showingTeachingBubble() {
    this.showTeachingBubble = true;
  }

  //
  // This is risky if we ever add another teaching bubble and if by
  // any chance two teachingBubbles end up showing at the same time
  //

  removeTeachingBubbleFromDom() {
    const htmlElements = document.querySelectorAll<HTMLElement>('.ms-Callout.ms-TeachingBubble');
    if (htmlElements.length > 0) {
      htmlElements[0].parentElement.remove();
    }
  }
}
