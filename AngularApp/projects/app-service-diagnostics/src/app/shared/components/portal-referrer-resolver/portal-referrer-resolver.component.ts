import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../startup/services/auth.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { PortalReferrerMap, PortalReferrerInfo } from '../../models/portal-referrer-map';
import { DetectorType, TelemetryService } from 'diagnostic-data';
import { ArmService } from '../../services/arm.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../models/portal';
import { OperatingSystem } from '../../models/site';

@Component({
  selector: 'portal-referrer-resolver',
  templateUrl: './portal-referrer-resolver.component.html',
  styleUrls: ['./portal-referrer-resolver.component.scss']
})
export class PortalReferrerResolverComponent implements OnInit {
  private portalReferrerToDetectorMap: PortalReferrerMap[];
  public loadingMessage: string;
  public isEvaluating: boolean;

  constructor(private _authService: AuthService, private _router: Router, private _activatedRoute: ActivatedRoute,
    private _resourceService: ResourceService, private _logService: TelemetryService) {
    this.isEvaluating = true;
    this.loadingMessage = 'Collecting data to analyze your issue...';


    this._resourceService.getIbizaBladeToDetectorMapings().subscribe(mappingArray => {
      if (mappingArray && mappingArray.length > 0) {
        this.portalReferrerToDetectorMap = mappingArray;
      }
      else {
        this.portalReferrerToDetectorMap = [];
      }
    });

    this._authService.getStartupInfo().subscribe(startUpInfo => {
      var referrerParam = startUpInfo.optionalParameters.find(param => param.key.toLowerCase() === "referrer");
      if (referrerParam) {
        this.matchReferrerAndRoute(referrerParam.value);
      }
    });
  }

  public isCollectingData(): boolean {
    return this.isEvaluating;
  }

  ngOnInit() {
  }

  matchReferrerAndRoute(referrer: PortalReferrerInfo): void {
    let path = `resource${this._resourceService.resourceIdForRouting}`;
    let startTimeStr = "";
    let endTimeStr = "";
    let queryParamsJson: {} = { "redirectFrom": "referrer" };

    if (referrer.StartTime && referrer.EndTime) {
      startTimeStr = referrer.StartTime;
      endTimeStr = referrer.EndTime;
      queryParamsJson = { ...queryParamsJson, startTime: startTimeStr, endTime: endTimeStr };
    }

    // Map the right "Availability and Performance" overview detector for Load testing resources.
    if (!!referrer.ExtensionName && !!referrer.BladeName && referrer.ExtensionName === "Microsoft_Azure_CloudNativeTesting" && referrer.BladeName === "ReportsBlade") {
      if (this._resourceService && this._resourceService instanceof WebSitesService) {
        let categoryId = "AvailabilityAndPerformanceWindows";
        if ((this._resourceService as WebSitesService).appType === AppType.FunctionApp) {
          categoryId = "AvailabilityAndPerformanceFunctionApp";
        } else if ((this._resourceService as WebSitesService).appType === AppType.WorkflowApp) {
          categoryId = "AvailabilityAndPerformanceLogicApp";
        }

        if ((this._resourceService as WebSitesService).platform === OperatingSystem.linux) {
          categoryId = "AvailabilityAndPerformanceLinux";
        }

        path += `/categories/${categoryId}/overview`;
      }

      this._logService.logEvent('IntegratedDiagnostics', {
        details: 'Redirect from load testing blade.',
        path: path,
        referrerInformation: JSON.stringify(referrer),
        targetType: '',
        target: '',
        startTime: startTimeStr,
        endTime: endTimeStr
      });
    }
    else {
      if (!!referrer.CategoryId) {
        let categoryId = referrer.CategoryId;
        path += `/categories/${categoryId}`;
      }

      if (
        referrer.DetectorType && (referrer.DetectorType.toLowerCase() === DetectorType.Analysis.toLowerCase() || referrer.DetectorType.toLowerCase() === DetectorType.Detector.toLowerCase() || referrer.DetectorType.toLowerCase() === DetectorType.Workflow.toLowerCase()) &&
        referrer.DetectorId && referrer.DetectorId.length > 1
      ) {

        this._logService.logEvent('IntegratedDiagnostics', {
          details: 'Redirect decided by Ibiza parameters.',
          path: path,
          referrerInformation: JSON.stringify(referrer),
          targetType: referrer.DetectorType,
          target: referrer.DetectorId,
          startTime: startTimeStr,
          endTime: endTimeStr
        });

        if (referrer.DetectorType.toLowerCase() === DetectorType.Analysis.toLowerCase()) {
          path = `${path}/analysis/${referrer.DetectorId}`;
        } else if (referrer.DetectorType.toLowerCase() === DetectorType.Detector.toLowerCase()) {
          path = `${path}/detectors/${referrer.DetectorId}`;
        } else if (referrer.DetectorType.toLowerCase() === DetectorType.DiagnosticTool.toLowerCase()) {
          path = `${path}/tools/${referrer.DetectorId}`;
        } else if (referrer.DetectorType.toLowerCase() === DetectorType.Workflow.toLowerCase()) {
          path = `${path}/workflows/${referrer.DetectorId}`;
        }
      }
      else {
        var referrerMatch = this.portalReferrerToDetectorMap.find(referrerMap =>
          referrerMap.ReferrerExtensionName.toLowerCase() === referrer.ExtensionName.toLowerCase() &&
          referrerMap.ReferrerBladeName.toLowerCase() === referrer.BladeName.toLowerCase() &&
          referrerMap.ReferrerTabName.toLowerCase() === referrer.TabName.toLowerCase()
        );


        if (referrerMatch) {
          if (referrerMatch.DetectorType === DetectorType.Detector) {
            path = `${path}/detectors/${referrerMatch.DetectorId}`;
          }
          else if (referrerMatch.DetectorType === DetectorType.Analysis) {
            path = `${path}/analysis/${referrerMatch.DetectorId}`;
          }
          else if (referrerMatch.DetectorType === DetectorType.DiagnosticTool) {
            path = `${path}/tools/${referrerMatch.DetectorId}`;
          } else if (referrerMatch.DetectorType === DetectorType.Workflow) {
            path = `${path}/workflows/${referrerMatch.DetectorId}`;
          }

          this._logService.logEvent('IntegratedDiagnostics', {
            details: 'Redirect decided by detector map.',
            path: path,
            referrerInformation: JSON.stringify(referrer),
            targetType: referrerMatch.DetectorType,
            target: referrerMatch.DetectorId,
            startTime: startTimeStr,
            endTime: endTimeStr
          });
        }
        else {
          this._logService.logEvent('IntegratedDiagnostics', {
            details: 'Redirecting to home as detector map did not contain a match and Ibiza did not pass redirect parameters.',
            path: path,
            referrerInformation: JSON.stringify(referrer),
            targetType: '',
            target: ''
          });
        }
      }
    }



    this.isEvaluating = false;
    this._router.navigate([path], { queryParamsHandling: 'merge', queryParams: queryParamsJson });
  }
}
