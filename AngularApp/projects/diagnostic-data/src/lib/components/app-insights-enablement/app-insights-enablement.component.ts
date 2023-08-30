import { Component, OnInit, Input } from '@angular/core';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import { HttpHeaders } from '@angular/common/http';
import { SettingsService } from '../../services/settings.service';
import { BackendCtrlQueryService } from '../../services/backend-ctrl-query.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { MessageBarType } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

const maxApiKeysPerAiResource: number = 10;

@Component({
  selector: 'app-insights-enablement',
  templateUrl: './app-insights-enablement.component.html',
  styleUrls: ['./app-insights-enablement.component.scss']
})

export class AppInsightsEnablementComponent implements OnInit {

  constructor(private _appInsightsService: AppInsightsQueryService,
    private _backendCtrlService: BackendCtrlQueryService,
    private _settingsService: SettingsService,
    private _route: ActivatedRoute) {
  }

  loadingSettings: boolean = true;
  loadingCodeOptimizationSettings: boolean = true;
  isAppInsightsEnabled: boolean = false;
  isAppInsightsConnected: boolean = false;
  appInsightsValidated: boolean = false;
  appInsightsResourceUri: string = "";
  appId: string = "";
  connecting: boolean = false;
  error: any;
  appSettingsHaveInstrumentationKey: boolean = false;
  hasWriteAccess: boolean = false;
  isEnabledInProd: boolean = true;
  messageBarType = MessageBarType.info;
  canCreateApiKeys: boolean = false;
  appInsightsValiationError: string = "";
  test1: string = "Value1";
  test2: string = "Value2";
  optInsightResourceInfoSubject = new BehaviorSubject<{ resourceUri: string, appId: string }>({ resourceUri: "", appId: "" });
  isCodeInsightsEnabledInProd: boolean = true;
  codeOptimizationEnabled = false;
  _resourceId: string = "";

  @Input() set resourceId(val: string) {
    if (val) {
      this._resourceId = val;
      this.initialize();
    }
  }

  @Input() detectorId: string = "";

  ngOnInit() {
    this.initialize();
  }

  initialize() {
    if (!this._resourceId) {
      return;
    }

    this.detectorId = this.detectorId ? this.detectorId : this._route.snapshot.parent.params['category'];
    // Only displaying Code Optimizations if called from the following detectors
    this.codeOptimizationEnabled = this.detectorId === 'webappcpu' || this.detectorId === 'Memoryusage' || this.detectorId === 'perfAnalysis' || this.detectorId === 'AvailabilityAndPerformanceWindows';
    if (this.isEnabledInProd) {
      this.appInsightsValiationError = "";
      this._appInsightsService.loadAppInsightsResourceObservable.subscribe(loadStatus => {
        if (loadStatus === true) {
          let appInsightsSettings = this._appInsightsService.appInsightsSettings;
          this.isAppInsightsEnabled = appInsightsSettings.enabledForWebApp;
          this.appInsightsResourceUri = appInsightsSettings.resourceUri;
          this.appId = appInsightsSettings.appId;
          this.optInsightResourceInfoSubject.next({ resourceUri: this.appInsightsResourceUri, appId: this.appId });

          if (this.isAppInsightsEnabled) {
            this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsEnabled);
            this._appInsightsService.getAppInsightsConnected(this._resourceId).subscribe(connected => {
              if (connected) {
                this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsAlreadyConnected);
                this.isAppInsightsConnected = true;
                this._appInsightsService.getAppInsightsStoredConfiguration(this._resourceId).subscribe(storedResponse => {
                  if (storedResponse && storedResponse.AppId && storedResponse.ApiKey) {
                    const additionalHeaders = new HttpHeaders({ 'appinsights-app-id': storedResponse.AppId, 'appinsights-encryptedkey': storedResponse.ApiKey });
                    this._backendCtrlService.get<any>(`api/appinsights/validate`, additionalHeaders, true).subscribe(resp => {
                      if (resp.isValid === true) {
                        this.appInsightsValidated = true;
                        if (resp.updatedEncryptionBlob != null && resp.updatedEncryptionBlob.length > 1) {
                          this._appInsightsService.updateAppInsightsEncryptedAppSettings(resp.updatedEncryptionBlob, storedResponse.AppId).subscribe(appSettingUpdated => {
                            if (appSettingUpdated) {
                              this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsAppSettingsUpdatedWithLatestSecret);
                            }
                            this.loadingSettings = false;
                          }, error => {
                            this.loadingSettings = false;
                          });
                        } else {
                          this.loadingSettings = false;
                        }
                      }
                    }, error => {
                      this.loadingSettings = false;
                      if (error.status === 403) {
                        this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsConfigurationInvalid);
                      } else {
                        this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsFailedDuringKeyValidation);
                        if (error.error) {
                          this.appInsightsValiationError += " - " + error.error;
                        }
                      }

                    });
                  }
                }, error => {
                  this.loadingSettings = false;
                });


              } else {

                //
                // If AppInsights is not connected already, check if the user has write access to the 
                // AppInsights resource by checking ARM permissions
                //

                this._appInsightsService.checkAppInsightsAccess(this.appInsightsResourceUri).subscribe(hasWriteAccess => {
                  if (!hasWriteAccess) {
                    this.hasWriteAccess = false;
                    this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsResourceMissingWriteAccess);
                  } else {
                    this._appInsightsService.getAppInsightsApiKeysCount().subscribe(keyCount => {
                      this.hasWriteAccess = true;
                      this.loadingSettings = false;
                      if (keyCount < maxApiKeysPerAiResource) {
                        this.canCreateApiKeys = true;
                      } else {
                        this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsMaxApiKeysExceeded);
                      }
                    });
                  }

                }, errorCheckingAccess => {
                  this._appInsightsService.logAppInsightsError(this._resourceId, TelemetryEventNames.AppInsightsAccessCheckError, errorCheckingAccess);
                  this.loadingSettings = false;
                  this.hasWriteAccess = false;
                });

              }
            });
          } else {
            this.loadingSettings = false;
          }
        } else if (loadStatus === false) {

          if (this._appInsightsService.appInsightsSettings.appSettingsHaveInstrumentationKey
            && !this._appInsightsService.appInsightsSettings.enabledForWebApp) {

            //
            // This is the case where :- 
            // 1. Either we failed to look up the App Settings for the app, or
            // 2. We succeeded to view app settings but we  failed to reverse lookup 
            //    Application Insights resource corresponding to the app settings. This 
            //    can happen if the app has the AppSetting set incorrectly or the current 
            //    user has access to the app but does not have access on the subscription 
            //    to list all the AppInsights resources.
            //
            this.appSettingsHaveInstrumentationKey = true;
            this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsFromDifferentSubscription);
          } else {
            this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsNotEnabled)
          }
          this.loadingSettings = false;
        }
      });
    }
  }

  enable() {
    this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsEnableClicked);
    this._appInsightsService.openAppInsightsBlade();
  }

  connect() {
    this.connecting = true;
    this._appInsightsService.connectAppInsights(this._resourceId, this.appInsightsResourceUri, this.appId).subscribe(resp => {
      this.connecting = false;
      if (resp) {
        this.isAppInsightsConnected = true;
        this.appInsightsValidated = true;
        this._appInsightsService.logAppInsightsEvent(this._resourceId, TelemetryEventNames.AppInsightsConnected);
      }

    }, error => {
      this.connecting = false;
      this.error = error;
      this._appInsightsService.logAppInsightsError(this._resourceId, TelemetryEventNames.AppInsightsConnectionError, this.error);
    });
  }

}