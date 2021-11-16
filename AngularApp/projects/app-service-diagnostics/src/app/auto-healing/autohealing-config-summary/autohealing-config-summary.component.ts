import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AutoHealActionType, AutoHealSettings } from '../../shared/models/autohealing';
import { FormatHelper } from '../../shared/utilities/formattingHelper';
import { AuthService } from '../../startup/services/auth.service';

@Component({
  selector: 'autohealing-config-summary',
  templateUrl: './autohealing-config-summary.component.html',
  styleUrls: ['./autohealing-config-summary.component.scss']
})
export class AutohealingConfigSummaryComponent implements OnInit, OnChanges {

  constructor(private _authService: AuthService, private _router: Router) { }

  @Input() autohealSettings: string;
  initialized: boolean = false;
  eventViewerLink: string = '';
  resourceId: string = '';

  ngOnInit() {
    this._authService.getStartupInfo().subscribe(startupInfo => {
      this.resourceId = startupInfo.resourceId;
    });

    if (this.initialized === false) {
      this.updateComponent();
      this.initialized = true;
    }
  }

  ngOnChanges() {
    this.updateComponent();
  }

  actualhealSettings: AutoHealSettings;
  processStartupLabel: string = '';
  settingsSummary: any;

  updateComponent() {

    if (this.autohealSettings == null) {
      return;
    }
    this.actualhealSettings = JSON.parse(this.autohealSettings);

    if (this.actualhealSettings.autoHealRules != null
      && this.actualhealSettings.autoHealRules.actions != null
      && this.actualhealSettings.autoHealRules.triggers != null) {

      this.settingsSummary = {};
      const conditions: string[] = [];

      if (this.actualhealSettings.autoHealRules.triggers.privateBytesInKB > 0) {
        conditions.push('Process consumes more than ' + FormatHelper.formatBytes(this.actualhealSettings.autoHealRules.triggers.privateBytesInKB * 1024, 2) + ' private bytes of memory');
      }

      if (this.actualhealSettings.autoHealRules.triggers.requests != null) {
        conditions.push('App has served  ' + this.actualhealSettings.autoHealRules.triggers.requests.count + ' requests in a duration of  ' + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.requests.timeInterval) + ' seconds');
      }

      if (this.actualhealSettings.autoHealRules.triggers.slowRequests != null) {
        conditions.push(this.actualhealSettings.autoHealRules.triggers.slowRequests.count + ' requests take more than  ' + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.slowRequests.timeTaken) + ' seconds in a duration of  ' + FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.triggers.slowRequests.timeInterval) + ' seconds');
      }

      if (this.actualhealSettings.autoHealRules.triggers.slowRequestsWithPath != null) {
        for (let index = 0; index < this.actualhealSettings.autoHealRules.triggers.slowRequestsWithPath.length; index++) {
          const slowRequestRule = this.actualhealSettings.autoHealRules.triggers.slowRequestsWithPath[index];

          let requestPath = "";
          if (slowRequestRule.path) {
            requestPath = ` matching path '${slowRequestRule.path}' `;
          }

          conditions.push(slowRequestRule.count + ' requests ' + requestPath + 'take more than  ' + FormatHelper.timespanToSeconds(slowRequestRule.timeTaken) + ' seconds in a duration of  ' + FormatHelper.timespanToSeconds(slowRequestRule.timeInterval) + ' seconds');
        }
      }

      if (this.actualhealSettings.autoHealRules.triggers.statusCodes != null) {
        for (let index = 0; index < this.actualhealSettings.autoHealRules.triggers.statusCodes.length; index++) {
          const statusCodeRule = this.actualhealSettings.autoHealRules.triggers.statusCodes[index];

          var statusCodesString = statusCodeRule.status.toString();
          if (statusCodeRule.subStatus > 0) {
            statusCodesString += '.' + statusCodeRule.subStatus.toString();
          }

          if (statusCodeRule.win32Status > 0) {
            statusCodesString += ' and win-32 status ' + statusCodeRule.win32Status.toString();
          }

          let requestPath = "";
          if (statusCodeRule.path) {
            requestPath = " matching path '" + statusCodeRule.path + "' ";
          }

          conditions.push(statusCodeRule.count + ' requests ' + requestPath + 'end up with HTTP Status ' + statusCodesString + ' in a duration of  ' + FormatHelper.timespanToSeconds(statusCodeRule.timeInterval) + ' seconds');
        }
      }

      if (this.actualhealSettings.autoHealRules.triggers.statusCodesRange != null) {
        for (let index = 0; index < this.actualhealSettings.autoHealRules.triggers.statusCodesRange.length; index++) {
          const statusCodeRule = this.actualhealSettings.autoHealRules.triggers.statusCodesRange[index];

          let requestPath = "";
          if (statusCodeRule.path) {
            requestPath = " matching path '" + statusCodeRule.path + "' ";
          }

          conditions.push(statusCodeRule.count + ' requests ' + requestPath + 'end up with HTTP Status in range (' + statusCodeRule.statusCodes + ') in a duration of  ' + FormatHelper.timespanToSeconds(statusCodeRule.timeInterval) + ' seconds');
        }
      }

      let actionType: AutoHealActionType;
      let action: string = '';
      let actionExe: string = '';
      this.processStartupLabel = '';
      if (conditions.length > 0 && this.actualhealSettings.autoHealRules.actions != null) {
        actionType = this.actualhealSettings.autoHealRules.actions.actionType;
        if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.Recycle) {
          action = 'Recycle the process';
        } else if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.LogEvent) {
          action = 'Log an Event in the Event Viewer';
        } else if (this.actualhealSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
          action = 'Run executable ';
          if (this.actualhealSettings.autoHealRules.actions.customAction != null && this.actualhealSettings.autoHealRules.actions.customAction.exe != null && this.actualhealSettings.autoHealRules.actions.customAction.parameters != null) {
            actionExe = this.actualhealSettings.autoHealRules.actions.customAction.exe + ' ' + this.actualhealSettings.autoHealRules.actions.customAction.parameters;
          }
        }
        if (this.actualhealSettings.autoHealRules.actions != null && this.actualhealSettings.autoHealRules.actions.minProcessExecutionTime != null) {
          const seconds = FormatHelper.timespanToSeconds(this.actualhealSettings.autoHealRules.actions.minProcessExecutionTime);
          if (seconds > 0) {
            this.processStartupLabel = ` after ${seconds} seconds of process startup`;
          }
        }
      }

      this.settingsSummary = { ActionType: actionType, Action: action, ActionExe: actionExe, Conditions: conditions, ProcessStartupLabel: this.processStartupLabel };
    }
  }

  openEventViewer() {
    this._router.navigateByUrl(`/resource${this.resourceId}/categories/DiagnosticTools/tools/eventviewer`);
  }
}
