import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../startup/services/auth.service';
import { Router, NavigationExtras } from '@angular/router';
import { WindowService } from '../../../startup/services/window.service';
import { environment } from '../../../../environments/environment';
import { StartupInfo } from '../../models/portal';
import { DemoSubscriptions } from '../../../betaSubscriptions';
import { DetectorType } from 'diagnostic-data';


@Component({
  selector: 'resource-redirect',
  templateUrl: './resource-redirect.component.html',
  styleUrls: ['./resource-redirect.component.scss']
})
export class ResourceRedirectComponent implements OnInit {
  private _newVersionEnabled = true;
  constructor(private _authService: AuthService, private _router: Router, private _windowService: WindowService) { }

  ngOnInit() {
    this.navigateToExperience();
  }

  navigateToExperience() {
    this._authService.getStartupInfo()
      .subscribe(info => {
        if (info && info.resourceId && info.token) {
          //   Uncomment to enable only for internal subs
          let split = info.resourceId.split('/');
          let subscriptionId = split[split.indexOf('subscriptions') + 1];
          this._newVersionEnabled = DemoSubscriptions.betaSubscriptions.indexOf(subscriptionId) >= 0;

          // If it's internal subscription and windows app, enable newer version of UI
          if ((this._newVersionEnabled || (info.pesId && info.pesId === "14748"))) {
            const navigationExtras: NavigationExtras = {
              queryParamsHandling: 'merge',
            };

            let path = 'resource/' + info.resourceId.toLowerCase();
            var caseSubject = null;
            if (info.optionalParameters) {
              var caseSubjectParam = info.optionalParameters.find(param => param.key === "caseSubject");
              if (caseSubjectParam) {
                caseSubject = caseSubjectParam.value;
              }

              var referrerParam = info.optionalParameters.find(param => param.key.toLowerCase() === "referrer");
              if (referrerParam) {
                path += `/portalReferrerResolver`;
                this._router.navigateByUrl(
                  this._router.createUrlTree([path])
                );
              }
            }

            // This additional info is used to open a specific detector/tool under the right category in a new SCIFrameblade
            // To Open the detector or diagnostic tool under the right category
            if (info.optionalParameters)
            {
              let categoryIdParam = info.optionalParameters.find(param => param.key === "categoryId");
              if (categoryIdParam) {
                let categoryId = categoryIdParam.value;
                path += `/categories/${categoryId}`;

                // To Open the overview page under the right category
                let detectorTypeParam = info.optionalParameters.find(param => param.key === "detectorType");
                let detectorIdParam = info.optionalParameters.find(param => param.key === "detectorId");
                let toolIdParam = info.optionalParameters.find(param => param.key === "toolId");
                
                if (detectorIdParam && detectorTypeParam) {
                  if (detectorTypeParam.value === DetectorType.Detector) {
                    path += `/detectors/${detectorIdParam.value}`;
                  } else if (detectorTypeParam.value === DetectorType.Analysis) {
                    path += `/analysis/${detectorIdParam.value}`;
                  }
                } else if (toolIdParam) {
                  path += `/tools/${toolIdParam.value}`;
                }

                this._router.navigateByUrl(
                  this._router.createUrlTree([path], navigationExtras)
                );
              }
            }

            if (info.supportTopicId) {
              path += `/supportTopicId`;
              navigationExtras.queryParams = {
                supportTopicId: info.supportTopicId,
                caseSubject: caseSubject,
                pesId: info.pesId
              };
            }

            this._router.navigateByUrl(
              this._router.createUrlTree([path], navigationExtras)
            );
          }
          else {
            const navigationExtras: NavigationExtras = {
              queryParamsHandling: 'merge',
            };
  
            let path = 'resource/' + info.resourceId.toLowerCase();
            var caseSubject = null;
            if (info.optionalParameters){
              var caseSubjectParam = info.optionalParameters.find(param => param.key === "caseSubject");
              if (caseSubjectParam){
                caseSubject = caseSubjectParam.value;
              }
  
              var referrerParam = info.optionalParameters.find(param => param.key.toLowerCase() === "referrer");
              if (referrerParam){
                path += `/portalReferrerResolver`;
                this._router.navigateByUrl(
                  this._router.createUrlTree([path])
                  );
              }
            }
            if (info.supportTopicId) {
              path += `/supportTopicId`;
              navigationExtras.queryParams = {
                supportTopicId: info.supportTopicId,
                caseSubject: caseSubject,
                pesId: info.pesId
              };
            }
  
            this._router.navigateByUrl(
              this._router.createUrlTree([path], navigationExtras)
            );
          }
        } else {
          if (!environment.production) {
            this._router.navigateByUrl('/test');
          }
        }
      });
  }

  updateRouteBasedOnAdditionalParameters(route: string, additionalParameters: any): string {
    if (additionalParameters.featurePath) {
      let featurePath: string = additionalParameters.featurePath;
      featurePath = featurePath.startsWith('/') ? featurePath.replace('/', '') : featurePath;

      return `${route}/${featurePath}`;
    }
  }

  getRouteBasedOnSupportTopicId(info: StartupInfo): string {

    let path: string;

    // If no support topic id, then default to diagnostics home page
    if (!info.supportTopicId || info.supportTopicId === '') {
      path = '/diagnostics';
    } else {
      path = `/supportTopic/${info.supportTopicId}`;
    }

    return path;

  }

}
