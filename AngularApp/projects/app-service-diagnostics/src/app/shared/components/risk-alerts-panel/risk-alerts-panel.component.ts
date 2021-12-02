import { Component, Input, OnInit } from '@angular/core';
import { DetectorControlService, TelemetryService } from 'diagnostic-data';
import { DetectorResponse } from 'diagnostic-data';
import { Moment } from 'moment';
import { MessageBarType } from 'office-ui-fabric-react/lib/components/MessageBar';
import { PanelType } from 'office-ui-fabric-react/lib/components/Panel';
import { Globals } from '../../../globals';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { RiskAlertService } from '../../../shared-v2/services/risk-alert.service';
import { AuthService } from '../../../startup/services/auth.service';
import { PortalActionService } from '../../services/portal-action.service';


@Component({
    selector: 'risk-alerts-panel',
    templateUrl: './risk-alerts-panel.component.html',
    styleUrls: ['./risk-alerts-panel.component.scss']
})
export class RiskAlertsPanelComponent implements OnInit {
    type: PanelType = PanelType.custom;
    width: string = "525px";
    styles: any = {
        root: {
            marginTop: '50px',
        }
    }
    riskPanelContents: any = {};
    error: string = "";
    endTime: Moment = this.detectorControlService.endTime;
    startTime: Moment = this.detectorControlService.startTime;
    riskPanelTitle: string = "Notifications";
    currentRiskPanelContentId: string;
    viewResponse: DetectorResponse;

    summaryType: MessageBarType = MessageBarType.info;
    isInCaseSubmissionFlow: boolean = false;

    constructor(public globals: Globals, public notificationService: NotificationService, public telemetryService: TelemetryService, private portalActionService: PortalActionService, private authService: AuthService, private _riskAlertService: RiskAlertService, public detectorControlService: DetectorControlService) {
        if (authService) {
            this.authService.getStartupInfo().subscribe(startupInfo => {
                this.isInCaseSubmissionFlow = startupInfo && startupInfo.source !== undefined && startupInfo.source.toLowerCase() === ("CaseSubmissionV2-NonContext").toLowerCase();
                if (!this.isInCaseSubmissionFlow) {
                    this.styles = {};
                }
            });
        }
    }

    ngOnInit() {
        this._riskAlertService.riskPanelContentsSub.subscribe((risksPanelContents) => {
            this.riskPanelContents = risksPanelContents;
            this._riskAlertService.currentRiskPanelContentIdSub.subscribe((currentRiskAlertDetectorId) => {
                this.riskPanelTitle = this._riskAlertService.riskAlertNotifications && this._riskAlertService.riskAlertNotifications.hasOwnProperty(currentRiskAlertDetectorId) ? this._riskAlertService.riskAlertNotifications[currentRiskAlertDetectorId].title + " risk alerts" : this._riskAlertService.notificationMessageBar && this._riskAlertService.notificationMessageBar.panelTitle ? this._riskAlertService.notificationMessageBar.panelTitle : this.riskPanelTitle;
                this.currentRiskPanelContentId = currentRiskAlertDetectorId;
            });
        });

    }

    isContentEmpty(contents: any) {
        return contents == null || Object.keys(contents) == null || Object.keys(contents).length === 0;
    }

    dismissedHandler() {
        this.globals.openRiskAlertsPanel = false;
        this.telemetryService.logEvent("closeRiskAlertsPanel");
    }

    logOpenLinkEvent(linkDescription: string, linkAddress: string) {
        this.telemetryService.logEvent("openRiskAlertLink", { Description: linkDescription, link: linkAddress });
    }

    openRiskAlertDetector(event: Event) {
        event.preventDefault();
        this.telemetryService.logEvent("OpenRiskAlertDetector");
        this.portalActionService.openBladeDiagnoseDetectorId("RiskAssessments", "ParentAvailabilityAndPerformance");
    }
}
