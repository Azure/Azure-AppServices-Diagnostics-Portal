import { Injectable } from '@angular/core';
import {
  DetectorResponse,
  HealthStatus,
  LoadingStatus,
  Rendering,
  RenderingType,
  TelemetryService,
  NotificationUtils
} from 'diagnostic-data';
import {
  DiagnosticService,
  DetectorControlService,
  TelemetryEventNames
} from 'diagnostic-data';
import { BehaviorSubject, forkJoin, Observable, observable, of } from 'rxjs';
import {
  NotificationMessageBar,
  RiskHelper,
  RiskInfo,
  RiskTile
} from '../../home/models/risk';
import {
  ArmResourceConfig,
  RiskAlertConfig,
  NotificationConfig
} from '../../shared/models/arm/armResourceConfig';
import { GenericArmConfigService } from '../../shared/services/generic-arm-config.service';
import { FeatureService } from './feature.service';
import { delay, map } from 'rxjs/operators';
import { Globals } from '../../globals';

@Injectable({
  providedIn: 'root'
})
export class RiskAlertService {
  public riskAlertsSub: BehaviorSubject<RiskAlertConfig[]> =
    new BehaviorSubject<RiskAlertConfig[]>([]);
  public riskPanelContentsSub: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );
  public isRiskTileRefreshing: BehaviorSubject<boolean> =
    new BehaviorSubject<any>(false);
  riskAlertNotifications: {} = {};
  risksPanelContents = {};
  currentRiskPanelContentId: string = '';
  currentRiskPanelContentIdSub: BehaviorSubject<string> =
    new BehaviorSubject<string>('');
  riskAlertConfigs: RiskAlertConfig[];
  notificationStatus: HealthStatus = HealthStatus.Info;
  caseSubmissionRiskNotificationId: string = '';
  notificationMessageBar: NotificationMessageBar = null;

  constructor(
    protected _diagnosticService: DiagnosticService,
    protected _detectorControlService: DetectorControlService,
    protected _telemetryService: TelemetryService,
    protected globals: Globals,
    protected _genericArmConfigService?: GenericArmConfigService
  ) {}

  public initRiskAlertsForArmResource(resourceUri: string) {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig =
        this._genericArmConfigService.getArmResourceConfig(resourceUri);
      this._addRiskAlertDetectorIds(
        currConfig.riskAlertConfigs,
        currConfig.notificationConfig
      );
    }
  }

  public _addRiskAlertDetectorIds(
    riskAlertConfigs: RiskAlertConfig[],
    notificationConfig?: NotificationConfig
  ) {
    if (riskAlertConfigs != null && riskAlertConfigs.length > 0) {
      //Filter out duplicate links
      const riskConfigSet = new Set<RiskAlertConfig>(this.riskAlertConfigs);
      for (let config of riskAlertConfigs) {
        riskConfigSet.add(config);
      }
      const riskAlertsArray = Array.from(riskConfigSet);
      this.riskAlertConfigs = riskAlertsArray;

      this.riskAlertConfigs.forEach((riskAlertConfig) => {
        // RiskAlertNotification
        let enableForCaseSubmission =
          riskAlertConfig.enableForCaseSubmissionFlow != null &&
          riskAlertConfig.enableForCaseSubmissionFlow === true;
        let notificationMessageDetail: RiskTile = {
          id: riskAlertConfig.riskAlertDetectorId,
          title: riskAlertConfig.title,
          riskInfo: null,
          loadingStatus: LoadingStatus.Loading,
          linkText: 'View more details',
          enableForCaseSubmissionFlow: enableForCaseSubmission
        };

        if (
          !this.riskAlertNotifications.hasOwnProperty(
            riskAlertConfig.riskAlertDetectorId
          )
        ) {
          this.riskAlertNotifications[riskAlertConfig.riskAlertDetectorId] =
            notificationMessageDetail;
        }
      });
    }

    if (
      notificationConfig != null &&
      !!notificationConfig.notificationDetectorId &&
      !!notificationConfig.title
    ) {
      this.notificationMessageBar = {
        showNotification: false,
        id: notificationConfig.notificationDetectorId,
        panelTitle: notificationConfig.title,
        status: HealthStatus.Info,
        linkText: 'View more details'
      } as NotificationMessageBar;
    }
  }

  public getRiskAlertNotificationResponse(
    isInCaseSubmissionFlow: boolean = false,
    refresh: boolean = false
  ): Observable<any[]> {
    try {
      if (refresh) {
        this.isRiskTileRefreshing.next(true);
      }
      if (this.riskAlertConfigs == null && this.notificationMessageBar == null)
        return of(null);

      let tasks = [];
      if (this.riskAlertConfigs != null && this.riskAlertConfigs.length > 0) {
        tasks = this.riskAlertConfigs
          .filter(
            (config) =>
              !isInCaseSubmissionFlow ||
              (isInCaseSubmissionFlow &&
                config.enableForCaseSubmissionFlow != null &&
                config.enableForCaseSubmissionFlow === true)
          )
          .map((riskAlertConfig) => {
            let riskAlertObservable = this._diagnosticService
              .getDetector(
                riskAlertConfig.riskAlertDetectorId,
                this._detectorControlService.startTimeString,
                this._detectorControlService.endTimeString,
                refresh
              )
              .pipe(
                map((res) => {
                  const notificationList = res.dataset.filter(
                    (set) =>
                      (<Rendering>set.renderingProperties).type ===
                      RenderingType.Notification
                  );
                  const statusColumnIndex = 0;
                  notificationList.sort(
                    (s1, s2) =>
                      HealthStatus[
                        <string>s1.table.rows[0][statusColumnIndex]
                      ] -
                      HealthStatus[<string>s2.table.rows[0][statusColumnIndex]]
                  );

                  res.dataset = notificationList;
                  let currentStatus = HealthStatus.Info;
                  if (
                    this.riskAlertNotifications.hasOwnProperty(
                      riskAlertConfig.riskAlertDetectorId
                    )
                  ) {
                    if (
                      res.dataset &&
                      res.dataset.length > 0 &&
                      res.dataset[0].table != null &&
                      res.dataset[0].table.rows.length > 0
                    ) {
                      currentStatus =
                        HealthStatus[<string>res.dataset[0].table.rows[0][0]];
                      if (currentStatus < this.notificationStatus) {
                        this.notificationStatus = currentStatus;
                        this.caseSubmissionRiskNotificationId =
                          riskAlertConfig.riskAlertDetectorId;
                      }
                    }

                    this.riskAlertNotifications[
                      riskAlertConfig.riskAlertDetectorId
                    ].notificationMessage =
                      !!res && !!res.metadata && !!res.metadata.description
                        ? res.metadata.description
                        : '';
                    this.riskAlertNotifications[
                      riskAlertConfig.riskAlertDetectorId
                    ].status = currentStatus;
                    this.riskAlertNotifications[
                      riskAlertConfig.riskAlertDetectorId
                    ].riskInfo = RiskHelper.convertResponseToRiskInfo(res);
                    this.riskAlertNotifications[
                      riskAlertConfig.riskAlertDetectorId
                    ].loadingStatus = LoadingStatus.Success;
                  }

                  this.risksPanelContents[riskAlertConfig.riskAlertDetectorId] =
                    res;
                })
              );

            return riskAlertObservable;
          });
      }

      if (!!this.notificationMessageBar && !!this.notificationMessageBar.id) {
        let notificationObservable = this._diagnosticService
          .getDetector(
            this.notificationMessageBar.id,
            this._detectorControlService.startTimeString,
            this._detectorControlService.endTimeString,
            refresh
          )
          .pipe(
            map((res) => {
              if (res != null && res.metadata != null && res.dataset != null) {
                const notificationList = res.dataset.filter(
                  (set) =>
                    (<Rendering>set.renderingProperties).type ===
                    RenderingType.Notification
                );
                notificationList.filter((notification) =>
                  NotificationUtils.isTimeRangeValidated(notification)
                );

                if (notificationList != null && notificationList.length !== 0) {
                  this.notificationMessageBar.notificationMessage = res.metadata
                    .description
                    ? res.metadata.description
                    : this.notificationMessageBar.notificationMessage;
                  this.notificationMessageBar.showNotification = true;

                  const statusColumnIndex = 0;
                  notificationList.sort(
                    (s1, s2) =>
                      HealthStatus[
                        <string>s1.table.rows[0][statusColumnIndex]
                      ] -
                      HealthStatus[<string>s2.table.rows[0][statusColumnIndex]]
                  );
                  let notificationMessageStatus = HealthStatus.Info;
                  if (
                    notificationList[0] != null &&
                    notificationList[0].table != null &&
                    notificationList[0].table.rows != null &&
                    notificationList[0].table.rows.length > 0
                  ) {
                    notificationMessageStatus =
                      HealthStatus[
                        <string>notificationList[0].table.rows[0][0]
                      ];
                  }

                  this.notificationMessageBar.status =
                    notificationMessageStatus;
                  res.dataset = notificationList;
                  this.risksPanelContents[this.notificationMessageBar.id] = res;
                } else {
                  this.notificationMessageBar.showNotification = false;
                }
              }
            })
          );

        tasks.push(notificationObservable);
      }

      return forkJoin(tasks);
    } catch (err) {
      this._telemetryService.logEvent('RiskAlertResponseFailed', {
        error: JSON.stringify(err)
      });
    }
  }

  protected _isRiskAlertEnabled(): boolean {
    return this.riskAlertConfigs != null && this.riskAlertConfigs.length > 0;
  }
}
