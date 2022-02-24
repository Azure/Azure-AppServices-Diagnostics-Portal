import {
  DetectorControlService, DiagnosticService, DetectorMetaData, DetectorResponse, TelemetryService, TelemetryEventNames, TelemetrySource
} from 'diagnostic-data';
import { Component, AfterViewInit, Input } from '@angular/core';
import { Globals } from '../../../globals';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../../shared/models/site';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { DirectionalHint } from 'office-ui-fabric-react';
import { ResiliencyScoreReportHelper } from '../../../shared/utilities/resiliencyScoreReportHelper';
import { BehaviorSubject } from 'rxjs';

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

  public _checkIsWindowsApp(): boolean {
    let webSiteService = this._resourceService as WebSitesService;
    return this._resourceService && this._resourceService instanceof WebSitesService
      && (webSiteService.platform === OperatingSystem.windows);
  }

  ngOnInit(): void {
    let subscriptionId = this._route.parent.snapshot.params['subscriptionid'];
    // add logic for presenting initially to only 1% of Subscriptions:  percentageToRelease = 0.01% (1=100%)
    let percentageToRelease = 0.01;
    // roughly split of percentageToRelease of subscriptions to use new feature.
    let firstDigit = "0x" + subscriptionId.substr(0, 1);
    this.displayRPDFButton = (16 - parseInt(firstDigit, 16)) / 16 <= percentageToRelease && this._checkIsWindowsApp();
    this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonDisplayed, { 'ResiliencyScoreButtonDisplayed': this.displayRPDFButton.toString(), 'SubscriptionId': this._route.parent.snapshot.params['subscriptionid'] });
    const loggingError = new Error();
    this.gRPDFButtonDisabled = false;
    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean   
    try {
      if (localStorage.getItem("showCoachmark") != undefined) {
        this.showCoachmark = localStorage.getItem("showCoachmark") === "true";
      }
      else {
        this.showCoachmark = true;
      }
    }
    catch (error) {
      loggingError.message = 'Error trying to retrieve showCoachmark from localStorage';
      loggingError.stack = error;
      let _severityLevel: SeverityLevel = SeverityLevel.Warning;
      this.telemetryService.logException(loggingError, null, null, _severityLevel);
    }
  }

  constructor(private globals: Globals, private _detectorControlService: DetectorControlService, private _diagnosticService: DiagnosticService, private _route: ActivatedRoute, private router: Router, private telemetryService: TelemetryService, private _resourceService: ResourceService) {
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
    let sT = new Date();
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
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}`, this.generatedOn);
        }
        else {
          this.gRPDFFileName = `${this.gRPDFFileName}`;
          ResiliencyScoreReportHelper.generateResiliencyReport(httpResponse.dataset[0].table, `${this.gRPDFFileName}_(cached)`, this.generatedOn);
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
        this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportButtonClicked, eventProperties);
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
    let PDFButtonIndex = btns.length;
    if (btns && btns.length > 0) {
      btns.forEach((btn,i) => {
        if(btn.textContent.includes(this.gRPDFButtonText)) {
          PDFButtonIndex = i;
        }
      });
      const PDFButton = btns[PDFButtonIndex];
      PDFButton.setAttribute("id", pdfButtonId);
    }

    this.gRPDFButtonId = `#${pdfButtonId}`;
    this.gRPDFCoachmarkId = `#${coachMarkId}`;
  }

  coachMarkViewed() {
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
  }
}
