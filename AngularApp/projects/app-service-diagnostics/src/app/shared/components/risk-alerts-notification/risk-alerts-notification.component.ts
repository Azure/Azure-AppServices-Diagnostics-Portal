import { JsonPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { HealthStatus, TelemetryEventNames, TelemetryService, TelemetrySource } from 'diagnostic-data';
import { MessageBarType, IMessageBarProps, IMessageBarStyles } from 'office-ui-fabric-react';
import { throwError } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';
import { Globals } from '../../../globals';
import { RiskHelper } from '../../../home/models/risk';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { RiskAlertService } from '../../../shared-v2/services/risk-alert.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ThemeService } from '../../../theme/theme.service';


@Component({
    selector: 'risk-alerts-notification',
    templateUrl: './risk-alerts-notification.component.html',
    styleUrls: ['./risk-alerts-notification.component.scss']
})
export class RiskAlertsNotificationComponent implements OnInit {
    @Input() isKeystoneSolutionView: boolean = false;
    showRiskAlertsNotification: boolean = false;
    showNotification: boolean = false;
    notificationMessageBarText: string = "There is an emerging issue going on which may impact availablity of your application.";
    notificationMessageBarLinkText: string = "Click here to view more details";
    notificationStatusType: MessageBarType = MessageBarType.severeWarning;
    riskAlertNotificationStatusType: MessageBarType = MessageBarType.severeWarning;
    riskAlertChecksHealthy: boolean = false;
    riskAlertDetectorId: string = "";
    riskAlertMessage: string = "We detected missing configurations in your application that will increase risk of a downtime.";
    styles: any = {
        root: {
            height: '49px',
            backgroundColor: '#FEF0F1',
            marginBottom: '13px'
        }
    }
    constructor(private _resourceService: ResourceService, private globals: Globals, private _authService: AuthService, public telemetryService: TelemetryService, public _activatedRoute: ActivatedRoute, protected _router: Router, private _riskAlertService: RiskAlertService, private _themeService: ThemeService) { }

    ngOnInit() {
        var notificationBarBackground = this._themeService.getPropertyValue("--notificationBarBackground");
        this.styles.root.backgroundColor = notificationBarBackground !== "" ? notificationBarBackground : '#FEF0F1';

        if (this._resourceService.armResourceConfig) {
            this._riskAlertService.initRiskAlertsForArmResource(this._resourceService.resource.id);
        }

        this._authService.getStartupInfo().subscribe((startupInfo) => {
            this._riskAlertService.riskPanelContentsSub.subscribe((riskAlertContents) => {
                // Only show risk alert when:
                // 1. In case submission
                // 2. There is at least one risk check fails
                // 3. No keystone solution is presented

                this.riskAlertNotificationStatusType = RiskHelper.convertHealthStatusToMessageType(this._riskAlertService.notificationStatus);
                this.riskAlertChecksHealthy = this._riskAlertService.notificationStatus >= HealthStatus.Info;
                this.riskAlertDetectorId = this._riskAlertService.caseSubmissionRiskNotificationId;
                this.riskAlertMessage = this._riskAlertService.riskAlertNotifications && this._riskAlertService.riskAlertNotifications.hasOwnProperty(this._riskAlertService.caseSubmissionRiskNotificationId) ? this._riskAlertService.riskAlertNotifications[this._riskAlertService.caseSubmissionRiskNotificationId].notificationMessage : this.riskAlertMessage;
                this.showRiskAlertsNotification = (startupInfo.supportTopicId && startupInfo.supportTopicId != '' && !this.riskAlertChecksHealthy && !this.isKeystoneSolutionView);

                // This is to determine whether we want to show emerging issue notification bar.
                this.showNotification = !!this._riskAlertService.notificationMessageBar && !!this._riskAlertService.notificationMessageBar.id && this._riskAlertService.notificationMessageBar.showNotification;
                this.notificationMessageBarText = !!this._riskAlertService.notificationMessageBar && this._riskAlertService.notificationMessageBar.notificationMessage ? this._riskAlertService.notificationMessageBar.notificationMessage : this.notificationMessageBarText;
                this.notificationMessageBarLinkText = !!this._riskAlertService.notificationMessageBar && this._riskAlertService.notificationMessageBar.linkText ? this._riskAlertService.notificationMessageBar.linkText : this.notificationMessageBarLinkText;
                this.notificationStatusType = !!this._riskAlertService.notificationMessageBar && !!this._riskAlertService.notificationMessageBar.status ?  RiskHelper.convertHealthStatusToMessageType(this._riskAlertService.notificationMessageBar.status) : this.notificationStatusType;
            });
        }, e => {
            this.telemetryService.logEvent("RiskNotificationLoadingFailure", { "error": JSON.stringify(e) });
        });
    }


    ngAfterViewInit() {
        if (this.showNotification) {
            this.telemetryService.logEvent(TelemetryEventNames.RiskAlertNotificationLoaded,
                {
                    'Location': TelemetrySource.CaseSubmissionFlow,
                    'NotificationType': "Notification",
                    'Status': this.notificationStatusType.toString(),
                    "NotificationDetectorId": this._riskAlertService.notificationMessageBar.id,
                    "NotificationMessage": this.notificationMessageBarText,
                });
        }
        if (this.showRiskAlertsNotification) {
            this.telemetryService.logEvent(TelemetryEventNames.RiskAlertNotificationLoaded,
                {
                    'Location': TelemetrySource.CaseSubmissionFlow,
                    'NotificationType': "RiskAlert",
                    'Status': this.riskAlertNotificationStatusType.toString(),
                    "NotificationDetectorId": this.riskAlertDetectorId,
                    "NotificationMessage": this.riskAlertMessage,
                });
        }
    }

    openRiskAlertsPanel(id: string) {
        this.globals.openRiskAlertsPanel = true;
        this._riskAlertService.currentRiskPanelContentIdSub.next(id);
        this.telemetryService.logEvent(TelemetryEventNames.OpenRiskAlertPanel, {
            'Location': TelemetrySource.CaseSubmissionFlow,
            "notificationDetectorId": id
        });
    }
}


