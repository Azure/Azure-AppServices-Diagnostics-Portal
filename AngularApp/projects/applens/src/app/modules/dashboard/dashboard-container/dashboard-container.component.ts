import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { Observable, Subscription } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ObserverService } from '../../../shared/services/observer.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { StartupService } from '../../../shared/services/startup.service';
import { AppLensCloudRegionUtility, AppLensCloudRegion } from '../../../shared/utilities/applens-cloud-region-utility';
import { DirectionalHint } from 'office-ui-fabric-react';
import { DetectorResponse, TelemetryEventNames, TelemetryService, ResiliencyScoreReportHelper } from 'diagnostic-data';
import { SeverityLevel } from '@microsoft/applicationinsights-web';
import { HttpClient } from '@angular/common/http';
import { DetectorControlService } from 'diagnostic-data';
import { ObserverSiteSku, ObserverSkuType } from '../../../shared/models/observer';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'dashboard-container',
  templateUrl: './dashboard-container.component.html',
  styleUrls: ['./dashboard-container.component.scss']
})

export class DashboardContainerComponent implements OnInit {

  keys: string[];
  keyPairs: [string, string][] = [];
  resource: any;
  resourceReady: Observable<any>;
  resourceDetailsSub: Subscription;
  observerLink: string = "";
  stampAppLensLink: string = "";
  ascResourceExplorerLink:string = "";
  showMetrics: boolean = true;

// Variables used by Download Report button    
  detector: string = "";
  siteSku: ObserverSiteSku;
  subscriptionId: string;
  displayDownloadReportButton: boolean = false;
  displayDownloadReportButtonStyle: any = {};
  downloadReportId: string;
  downloadReportText: string = "Get Resiliency Score report";
  downloadReportIcon: any = { iconName: 'Download' };
  downloadReportButtonDisabled: boolean;
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

    constructor(public _resourceService: ResourceService, private _startupService: StartupService, private _diagnosticApiService: DiagnosticApiService, private _applensDiagnosticApiService: ApplensDiagnosticService,  private _observerService: ObserverService, private _applensGlobal: ApplensGlobal,  private _activatedRoute: ActivatedRoute, private _telemetryService: TelemetryService, private _http:HttpClient, private _detectorControlService: DetectorControlService, private _adalService: AdalService) {
    let caseNumber = this._activatedRoute.snapshot.queryParams['caseNumber']? this._activatedRoute.snapshot.queryParams['caseNumber']: (this._activatedRoute.snapshot.queryParams['srId']? this._activatedRoute.snapshot.queryParams['srId']: null);
    this.detector = this._activatedRoute.snapshot.queryParams['detector']? this._activatedRoute.snapshot.queryParams['detector']: null;
    if(caseNumber && AppLensCloudRegionUtility.getASCCloudSpecificBaseUri()) {
      this.ascResourceExplorerLink = AppLensCloudRegionUtility.getASCCloudSpecificBaseUri() + "/resourceexplorerv2?srId=" + caseNumber;
    }
  }


  ngOnInit() {
    this.subscriptionId = this._activatedRoute.snapshot.queryParams['subscriptionId'];
    this.showMetrics = !(this._resourceService.overviewPageMetricsId == undefined || this._resourceService.overviewPageMetricsId == "");
    let serviceInputs = this._startupService.getInputs();
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    let userId = alias.replace('@microsoft.com', '').toLowerCase();
    this._telemetryService.logEvent(TelemetryEventNames.HomePageLogUser, {"userId": userId});
    this.resourceReady = this._resourceService.getCurrentResource();
    this._applensGlobal.updateHeader("");
    this.resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;

        if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/hostingenvironments' && this.resource && this.resource.Name) {
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/MiniEnvironments/" + this.resource.Name;
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/sites') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
          this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
          this._diagnosticApiService.Location = this.resource["WebSpace"];
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/sites/" + this.resource.SiteName;

          if (resource['IsXenon']) {
            this._resourceService.imgSrc = this._resourceService.altIcons['Xenon'];
          }
        } else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/containerapps' ||
          serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.app/containerapps') {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource.ServiceAddress;
          this._diagnosticApiService.GeomasterName = this.resource.GeoMasterName;
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/partner/containerapp/" + this.resource.ContainerAppName;
        } else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/staticsites') {
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/staticwebapps/" + this.resource["DefaultHostname"];
        }

        this.keys = Object.keys(this.resource);
        if (this.keys.indexOf('StampName')>=0){
          this.stampAppLensLink = `${window.location.origin}/stamps/${this.resource.StampName}`;
        }
        this.keys.sort((a,b) => a.localeCompare(b));
        this.replaceResourceEmptyValue();
        if (serviceInputs.resourceType.toString().toLowerCase() == "stamps") {
          this.updateAdditionalStampInfo();
        }
        else {
          this.updateVentAndLinuxInfo();
        }
        this.updateAscLink();
        this.convertKeyToKeyPairs(this.keys);
      }
    });
        // Retrieving info about the site 
    // Sample response: {"kind":"app","is_linux":false,"sku":"Standard","actual_number_of_workers":3,"current_worker_size":1}    
    this._observerService.getSiteSku(this.resource.InternalStampName, this.resource.SiteName).subscribe(siteSku => {
      if (siteSku) {
        this.siteSku = siteSku;
      }
    });
    // Detecting whether Download Report button should be displayed or not
    this.displayDownloadReportButton = this.checkIsWindowsApp() || this.checkIsLinuxApp();

    // Logging telemetry for Download Report button
    const dRBDEventProperties = {
      'ResiliencyScoreButtonDisplayed': this.displayDownloadReportButton.toString(),
      'Subscription': this.subscriptionId,
      'Platform': this.siteSku.is_linux != undefined ? !this.siteSku.is_linux ? "Windows" : "Linux" : "",
      'AppType': this.siteSku.kind != undefined ? this.siteSku.kind.toLowerCase() === "app" ? "WebApp" : this.siteSku.kind.toString() : "",
      'resourceSku': this.siteSku.sku != undefined ? this.siteSku.sku.toString(): "",
      'ReportType': 'ResiliencyScore',      
    };
    this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonDisplayed, dRBDEventProperties);
    const loggingError = new Error();

    // Enabling Download Report button
    this.downloadReportButtonDisabled = false;

    //Get showCoachMark value(string) from local storage (if exists), then convert to boolean
    try {
      if (this.displayDownloadReportButton){
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
        'Subscription': this.subscriptionId,
        'Platform': this.siteSku.is_linux != undefined ? !this.siteSku.is_linux ? "Windows" : "Linux" : "",
        'AppType': this.siteSku.kind != undefined ? this.siteSku.kind.toLowerCase() === "app" ? "WebApp" : this.siteSku.kind.toString() : "",
        'resourceSku': this.siteSku.sku != undefined ? this.siteSku.sku.toString(): "",
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
    this._http.get<any>('assets/vfs_fonts.json').subscribe((data: any) => {this.vfsFonts=data});  
  }

  ngAfterViewInit() {
    // Async to get button element after grandchild is rendered
    setTimeout(() => {
      this.updateDownloadReportId();
    });
  }

  // Check if the app is an App Service Windows Standard or higher SKU
  private checkIsWindowsApp() {
    let _sku: ObserverSkuType = ObserverSkuType.All;
    _sku = ObserverSkuType[this.siteSku.sku];
    return this.siteSku && this.getAppType(this.siteSku.kind.toLowerCase()) === "WebApp" && !this.siteSku.is_linux && _sku >= 8; //Only for Web App (Windows) in Standard or higher SKU
  }

  // Check if the app is an App Service Linux Standard or higher SKU
  private checkIsLinuxApp() {
    let _sku: ObserverSkuType = ObserverSkuType.All;      
    _sku = ObserverSkuType[this.siteSku.sku];
    return this.siteSku && this.getAppType(this.siteSku.kind.toLowerCase()) === "LinuxApp" && this.siteSku.is_linux && _sku >= 8; //Only for Web App (Linux) in Standard or higher SKU
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
      btns.forEach((btn,i) => {
        if(btn.textContent.includes(this.downloadReportText)) {
          downloadButtonIndex = i;
        }
      });

      if(downloadButtonIndex >= 0 && downloadButtonIndex < btns.length && btns[downloadButtonIndex]) {
        const downloadButton = btns[downloadButtonIndex];
        downloadButton.setAttribute("id", downloadButtonId);
      }
    }

    this.downloadReportId = `#${downloadButtonId}`;
    this.coachmarkId = `#${coachMarkId}`;
  }

  updateAscLink() {
    if(this.ascResourceExplorerLink && this.resource!= null ) {
          this.resource = {
              ...this.resource,
              ASCLink: `<a href="${this.ascResourceExplorerLink}" target="_blank">Resource Explorer<i class="hyper-link-icon ml-1" aria-hidden="true"></i></a>`
          };
          this.keys.push('ASCLink');
    }
  }

  updateAdditionalStampInfo() {
    if (this.keys.indexOf('JarvisDashboard') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._resourceService.getAdditionalResourceInfo(this.resource).subscribe(resourceInfo => {
            for (let key in resourceInfo) {
              this.resource[key] = resourceInfo[key];
              this.keys.push(key);
            };
            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }

  updateVentAndLinuxInfo() {
    if (this.keys.indexOf('VnetName') == -1 && this.resourceReady != null && this.resourceDetailsSub == null) {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._observerService.getSiteRequestDetails(this.resource.SiteName, this.resource.InternalStampName).subscribe(siteInfo => {
            this.resource['VnetName'] = siteInfo.details.vnetname;
            this.keys.push('VnetName');

            if (this.resource['IsLinux']) {
              this.resource['LinuxFxVersion'] = siteInfo.details.linuxfxversion;
              this.keys.push('LinuxFxVersion');
            }

            this.replaceResourceEmptyValue();
          });
        }
      });
    }
  }

  replaceResourceEmptyValue() {
    this.keys.forEach(key => {
      if (this.resource[key] === "") {
        this.resource[key] = "N/A";
      }
    });
  }

  openFeedback() {
    this._applensGlobal.openFeedback = true;
  }

  copyToClipboard(item, event) {
    navigator.clipboard.writeText(item).then(_ => {
      event.target.src = "/assets/img/copy-icon-copied.png";
    });
    setTimeout(() => {
      event.target.src = "/assets/img/copy-icon.png";
    }, 3000);
  }

  checkWithHref(s: string) {
    return `${s}`.includes("a href");
  }

  private convertKeyToKeyPairs(keys: string[]) {
    for (let i = 0; i < keys.length; i += 2) {
      if (keys.length % 2 === 1 && i === keys.length - 1) {
        this.keyPairs.push([keys[i], ""]);
      } else {
        this.keyPairs.push([keys[i], keys[i + 1]]);
      }
    }
  }

  checkUseEmbeddedHTML(s: any) {
    return `${s}`.trim().startsWith("<a") && `${s}`.trim().endsWith("</a>");
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
        'Message': 'Error trying to retrieve showCoachmark from localStorage'
      }
      this._telemetryService.logEvent(TelemetryEventNames.ResiliencyScoreReportInPrivateAccess, eventProperties);
    }

    this.downloadReportText = "Getting Resiliency Score report...";
    this.downloadReportIcon = {
      iconName: 'Download',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
    this.downloadReportButtonDisabled = true;    

    if (this._activatedRoute.snapshot.params['detector']) {
      this.detector = this._activatedRoute.snapshot.params['detector'];
    }
    else {
      this.detector = this._activatedRoute.parent.snapshot.params['detector'];
    }
    let allRouteQueryParams = this._activatedRoute.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });


    this._applensDiagnosticApiService.getDetector("ResiliencyScore", this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, this._detectorControlService.shouldRefresh, this._detectorControlService.isInternalView, additionalQueryString)
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
          'Subscription': this.subscriptionId,
          'CustomerName': JSON.parse(httpResponse.dataset[0].table.rows[0][0]).CustomerName,
          'NameSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].Name,
          'ScoreSite1': JSON.parse(httpResponse.dataset[0].table.rows[1][0])[0].OverallScore,
          'DetectorTimeTaken': detectorTimeTaken.toString(),
          'TotalTimeTaken': totalTimeTaken.toString(),
          'ReportType': 'ResiliencyScore',
        };
        this._telemetryService.logEvent(TelemetryEventNames.DownloadReportButtonClicked, eventProperties);
        this.downloadReportText = "Get Resiliency Score report";
        this.downloadReportIcon = { iconName: 'Download' };
        this.downloadReportButtonDisabled = false;
      }, error => {
        loggingError.message = `Error calling ${this.detector} detector`;
        loggingError.stack = error;
        this._telemetryService.logException(loggingError);
      });    
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
      this._telemetryService.logException(loggingError, null, null, _severityLevel);
    }

    this.removeTeachingBubbleFromDom();
  }

  showingTeachingBubble(){
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
