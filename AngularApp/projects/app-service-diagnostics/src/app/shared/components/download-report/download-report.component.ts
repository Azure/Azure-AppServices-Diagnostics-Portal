import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DetectorControlService, DetectorMetaData, DetectorResponse, DiagnosticService, ResiliencyScoreReportHelper, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { DemoSubscriptions } from '../../../betaSubscriptions';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { AuthService } from '../../../startup/services/auth.service';
import { AppType } from '../../models/portal';
import { Sku } from '../../models/server-farm';
import { OperatingSystem } from '../../models/site';

@Component({
  selector: 'download-report',
  templateUrl: './download-report.component.html',
  styleUrls: ['./download-report.component.scss']
})
export class DownloadReportComponent implements OnInit {

  time: string;
  detector: DetectorMetaData;
  detectorName: string;
  resourceName: string;
  fullReportPath: string;
  subscriptionId: string;
  resourceGroup: string;
  resourceType: string;
  isDownloaded: boolean = false;
  downloadReportText: string = "Downloading Report...";
  downloadReportFileName: string;
  generatedOn: string = "";
  resourcePlatform: OperatingSystem = OperatingSystem.any;
  resourceAppType: AppType = AppType.WebApp;
  resourceSku: Sku = Sku.All;
  vfsFonts: any;
  timer: any = 0;
  countDownTimer: any = 10;


  constructor(private _resourceService: ResourceService, private _route: ActivatedRoute, private telemetryService: TelemetryService,
    private http: HttpClient, private _diagnosticService: DiagnosticService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _authService: AuthService) { }

  ngOnInit(): void {
    this.subscriptionId = this._route.parent.parent.snapshot.params['subscriptionid'];
    this.resourceGroup = this._route.parent.parent.snapshot.params['resourcegroup'];
    this.resourceType = this._route.parent.parent.snapshot.data.data.type;
    this.resourceName = this._route.parent.parent.snapshot.params['resourcename'];
    this.detectorName = this._route.snapshot.params['detectorName'];

    this.generateReportPDF();
  }

  private generateReportPDF() {
    // Taking starting time
    let sT = new Date();
    const eventProperties = {
      'Subscription': this.subscriptionId,
      'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
      'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString() : "",
      'resourceSku': this.resourceSku != undefined ? this.resourceSku.toString() : "",
      'DetectorName': this.detectorName,
    };
    const loggingError = new Error();
    // Checking if the detector is ResiliencyScore
    if (this.detectorName.toLocaleLowerCase() === "resiliencyscore") {
      if (this._ResiliencyReportSupported()) {
        this.telemetryService.logEvent(TelemetryEventNames.DownloadReportDirectLinkUsed, eventProperties);
        //
        // Retrieving custom fonts from assets/vfs_fonts.json in each project, to be passed to 
        // PDFMake to generate ResiliencyScoreReport. 
        // Using this as an alternative to using the vfs_fonts.js build with PDFMake's build-vfs.js
        // as this file caused problems when being compiled in a library project like diagnostic-data
        //
        this.http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => { this.vfsFonts = data });
        // Getting the detector response
        this._diagnosticService.getDetector(this.detectorName, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
          .subscribe((httpResponse: DetectorResponse) => {
            //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
            let eT = new Date();
            let detectorTimeTaken = eT.getTime() - sT.getTime();

            if (this.downloadReportFileName == undefined) {
              this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
              this.downloadReportFileName = `${this.detectorName}-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":", "-")}`;
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
            let eventProperties = {
              'Subscription': this.subscriptionId,
              'CustomerName': JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName,
              'NameSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].Name,
              'ScoreSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].OverallScore,
              'DetectorTimeTaken': detectorTimeTaken.toString(),
              'TotalTimeTaken': totalTimeTaken.toString()
            };
            this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportDownloaded, eventProperties);
            this.downloadReportText = "Report downloaded";
            this.isDownloaded = true;
            this.redirectToAvailabilityAndPerformance();
          }, error => {
            loggingError.message = 'Error calling ResiliencyScore detector';
            loggingError.stack = error;
            this.telemetryService.logException(loggingError);
          });
      }
      else {
        window.clearInterval(this.timer);
        this.isDownloaded = true;
        this.downloadReportText = "Resource not supported by Resiliency Score Report. Only Web Apps in Standard plans or higher are supported. </br> Redirecting in";
        // log telemetry for interaction        
        this.telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportResourceNotSupported, eventProperties);
        this.timer = window.setInterval(() => {
          this.countDownTimer--;
          if (this.countDownTimer == 0) {
            window.clearInterval(this.timer);
            this.redirectToAvailabilityAndPerformance();
          }
        }, 1000);
      }
    }
    else {
      this.telemetryService.logEvent(TelemetryEventNames.DownloadReportDirectLinkUsed, eventProperties);
      //
      // Retrieving custom fonts from assets/vfs_fonts.json in each project, to be passed to 
      // PDFMake to generate DownloadableReport. 
      // Using this as an alternative to using the vfs_fonts.js build with PDFMake's build-vfs.js
      // as this file caused problems when being compiled in a library project like diagnostic-data
      //
      this.http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => { this.vfsFonts = data });
      // Getting the detector response
      this._diagnosticService.getDetector(this.detectorName, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
        .subscribe((httpResponse: DetectorResponse) => {
          //If the page hasn't been refreshed this will use a cached request, so changing File Name to use the same name + "(cached)" to let them know they are seeing a cached version.
          let eT = new Date();
          let detectorTimeTaken = eT.getTime() - sT.getTime();

          if (this.downloadReportFileName == undefined) {
            this.generatedOn = ResiliencyScoreReportHelper.generatedOn();
            this.downloadReportFileName = `${this.detectorName}-${JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName}-${this.generatedOn.replace(":", "-")}`;
            // ResiliencyScoreReportHelper.generateDownloadableReport method not implemented yet
            //ResiliencyScoreReportHelper.generateDownloadableReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}`, this.generatedOn, this.vfsFonts);
          }
          else {
            this.downloadReportFileName = `${this.downloadReportFileName}`;
            // ResiliencyScoreReportHelper.generateDownloadableReport method not implemented yet
            // ResiliencyScoreReportHelper.generateDownloadableReport(httpResponse.dataset[0].table, `${this.downloadReportFileName}_(cached)`, this.generatedOn, this.vfsFonts);
          }
          // Time after downloading report
          eT = new Date();
          // Estimate total time it took to download report
          let totalTimeTaken = eT.getTime() - sT.getTime();
          // log telemetry for interaction
          let eventProperties = {
            'Subscription': this.subscriptionId,
            'Platform': this.resourcePlatform != undefined ? this.resourcePlatform.toString() : "",
            'AppType': this.resourceAppType != undefined ? this.resourceAppType.toString(): "",
            'ResourceSku': this.resourceSku != undefined ? this.resourceSku.toString(): "",
            'DetectorName': this.detectorName,
            'ResourceName': this.resourceName,
            'DetectorTimeTaken': detectorTimeTaken.toString(),
            'TotalTimeTaken': totalTimeTaken.toString()
          };
          this.telemetryService.logEvent(TelemetryEventNames.DownloadReportDirectLinkDownloaded, eventProperties);
          this.downloadReportText = "Report downloaded";
          this.isDownloaded = true;
          this.redirectToAvailabilityAndPerformance();
        }, error => {
          loggingError.message = `Error calling ${this.detectorName} detector`;
          loggingError.stack = error;
          this.telemetryService.logException(loggingError);
        });
    }
  }

  private _checkIsWebAppProdSku(platform: OperatingSystem): boolean {
    let webSiteService = this._resourceService as WebSitesService;
    this.resourcePlatform = webSiteService.platform;
    this.resourceAppType = webSiteService.appType;
    this.resourceSku = webSiteService.sku;
    return this._resourceService && this._resourceService instanceof WebSitesService
      && ((webSiteService.platform === platform) && (webSiteService.appType === AppType.WebApp) && (webSiteService.sku > 8)); //Only for Web Apps in Standard or higher
  }

  // add logic for presenting initially to 100% of Subscriptions:  percentageToRelease = 1 (1=100%)
  private _percentageOfSubscriptions(subscriptionId: string, percentageToRelease: number): boolean {
    let firstDigit = "0x" + subscriptionId.substring(0, 1);
    // roughly split of percentageToRelease of subscriptions to use new feature.
    return ((16 - parseInt(firstDigit, 16)) / 16 <= percentageToRelease);
  }

  private _ResiliencyReportSupported(): boolean {
    let _isSubIdInPercentageToRelease: boolean = false;
    let _isBetaSubscription: boolean = false;
    // allowlisting beta subscriptions for testing purposes
    _isBetaSubscription = DemoSubscriptions.betaSubscriptions.indexOf(this.subscriptionId) >= 0;
    // allowing 0% of subscriptions to use new feature
    _isSubIdInPercentageToRelease = this._percentageOfSubscriptions(this.subscriptionId, 1);

    // Releasing to only Beta Subscriptions for Web App (Linux) in standard or higher and all Web App (Windows) in standard or higher
    if (this._checkIsWebAppProdSku(OperatingSystem.linux) && (_isSubIdInPercentageToRelease || _isBetaSubscription) || this._checkIsWebAppProdSku(OperatingSystem.windows)) {
      return true;
    }
  }


  // Redirecting to AvailabilityandPerformance category
  private redirectToAvailabilityAndPerformance() {
    this._router.navigate([`../../`], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
