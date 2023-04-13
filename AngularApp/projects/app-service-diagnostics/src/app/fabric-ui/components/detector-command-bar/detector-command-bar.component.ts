import {
  DetectorControlService, DiagnosticService, DetectorMetaData, DetectorResponse, TelemetryService, TelemetryEventNames, ResiliencyScoreReportHelper
} from 'diagnostic-data';
import { Component, AfterViewInit, Input } from '@angular/core';
import { Globals } from '../../../globals';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { DirectionalHint } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
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
  subscriptionId: string;

  displayRPDFButton: boolean = false;
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
  coachMarkCookieName: string = "showCoachmark";
  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  };
  teachingBubbleCalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge
  };
  teachingBubbleHeadline = "New Resiliency Score report!";
  teachingBubbleText = "Download a report to check how well your Web App scores against our recommended resiliency best practices.";
  resourcePlatform: OperatingSystem = OperatingSystem.any;
  resourceAppType: AppType = AppType.WebApp;
  resourceSku: Sku = Sku.All;
  vfsFonts: any;

  constructor(private globals: Globals, private _detectorControlService: DetectorControlService, private _diagnosticService: DiagnosticService, private _route: ActivatedRoute, private router: Router, private telemetryService: TelemetryService, private _resourceService: ResourceService, private http: HttpClient) {
  }

  ngOnInit(): void {
    let _isSubIdInPercentageToRelease: boolean = false;
    let _isBetaSubscription: boolean = false;
    this.subscriptionId = this._route.parent.snapshot.params['subscriptionid'];
    // allowlisting beta subscriptions for testing purposes
    _isBetaSubscription = DemoSubscriptions.betaSubscriptions.indexOf(this.subscriptionId) >= 0;
    // allowing 100% of subscriptions to use new feature
    _isSubIdInPercentageToRelease = this._percentageOfSubscriptions(this.subscriptionId, 1);

    // Releasing to only Beta Subscriptions for Web App (Linux) in standard or higher and all Web App (Windows) in standard or higher
    this.displayRPDFButton = ((this._checkIsWebAppProdSku(OperatingSystem.linux) && (_isSubIdInPercentageToRelease || _isBetaSubscription)) || this._checkIsWebAppProdSku(OperatingSystem.windows));
    const rSBDEventProperties = {
      'ResiliencyScoreButtonDisplayed': this.displayRPDFButton.toString(),
      'Subscription': this.subscriptionId,
      'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
      'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString() : "",
      'resourceSku': this.resourceSku != undefined ? this.resourceSku.toString() : "",
    };
    this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonDisplayed, rSBDEventProperties);
    const loggingError = new Error();
    this.gRPDFButtonDisabled = false;
    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean
    try {
      if (this.displayRPDFButton) {
        if (localStorage.getItem(this.coachMarkCookieName) != undefined) {
          this.showCoachmark = localStorage.getItem(this.coachMarkCookieName) === "true";
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
        'Subscription': this.subscriptionId,
        'Error': error,
        'Message': `Error trying to retrieve ${this.coachMarkCookieName} from localStorage`
      }
      this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
    }

    //
    // Retrieving custom fonts from assets/vfs_fonts.json in each project, to be passed to 
    // PDFMake to generate ResiliencyScoreReport. 
    // Using this as an alternative to using the vfs_fonts.js build with PDFMake's build-vfs.js
    // as this file caused problems when being compiled in a library project like diagnostic-data
    //
    this.http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => { this.vfsFonts = data });
  }

  private _checkIsWebAppProdSku(platform: OperatingSystem): boolean {
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    if (this.resourcePlatform === OperatingSystem.linux) {
      this.teachingBubbleHeadline = "New Resiliency Score report for Web App (Linux)!";
      this.coachMarkCookieName = "showCoachmarkLinux";
      this.teachingBubbleText = "Resiliency Score Report now supports Web App (Linux) in Standard or higher. Download a report to check how well your Web App scores against our recommended resiliency best practices.";
    }
    return this._resourceService && this._resourceService instanceof WebSitesService
      && ((webSiteService.platform === platform) && (webSiteService.appType === AppType.WebApp) && (webSiteService.sku > 8)); //Only for Web Apps  in Standard or higher
  }

  // add logic for presenting initially to 100% of Subscriptions:  percentageToRelease = 1 (1=100%)
  private _percentageOfSubscriptions(subscriptionId: string, percentageToRelease: number): boolean {
    let firstDigit = "0x" + subscriptionId.substring(0, 1);
    // roughly split of percentageToRelease of subscriptions to use new feature.
    return ((16 - parseInt(firstDigit, 16)) / 16 <= percentageToRelease);
  }

  toggleOpenState() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenGenie, {
      'Place': 'LandingPage'
    })
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
  }

  sendFeedback() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel, {
      'Place': 'LandingPage'
    });
    this.globals.openFeedback = !this.globals.openFeedback;
  }

  generateResiliencyPDF() {
    let sT = new Date();
    const rSEventProperties = {
      'Subscription': this.subscriptionId,
      'TimeClicked': sT.toUTCString()
    };
    this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonClicked, rSEventProperties);
    // Once the button is clicked no need to show Coachmark anymore:
    const loggingError = new Error();
    try {
      if (localStorage.getItem(this.coachMarkCookieName) != undefined) {
        this.showCoachmark = localStorage.getItem(this.coachMarkCookieName) === "true";
      }
      else {
        this.showCoachmark = false;
        localStorage.setItem(this.coachMarkCookieName, "false");
      }
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const eventProperties = {
        'Subscription': this.subscriptionId,
        'Error': error,
        'Message': `Error trying to retrieve ${this.coachMarkCookieName} from localStorage`
      }
      this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
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
          'Subscription': this.subscriptionId,
          'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
          'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString() : "",
          'ResourceSku': this.resourceSku != undefined ? this.resourceSku.toString() : "",
          'CustomerName': JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName,
          'NameSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].Name,
          'ScoreSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].OverallScore,
          'DetectorTimeTaken': detectorTimeTaken.toString(),
          'TotalTimeTaken': totalTimeTaken.toString(),

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

    let instanceId = childRouteType === "overview" ? this._route.snapshot.params["category"] : (this._route.snapshot.params["category"] === "DiagnosticTools" ? childRouteSnapshot.url[1].toString() : childRouteType === "detectors" ? childRouteSnapshot.params["detectorName"] : childRouteType === "workflows" ? childRouteSnapshot.params["workflowId"] : childRouteSnapshot.params["analysisId"]);
    let isDiagnosticToolUIPage = this._route.snapshot.params["category"] === "DiagnosticTools" && childRouteType !== "overview" && instanceId !== "eventviewer" && instanceId !== "freblogs";

    const eventProperties = {
      'Category': this._route.snapshot.params['category'],
      'Place': 'LandingPage'
    };
    if (childRouteType === "detectors") {
      eventProperties['Detector'] = childRouteSnapshot.params['detectorName'];
      eventProperties['Type'] = 'detector';
    } else if (childRouteType === "workflows") {
      eventProperties['Detector'] = childRouteSnapshot.params['workflowId'];
      eventProperties['Type'] = 'detector';
    }
    else if (childRouteType === "analysis") {
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
      btns.forEach((btn, i) => {
        if (btn.textContent.includes(this.gRPDFButtonText)) {
          PDFButtonIndex = i;
        }
      });

      if (PDFButtonIndex >= 0 && PDFButtonIndex < btns.length && btns[PDFButtonIndex]) {
        const PDFButton = btns[PDFButtonIndex];
        PDFButton.setAttribute("id", pdfButtonId);
      }
    }

    this.gRPDFButtonId = `#${pdfButtonId}`;
    this.gRPDFCoachmarkId = `#${coachMarkId}`;
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
      localStorage.setItem(this.coachMarkCookieName, "false");
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const eventProperties = {
        'Subscription': this.subscriptionId,
        'Error': error
      }
      this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
    }

    this.removeTeachingBubbleFromDom();
  }

  showingTeachingBubble() {
    if (this.displayRPDFButton) {
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
