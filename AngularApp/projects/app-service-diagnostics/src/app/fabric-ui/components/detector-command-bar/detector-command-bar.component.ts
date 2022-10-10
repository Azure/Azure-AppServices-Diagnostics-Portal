import {
  DetectorControlService, DiagnosticService, DetectorMetaData, DetectorResponse, TelemetryService, TelemetryEventNames, TelemetrySource, ResiliencyScoreReportHelper
} from 'diagnostic-data';
import { Component, AfterViewInit, Input } from '@angular/core';
import { Globals } from '../../../globals';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { DirectionalHint } from 'office-ui-fabric-react';
import { BehaviorSubject, Observable } from 'rxjs';
import { DemoSubscriptions } from '../../../betaSubscriptions';
import { Sku } from '../../../shared/models/server-farm';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'detector-command-bar',
  templateUrl: './detector-command-bar.component.html',
  styleUrls: ['./detector-command-bar.component.scss']
})
export class DetectorCommandBarComponent implements AfterViewInit {
  @Input() disableGenie: boolean = false;

  time: string;
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  detector: DetectorMetaData;
  fullReportPath: string;

  displayRPDFButton: boolean = false;
  _isBetaSubscription: boolean = false;
  gRPDFButtonChild: Element;
  gRPDFButtonId: string;
  gRPDFCoachmarkId: string;
  gRPDFButtonText: string = "Get Resiliency Score report";
  gRPDFButtonIcon: any = { iconName: 'Download' };
  gRPDFFileName: string;
  gRPDFButtonDisabled: boolean;
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
  resourcePlatform: OperatingSystem = OperatingSystem.any;
  resourceAppType: AppType = AppType.WebApp;
  resourceSku: Sku = Sku.All;
  vfsFonts: any;

  public _checkIsWindowsApp(): boolean {
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    return this._resourceService && this._resourceService instanceof WebSitesService
      && (webSiteService.platform === OperatingSystem.windows) && (webSiteService.appType === AppType.WebApp) && (webSiteService.sku > 8); //Only for Web App (Windows) in Standard or higher
  }

  ngOnInit(): void {
    let subscriptionId = this._route.parent.snapshot.params['subscriptionid'];
    // allowlisting beta subscriptions for testing purposes
    this._isBetaSubscription = DemoSubscriptions.betaSubscriptions.indexOf(subscriptionId) >= 0;
    // add logic for presenting initially to 100% of Subscriptions:  percentageToRelease = 1 (1=100%)
    let percentageToRelease = 1;
    // roughly split of percentageToRelease of subscriptions to use new feature.

    let firstDigit = "0x" + subscriptionId.substr(0, 1);
    this.displayRPDFButton = ((16 - parseInt(firstDigit, 16)) / 16 <= percentageToRelease || this._isBetaSubscription) && this._checkIsWindowsApp();
    const rSBDEventProperties = {
      'ResiliencyScoreButtonDisplayed': this.displayRPDFButton.toString(),
      'Subscription': this._route.parent.snapshot.params['subscriptionid'],
      'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
      'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString(): "",
      'resourceSku': this.resourceSku != undefined ? this.resourceSku.toString(): "",
    };
    this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonDisplayed, rSBDEventProperties);
    const loggingError = new Error();
    this.gRPDFButtonDisabled = false;
    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean
    try {
      if (this.displayRPDFButton){
        if (localStorage.getItem("showCoachmark") != undefined) {
          this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
        }
        else {
          this.showCoachmark = true;
        }
      }
    }
    catch (error) {
      loggingError.message = 'Error trying to retrieve showCoachmark from localStorage';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }

    //
    // Retrieving custom fonts from assets/vfs_fonts.json in each project, to be passed to 
    // PDFMake to generate ResiliencyScoreReport. 
    // Using this as an alternative to using the vfs_fonts.js build with PDFMake's build-vfs.js
    // as this file caused problems when being compiled in a library project like diagnostic-data
    //
    this.http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => {this.vfsFonts=data}); 
  }

  constructor(private globals: Globals, private _detectorControlService: DetectorControlService, private _diagnosticService: DiagnosticService, private _route: ActivatedRoute, private router: Router, private telemetryService: TelemetryService, private _resourceService: ResourceService, private http: HttpClient) {
  }

  toggleOpenState() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenGenie, {
      'Location': TelemetrySource.CategoryPage
    })
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
  }

  sendFeedback() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel, {
      'Location': TelemetrySource.CategoryPage
    });
    this.globals.openFeedback = !this.globals.openFeedback;
  }

  generateResiliencyPDF() {
    let sT = new Date();
    const rSEventProperties = {
      'Subscription': this._route.parent.snapshot.params['subscriptionid'],
      'TimeClicked': sT.toUTCString()
    };
    this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonClicked, rSEventProperties);
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
      //Use TelemetryService logException
      loggingError.message = 'Error accessing localStorage. Most likely accessed via in InPrivate or Incognito mode';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }
    // Taking starting time

    this.gRPDFButtonText = "Getting Resiliency Score report...";
    this.gRPDFButtonIcon = {
      iconName: 'Download',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
    this.gRPDFButtonDisabled = true;    
    this._diagnosticService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
      .subscribe((httpResponse: DetectorResponse) => {
        //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
        let eT = new Date();
        let detectorTimeTaken = eT.getTime() - sT.getTime();
        
        
        if (this.gRPDFFileName == undefined) {
          this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
          this.gRPDFFileName = `ResiliencyReport-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":", "-")}`;          
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}`, this.generatedOn, this.vfsFonts);
        }
        else {
          this.gRPDFFileName = `${this.gRPDFFileName}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}_(cached)`, this.generatedOn, this.vfsFonts);
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
          'TotalTimeTaken': totalTimeTaken.toString()
        };
        this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportDownloaded, eventProperties);
        this.gRPDFButtonText = "Get Resiliency Score report";
        this.gRPDFButtonIcon = { iconName: 'Download' };
        this.gRPDFButtonDisabled = false;
      }, error => {
        loggingError.message = 'Error calling ResiliencyScore detector';
        loggingError.stack = error;
        this.telemetryService.logException(loggingError);
      });
  }

  refreshPage() {
    let childRouteSnapshot = this._route.firstChild.snapshot;
    let childRouteType = childRouteSnapshot.url[0].toString();

    let instanceId = childRouteType === "overview" ? this._route.snapshot.params["category"] : (this._route.snapshot.params["category"] === "DiagnosticTools" ? childRouteSnapshot.url[1].toString() : childRouteType === "detectors" ? childRouteSnapshot.params["detectorName"] : childRouteSnapshot.params["analysisId"]);
    let isDiagnosticToolUIPage = this._route.snapshot.params["category"] === "DiagnosticTools" && childRouteType !== "overview" && instanceId !== "eventviewer" && instanceId !== "freblogs";

    const eventProperties = {
      'Category': this._route.snapshot.params['category'],
      'Location': TelemetrySource.CategoryPage
    };
    if (childRouteType === "detectors") {
      eventProperties['Detector'] = childRouteSnapshot.params['detectorName'];
      eventProperties['Type'] = 'detector';
    } else if (childRouteType === "analysis") {
      eventProperties['Analysis'] = childRouteSnapshot.params["analysisId"];
      eventProperties['Type'] = 'analysis';
    } else if (childRouteType === "overview") {
      eventProperties['Type'] = 'overview';
    } else if (this._route.snapshot.params["category"] === "DiagnosticTools") {
      eventProperties['Type'] = 'DiagnosticTools';
      eventProperties['Tool'] = instanceId ? instanceId : "";
    }

    this.telemetryService.logEvent(TelemetryEventNames.RefreshClicked, eventProperties);
    if (isDiagnosticToolUIPage) {
      // Currently there is no easy way to force reloading the static UI child component under DiagnosticTools Category
      this.router.navigate(['overview'], { relativeTo: this._route, skipLocationChange: true }).then(() => this.router.navigate([`tools/${instanceId}`], { relativeTo: this._route }));
    }
    else if (instanceId) {
      this._detectorControlService.refresh(instanceId);
    }
  }


  ngAfterViewInit() {
    // Async to get button element after grandchild is rendered
    setTimeout(() => {
      this.updateAriaExpanded();
    });
  }


  updateAriaExpanded() {
    const btns = document.querySelectorAll("#fab-command-bar button");
    const pdfButtonId = "generatePDFButton";
    const coachMarkId = "fab-coachmark";
    let PDFButtonIndex = -1;
    if (btns && btns.length > 0) {
      btns.forEach((btn,i) => {
        if(btn.textContent.includes(this.gRPDFButtonText)) {
          PDFButtonIndex = i;
        }
      });

      if(PDFButtonIndex >= 0 && PDFButtonIndex < btns.length && btns[PDFButtonIndex]) {
        const PDFButton = btns[PDFButtonIndex];
        PDFButton.setAttribute("id", pdfButtonId);
      }
    }

    this.gRPDFButtonId = `#${pdfButtonId}`;
    this.gRPDFCoachmarkId = `#${coachMarkId}`;
  }

  coachMarkViewed() {
    if (!this.showTeachingBubble){
      
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
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }

    this.removeTeachingBubbleFromDom();
  }

  showingTeachingBubble(){
    if (this.displayRPDFButton){
      this.showTeachingBubble = true;
    }
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
