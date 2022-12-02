import { Component, OnInit, OnDestroy } from '@angular/core';
import { ArmService } from './../../../shared/services/arm.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import {
  ProviderRegistration,
  FeatureRegistration
} from '../../../shared/models/feature-registration';
import { Subscription, timer, BehaviorSubject } from 'rxjs';
import { ArmResource } from '../../../shared-v2/models/arm';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { PortalKustoTelemetryService } from '../../../shared/services/portal-kusto-telemetry.service';
import { HttpResponse } from '@angular/common/http';

const scanTag = 'hidden-related:diagnostics/changeAnalysisScanEnabled';
const baseImgPath = 'assets/img/azure-icons';

@Component({
  selector: 'diagnostics-settings',
  templateUrl: './diagnostics-settings.component.html',
  styleUrls: ['./diagnostics-settings.component.scss']
})
export class DiagnosticsSettingsComponent implements OnInit, OnDestroy {
  // Loading related properties
  showResourceProviderRegStatus: boolean = false;
  pollingResourceProviderRegProgress: boolean = false;
  isEnabled = false;
  updatingTag: boolean = false;
  resourceProviderRegState: string = '';
  showGeneralError: boolean = false;
  generalErrorMsg: string = '';
  isSaveBtnEnable: boolean = false;
  isExpanded: boolean = false;
  loadingTable: boolean = false;
  // Resource Properties
  private subscriptionId: string;
  private currentResource: ArmResource;
  private resourceId: string = '';
  private servicePlanId: string = '';

  servicePlan: ArmResource;
  webApps: ArmResource[];
  enableButtonSelectedArray: boolean[];
  private isHiddenTagsArrayChanged: BehaviorSubject<boolean[]> =
    new BehaviorSubject<boolean[]>([]);
  private isPlanHiddenTagsChanged: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);
  private prevEnableAppServicePlan: boolean;
  private prevEnableBtnSelectedArr: boolean[];

  // ARM Urls
  private providerStatusUrl: string = '';

  // Registration Status
  private pollResourceProviderStatusSubscription: Subscription;
  private isRPRegistered: BehaviorSubject<boolean> =
    new BehaviorSubject<boolean>(false);

  constructor(
    private armService: ArmService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute,
    private resourceService: ResourceService,
    private loggingService: PortalKustoTelemetryService
  ) {}

  ngOnInit() {
    this.subscriptionId =
      this.activatedRoute.snapshot.params['subscriptionid'] != null
        ? this.activatedRoute.snapshot.params['subscriptionid']
        : this.activatedRoute.parent.snapshot.params['subscriptionid'];
    this.authService.getStartupInfo().subscribe((data) => {
      this.resourceId = data.resourceId;
    });

    this.loadingTable = true;
    this.providerStatusUrl = `/subscriptions/${this.subscriptionId}/providers/Microsoft.ChangeAnalysis`;
    this.pollResourceProviderRegStatus();
    this.armService
      .getResourceFullResponse<any>(this.resourceId, true, '2016-08-01')
      .subscribe((response) => {
        let appServicePlanResponse = <ArmResource>response.body;
        this.servicePlanId = appServicePlanResponse.properties.serverFarmId;

        //get app service plan
        this.armService
          .getResourceFullResponse<any>(this.servicePlanId, true, '2016-09-01')
          .subscribe(
            (response) => {
              this.servicePlan = <ArmResource>response.body;
              const isHiddenTagsEnabled = this.checkScanPlanEnabled(
                this.servicePlan
              );
              this.isPlanHiddenTagsChanged.next(isHiddenTagsEnabled);
              this.prevEnableAppServicePlan = isHiddenTagsEnabled;
              //get all web app under this app service plan
              this.armService
                .getResourceFullResponse<any>(
                  `${this.servicePlanId}/sites`,
                  true,
                  '2016-09-01'
                )
                .subscribe((response) => {
                  this.webApps = <ArmResource[]>response.body.value;

                  const updatedHiddenTagsArray = this.webApps.map((webapp) => {
                    return this.checkWebAppEnabled(webapp);
                  });
                  this.prevEnableBtnSelectedArr = updatedHiddenTagsArray;
                  this.isHiddenTagsArrayChanged.next(updatedHiddenTagsArray);
                  this.loadingTable = false;
                });
            },
            (error: any) => {
              this.logHTTPError(error, 'Cannot fetch App Service Plan,');
              this.loadingTable = false;
              this.showGeneralError = true;
              this.servicePlan = null;
              if (error.status === 403) {
                this.generalErrorMsg = this.getGeneralErrorMsg(
                  'You do not have authorization to perform this operation. Make sure you have the required permissions to this App Service Plan and try again later.'
                );
              } else {
                this.generalErrorMsg =
                  'Unable to fetch App Service Plan details';
              }
            }
          );
      });

    this.isHiddenTagsArrayChanged.subscribe((data) => {
      this.enableButtonSelectedArray = data;
    });

    this.isPlanHiddenTagsChanged.subscribe((data) => {
      this.isEnabled = data;
    });

    this.currentResource = this.resourceService.resource;
  }

  private pollResourceProviderRegStatus(): void {
    this.pollingResourceProviderRegProgress = true;
    this.pollResourceProviderStatusSubscription = timer(0, 5000).subscribe(
      (_) => {
        this.checkIfResourceProviderRegistered();
      }
    );
  }

  private checkIfResourceProviderRegistered(): void {
    this.armService
      .getResourceFullResponse<any>(this.providerStatusUrl, true, '2018-05-01')
      .subscribe(
        (response) => {
          let providerRegistrationStateResponse = <ProviderRegistration>(
            response.body
          );
          let state =
            providerRegistrationStateResponse.registrationState.toLowerCase();
          this.resourceProviderRegState = state;
          if (
            state === 'registered' ||
            state === 'unregistered' ||
            state === 'notregistered'
          ) {
            this.pollingResourceProviderRegProgress = false;
            this.showResourceProviderRegStatus = false;
            if (this.pollResourceProviderStatusSubscription) {
              this.pollResourceProviderStatusSubscription.unsubscribe();
            }

            this.isRPRegistered.next(state === 'registered' ? true : false);
          } else {
            // only show the regstration status when it needs long polling
            this.showResourceProviderRegStatus = true;
          }
        },
        (error: any) => {
          this.logHTTPError(error, 'checkIfResourceProviderRegistered');
          this.pollingResourceProviderRegProgress = false;
          this.showResourceProviderRegStatus = false;
          this.showGeneralError = true;
          this.generalErrorMsg = this.getGeneralErrorMsg(
            'Unable to check Change Analysis Resource Provider status. ',
            error.status
          );
          if (this.pollResourceProviderStatusSubscription) {
            this.pollResourceProviderStatusSubscription.unsubscribe();
          }
        }
      );
  }

  private checkScanPlanEnabled(resource: ArmResource): boolean {
    let tags = resource.tags;
    if (tags && tags[scanTag] === 'true') {
      return true;
    }
    return false;
  }

  private checkWebAppEnabled(resource: ArmResource): boolean {
    // First check if WebApp has any tags set on it and return if its enabled.
    let tags = resource.tags;
    if (tags && tags[scanTag]) {
      return tags[scanTag] === 'true';
    }
    // Otherwise return App Service Plan's setting.
    return this.checkScanPlanEnabled(this.servicePlan);
  }

  private logHTTPError(error: any, methodName: string): void {
    let errorLoggingProps = {
      errorMsg: error.message ? error.message : 'Server Error',
      statusCode: error.status ? error.status : 500
    };
    this.loggingService.logTrace(
      'HTTP error in ' + methodName,
      errorLoggingProps
    );
  }

  private clearErrors(): void {
    this.generalErrorMsg = '';
    this.showGeneralError = false;
  }

  ngOnDestroy(): void {
    this.unregisterSubscription(this.pollResourceProviderStatusSubscription);
  }

  private unregisterSubscription(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  private getGeneralErrorMsg(baseMsg: string, errorStatus?: number) {
    if (errorStatus === 403) {
      return (
        baseMsg +
        'You may not have sufficient permissions to perform this operation. Make sure you have required permissions for this subscription and try again.'
      );
    } else if (errorStatus === 401) {
      return (
        baseMsg + 'Your token may have expired. Please refresh and try again.'
      );
    } else if (errorStatus === 409) {
      return (
        baseMsg + 'Your request is being processed. Please check back later.'
      );
    } else if (errorStatus === null) {
      return baseMsg;
    } else {
      return baseMsg + 'Please try again later.';
    }
  }

  togglePlanHandler(event: boolean): void {
    this.isSaveBtnEnable = true;
    this.isPlanHiddenTagsChanged.next(event);
    const enableButtonSelectedArray = this.enableButtonSelectedArray.map(
      (_) => event
    );
    this.isHiddenTagsArrayChanged.next(enableButtonSelectedArray);
  }

  toggleHandler(event: boolean, index: number): void {
    this.isSaveBtnEnable = true;
    const tempArray = [...this.enableButtonSelectedArray];
    tempArray[index] = event;
    this.isHiddenTagsArrayChanged.next(tempArray);
  }

  saveSettings() {
    this.clearErrors();
    this.updateServicePlaTag(this.isEnabled);
  }

  private updateServicePlaTag(enable: boolean): void {
    this.updatingTag = true;
    let tagValue = enable ? 'true' : 'false';
    this.servicePlan.tags = this.servicePlan.tags ? this.servicePlan.tags : {};
    this.servicePlan.tags[scanTag] = tagValue;
    this.armService
      .patchResourceFullResponse(this.servicePlan.id, this.servicePlan, true)
      .subscribe(
        (response: HttpResponse<{}>) => {
          const length = this.enableButtonSelectedArray.length;

          let eventProps = {
            tagName: scanTag,
            tagValue: tagValue,
            servicePlanId: this.servicePlanId
          };
          this.loggingService.logEvent('updateServicePlaTag', eventProps);
          if (response.status < 300) {
            this.isPlanHiddenTagsChanged.next(enable);
            this.prevEnableAppServicePlan = enable;
          }
          setTimeout(() => {
            for (let i = 0; i < length; i++) {
              if (this.checkWebAppShouldUpdate(i)) {
                this.updateWebAppTag(this.enableButtonSelectedArray[i], i);
              }
            }
            this.updatingTag = false;
          }, 1500);
        },
        (error: any) => {
          this.logHTTPError(error, 'updateServicePlaTag');
          this.updatingTag = false;
          this.showGeneralError = true;
          this.generalErrorMsg = this.getGeneralErrorMsg(
            'Error occurred when trying to update service plan tag. ',
            error.status
          );
          //if patch app service plan failed,toggle button back to previous state
          this.isPlanHiddenTagsChanged.next(this.prevEnableAppServicePlan);
        }
      );
  }

  private updateWebAppTag(enable: boolean, index: number): void {
    this.updatingTag = true;
    let tagValue = enable ? 'true' : 'false';
    let webapp = this.webApps[index];

    webapp.tags = webapp.tags ? webapp.tags : {};
    webapp.tags[scanTag] = tagValue;
    webapp.type = 'Microsoft.Web/sites';
    webapp.properties.serverFarmId = this.servicePlanId;
    webapp.properties.serverFarm = null;

    this.armService
      .patchResourceFullResponse(webapp.id, webapp, true)
      .subscribe(
        (response: HttpResponse<{}>) => {
          this.updatingTag = false;
          let data = <ArmResource>response.body;

          let eventProps = {
            tagName: scanTag,
            tagValue: tagValue,
            webAppId: webapp.id
          };
          this.loggingService.logEvent('updateServicePlaTag', eventProps);

          if (data && data.tags && data.tags[scanTag] == 'true') {
            this.checkWebAppSetting(true, index);
          } else {
            this.checkWebAppSetting(false, index);
          }
        },
        (error: any) => {
          this.logHTTPError(error, 'updateWebAppTag');
          this.updatingTag = false;
          this.showGeneralError = true;
          this.generalErrorMsg = this.getGeneralErrorMsg(
            `Error occurred when trying to update ${webapp.name} tag. `,
            error.status
          );
        }
      );
  }

  private checkWebAppSetting(enable: boolean, index: number): void {
    const hiddenTagArray = this.enableButtonSelectedArray;
    hiddenTagArray[index] = enable;
    this.prevEnableBtnSelectedArr = hiddenTagArray;
    this.isHiddenTagsArrayChanged.next(hiddenTagArray);
  }

  private checkWebAppShouldUpdate(index: number): boolean {
    const curEnableWebApp = this.enableButtonSelectedArray[index];
    if (
      curEnableWebApp !== this.prevEnableBtnSelectedArr[index] ||
      curEnableWebApp !== this.isEnabled
    ) {
      return true;
    }
    return false;
  }

  hasContent(): boolean {
    return this.webApps && this.webApps.length > 0;
  }
}
