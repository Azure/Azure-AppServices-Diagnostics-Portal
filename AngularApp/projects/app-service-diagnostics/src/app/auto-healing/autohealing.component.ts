import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OperatingSystem, SiteInfoMetaData } from '../shared/models/site';
import { SiteService } from '../shared/services/site.service';
import { AutohealingService } from '../shared/services/autohealing.service';
import { FormatHelper } from '../shared/utilities/formattingHelper';
import { AutoHealSettings, AutoHealCustomAction, AutoHealRules, AutoHealActions, AutoHealTriggers, AutoHealActionType, StatusCodeRules, SlowRequestsRules } from '../shared/models/autohealing';
import { AvailabilityLoggingService } from '../shared/services/logging/availability.logging.service';
import { Globals } from '../globals';
import { TelemetryService } from 'diagnostic-data';
import { WebSitesService } from '../resources/web-sites/services/web-sites.service';

@Component({
  selector: 'autohealing',
  templateUrl: './autohealing.component.html',
  styleUrls: ['./autohealing.component.scss']
})
export class AutohealingComponent implements OnInit {
  @Input()
  autohealingSettings: AutoHealSettings;
  originalAutoHealSettings: AutoHealSettings;

  siteToBeDiagnosed: SiteInfoMetaData;
  retrievingAutohealSettings: boolean = true;
  savingAutohealSettings: boolean = false;

  triggerSelected: number = -1;
  actionSelected: number = -1;
  actionCollapsed: boolean = true;

  saveEnabled: boolean = false;
  changesSaved: boolean = false;
  triggers = [];
  actions = [];
  originalSettings: any;
  currentSettings: any;
  customAction: AutoHealCustomAction = null;
  errorMessage: string = '';
  errorMessageSaving: string = '';
  minProcessExecutionTime: number;
  minProcessExecutionTimeExpanded: boolean = false;
  detectorHasData: boolean = false;
  validationWarning: string[];
  selectedTab: string = 'autoHealing';
  statusCodeRules: StatusCodeRules = null;
  slowRequestRules: SlowRequestsRules = null;
  isWindowsApp: boolean = true;

  constructor(private _siteService: SiteService, private _autohealingService: AutohealingService,
    private globals: Globals, private telemetryService: TelemetryService,
    private _logger: AvailabilityLoggingService, protected _route: ActivatedRoute,
    private _webSiteService: WebSitesService) {
    this.isWindowsApp = this._webSiteService.platform === OperatingSystem.windows;
  }

  ngOnInit() {
    this._siteService.currentSiteMetaData.subscribe(siteInfo => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
        this._autohealingService.getAutohealSettings(this.siteToBeDiagnosed).subscribe(autoHealSettings => {
          this.retrievingAutohealSettings = false;
          this.errorMessage = '';
          this.autohealingSettings = autoHealSettings;
          this.initComponent(this.autohealingSettings);
        },
          err => {
            this.retrievingAutohealSettings = false;
            this.errorMessage = `Failed with an error ${JSON.stringify(err)} while retrieving autoheal settings`;
          });
      }
    });
  }

  initComponent(autoHealSettings: AutoHealSettings) {
    this.originalSettings = JSON.stringify(autoHealSettings);
    this.originalAutoHealSettings = JSON.parse(this.originalSettings);
    this.updateConditionsAndActions();
    this.updateSummaryText();
    this.statusCodeRules = this.getStatusCodeRules();
    this.slowRequestRules = this.getSlowRequestRules();
  }

  updateConditionsAndActions() {
    if (this.autohealingSettings != null && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.actions != null) {
      if (this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime != null) {
        this.minProcessExecutionTime = FormatHelper.timespanToSeconds(this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime);
      } else {
        this.minProcessExecutionTime = 0;
      }

      this.actionSelected = this.autohealingSettings.autoHealRules.actions.actionType;
      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction) {
        this.customAction = this.autohealingSettings.autoHealRules.actions.customAction;
      }
    } else {
      this.autohealingSettings = new AutoHealSettings();
      this.autohealingSettings.autoHealRules = new AutoHealRules();
      this.autohealingSettings.autoHealRules.actions = null;
      this.autohealingSettings.autoHealRules.triggers = null;
    }
    this.initTriggersAndActions();
  }

  saveMinProcessTimeChanged(val: number) {
    this.minProcessExecutionTime = val;
    if (this.autohealingSettings.autoHealRules.actions != null) {
      if (this.minProcessExecutionTime != null && this.minProcessExecutionTime != 0) {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(this.minProcessExecutionTime);
      } else {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(0);
      }
      this.checkForChanges();
    }
    this.collapseAllTiles();
  }


  orderedJsonStringify(o: any) {
    return JSON.stringify(Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {}));
  }

  checkForChanges() {
    this.saveEnabled = false;
    if (this.autohealingSettings.autoHealEnabled) {
      if (this.checkRulesValid()) {
        let originalAutoHealSettingsString = "";
        if (this.originalAutoHealSettings != null && this.originalAutoHealSettings.autoHealRules != null) {
          originalAutoHealSettingsString = this.orderedJsonStringify(this.originalAutoHealSettings.autoHealRules);
        }
        let currentSettingsString = this.orderedJsonStringify(this.autohealingSettings.autoHealRules);
        if (originalAutoHealSettingsString != currentSettingsString) {
          this.saveEnabled = true;
        }
      }
    }
    else {
      if (this.originalAutoHealSettings.autoHealEnabled !== this.autohealingSettings.autoHealEnabled) {
        this.saveEnabled = true;
      }
    }
    this.updateSummaryText();
  }

  checkTriggersValid(triggers: AutoHealTriggers): boolean {
    let isValid = false;
    if ((triggers.privateBytesInKB != null && triggers.privateBytesInKB > 0)
      || (triggers.requests != null && triggers.requests.count > 0)
      || (triggers.slowRequests != null && triggers.slowRequests.count > 0)
      || (triggers.statusCodes != null && triggers.statusCodes.length > 0)
      || (triggers.statusCodesRange != null && triggers.statusCodesRange.length > 0)
      || (triggers.slowRequestsWithPath != null && triggers.slowRequestsWithPath.length > 0)) {
      isValid = true;
    }
    return isValid;
  }

  checkActionsValid(actions: AutoHealActions): boolean {
    let isValid = false;
    if (actions.actionType === AutoHealActionType.LogEvent
      || actions.actionType === AutoHealActionType.Recycle) {
      isValid = true;
    } else {
      if (actions.customAction != null &&
        actions.customAction.exe != null
        && actions.customAction.exe.length > 0) {
        isValid = true;
      }
    }
    return isValid;
  }

  checkRulesValid(): boolean {
    let rulesValid: boolean = false;
    if (this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.actions != null && this.autohealingSettings.autoHealRules.triggers != null) {
      if (this.checkTriggersValid(this.autohealingSettings.autoHealRules.triggers) && this.checkActionsValid(this.autohealingSettings.autoHealRules.actions)) {
        rulesValid = true;
      }
    }
    return rulesValid;
  }

  updateCustomAction(action: AutoHealCustomAction) {

    this.customAction = action;
    this.autohealingSettings.autoHealRules.actions.customAction = this.customAction;
    this.checkForChanges();
    this.actionCollapsed = true;
  }

  saveChanges() {
    this._logger.LogClickEvent('SaveAutoHealSettings', 'AutoHealing');
    this.savingAutohealSettings = true;
    this._autohealingService.updateAutohealSettings(this.siteToBeDiagnosed, this.autohealingSettings)
      .subscribe(savedAutoHealSettings => {
        this.saveEnabled = false;
        this.errorMessageSaving = '';
        this.savingAutohealSettings = false;
        this.changesSaved = true;
        setTimeout(() => {
          this.changesSaved = false;
        }, 3000);

        this.customAction = null;
        this.actionSelected = -1;
        this.minProcessExecutionTime = 0;
        this.autohealingSettings = savedAutoHealSettings;
        this.collapseAllTiles();

        this.initComponent(savedAutoHealSettings);
      },
        err => {
          this._logger.LogError(`Failed with an error ${JSON.stringify(err)} while saving autoheal settings`, 'AutoHealing');
          this.savingAutohealSettings = false;
          this.errorMessageSaving = `Failed with an error ${JSON.stringify(err)} while saving autoheal settings`;
        });
  }

  updateTriggerStatus(triggerRule: number) {
    this.actionCollapsed = true;
    this.minProcessExecutionTimeExpanded = false;
    if (this.autohealingSettings.autoHealRules.triggers == null) {
      this.autohealingSettings.autoHealRules.triggers = new AutoHealTriggers();
    }
    this.triggerSelected != triggerRule ? this.triggerSelected = triggerRule : this.triggerSelected = -1;
  }

  updateActionStatus(action: number) {

    // collapse the conditions pane
    this.triggerSelected = -1;
    this.minProcessExecutionTimeExpanded = false;

    //this is to allow user to collapse the action tile if they click it again
    if (this.actionSelected != action) {
      this.actionCollapsed = false;
    } else {
      this.actionCollapsed = !this.actionCollapsed;
    }

    this.actionSelected = action;
    if (this.autohealingSettings.autoHealRules.actions == null) {
      this.autohealingSettings.autoHealRules.actions = new AutoHealActions();
      if (this.minProcessExecutionTime > 0) {
        this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime = FormatHelper.secondsToTimespan(this.minProcessExecutionTime);
      }
    }

    if (action === AutoHealActionType.CustomAction) {
      this.autohealingSettings.autoHealRules.actions.customAction = this.customAction;
    } else {
      // reset the custom action if someone switches the tile back and forth
      this.customAction = null;
      this.autohealingSettings.autoHealRules.actions.customAction = null;
    }

    this.autohealingSettings.autoHealRules.actions.actionType = action;
    this.checkForChanges();
  }

  triggerRuleUpdated(ruleEvent, triggerRule: number) {
    switch (triggerRule) {
      case 0: {
        this.autohealingSettings.autoHealRules.triggers.slowRequests = ruleEvent.slowRequests;
        this.autohealingSettings.autoHealRules.triggers.slowRequestsWithPath = ruleEvent.slowRequestsWithPath;
        break;
      }
      case 1: {
        this.autohealingSettings.autoHealRules.triggers.privateBytesInKB = ruleEvent;
        break;
      }
      case 2: {
        this.autohealingSettings.autoHealRules.triggers.requests = ruleEvent;
        break;
      }

      case 3: {
        this.autohealingSettings.autoHealRules.triggers.statusCodes = ruleEvent.statusCodes;
        this.autohealingSettings.autoHealRules.triggers.statusCodesRange = ruleEvent.statusCodesRange;
        break;
      }
    }

    this.triggers[triggerRule].IsConfigured = this.triggers[triggerRule].checkRuleConfigured();
    this.checkForChanges();
  }

  initTriggersAndActions() {

    this.triggers = [];
    this.actions = [];
    const self = this;

    this.triggers.push({ Name: 'Request Duration', IsEnabled: true, Icon: 'fa fa-hourglass-half', checkRuleConfigured: () => self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && (self.autohealingSettings.autoHealRules.triggers.slowRequests != null || (self.autohealingSettings.autoHealRules.triggers.slowRequestsWithPath != null && self.autohealingSettings.autoHealRules.triggers.slowRequestsWithPath.length > 0)), IsConfigured: false });
    this.triggers.push({ Name: 'Memory Limit', IsEnabled: this.isWindowsApp, Icon: 'fa fa-microchip', checkRuleConfigured: () => self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.privateBytesInKB > 0, IsConfigured: false });
    this.triggers.push({ Name: 'Request Count', IsEnabled: true, Icon: 'fa fa-bar-chart', checkRuleConfigured: () => self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && self.autohealingSettings.autoHealRules.triggers.requests != null, IsConfigured: false });
    this.triggers.push({ Name: 'Status Codes', IsEnabled: true, Icon: 'fa fa-list', checkRuleConfigured: () => self.autohealingSettings != null && self.autohealingSettings.autoHealRules != null && self.autohealingSettings.autoHealRules.triggers != null && ((self.autohealingSettings.autoHealRules.triggers.statusCodes && this.autohealingSettings.autoHealRules.triggers.statusCodes.length > 0) || (self.autohealingSettings.autoHealRules.triggers.statusCodesRange && this.autohealingSettings.autoHealRules.triggers.statusCodesRange.length > 0)), IsConfigured: false });

    this.triggers.forEach(triggerRule => {
      triggerRule.IsConfigured = triggerRule.checkRuleConfigured();
    });


    if (this.isWindowsApp) {
      this.actions.push({ Name: 'Recycle Process', Icon: 'fa fa-recycle' });
      this.actions.push({ Name: 'Log an Event', Icon: 'fa fa-book' });
      this.actions.push({ Name: 'Custom Action', Icon: 'fa fa-bolt' });
    } else {
      this.actions.push({ Name: 'Recycle Container', Icon: 'fa fa-recycle' });
    }

  }

  updateSummaryText() {
    this.currentSettings = JSON.stringify(this.autohealingSettings);
    this.validateAutoHealRules();
  }

  reset() {
    // Just set the current autoHeal settings to the original one
    this.autohealingSettings = JSON.parse(JSON.stringify(this.originalAutoHealSettings));
    this.updateConditionsAndActions();
    this.checkForChanges();
    this.collapseAllTiles();

  }

  collapseAllTiles(): void {
    //collapse all the tiles
    this.triggerSelected = -1;
    this.actionCollapsed = true;
    this.minProcessExecutionTimeExpanded = false;
  }

  getStatusCodeRules(): StatusCodeRules {
    if (this.autohealingSettings != null && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.triggers != null) {
      return new StatusCodeRules(this.autohealingSettings.autoHealRules.triggers.statusCodes, this.autohealingSettings.autoHealRules.triggers.statusCodesRange);
    }
  }

  getSlowRequestRules(): SlowRequestsRules {
    if (this.autohealingSettings != null && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.triggers != null) {
      return new SlowRequestsRules(this.autohealingSettings.autoHealRules.triggers.slowRequests, this.autohealingSettings.autoHealRules.triggers.slowRequestsWithPath);
    }
  }

  toggleSessionPanel() {
    this.globals.openSessionPanel = !this.globals.openSessionPanel;
    this.telemetryService.logEvent("OpenSesssionsPanel");
    this.telemetryService.logPageView("SessionsPanelView");
  }

  generateSasRecommendation() {
    return this.originalAutoHealSettings && this.originalAutoHealSettings.autoHealEnabled &&
      this.originalAutoHealSettings.autoHealRules && this.originalAutoHealSettings.autoHealRules.actions
      && this.originalAutoHealSettings.autoHealRules.actions && this.originalAutoHealSettings.autoHealRules.actions.customAction
      && this.originalAutoHealSettings.autoHealRules.actions.customAction.exe
      && this.originalAutoHealSettings.autoHealRules.actions.customAction.exe.toLowerCase().indexOf("daasconsole.exe") > -1
      && this.originalAutoHealSettings.autoHealRules.actions.customAction.parameters
      && this.originalAutoHealSettings.autoHealRules.actions.customAction.parameters.toLowerCase().indexOf("blobsasuri") > -1
  }

  validateAutoHealRules() {
    this.validationWarning = [];

    const restartWarning: string = 'Saving mitigation settings will restart the app and this can cause logged-in user information, sessions, and in-memory cache to be cleared. Hence, it is advised to make these changes during non-business hours.';
    const minProcessExecutionTimeNotSet: string = 'To avoid mitigation actions to kick in immediately after app starts, it is advisable to set the startup time to at least 600 seconds (10 minutes). This will ensure that mitigation actions don\'t kick in during app\'s cold start.';
    const actionSetToRecycle: string = 'Please ensure that the rules configured don\'t end up recycling your app too many times to avoid any performance hits or app downtimes during the cold start of the application.';
    const diagnosticToolChosenCustom: string = 'You have chosen a custom action to execute whenever mitigation kicks in.';
    const diagnosticToolChosen: string = ' If this is a production app, please ensure that you try this out on a deployment slot first to protect against any downtimes to your application.';
    const diagnosticJavaToolChosen: string = 'The Java diagnostic tools use either jMap or jStack process to collect dumps. Both of these tools freeze the process while collecting data. As a result, the app cannot serve any requests during this time and performance will be impacted. It may take longer to collect these dumps if the process is consuming high memory or has a high number of active threads.';
    const diagnosticMemoryDumpChosen: string = 'You have chosen to collect a memory dump of the process. Please ensure that the storage acccount has enough space to copy memory dumps.';
    const diagnosticProfilerWithThreadStacksChosen: string = 'When the profiler is chosen along with thread stacks option, the process is frozen for a few seconds to dump all raw thread stacks. This option is advisable if you are experiencing long delays (in minutes) to serve the requests or if the application is experiencing deadlocks. During this time, the process cannot serve any requests and application performance will be impacted.';
    const diagnosticProfilerChosen: string = 'The profiling tool is light weight but incurs some CPU overhead during the data collection process.';


    if (this.autohealingSettings != null && this.autohealingSettings.autoHealEnabled && this.autohealingSettings.autoHealRules != null && this.autohealingSettings.autoHealRules.actions != null && this.autohealingSettings.autoHealRules.triggers != null) {

      this.validationWarning.push(restartWarning);

      if (this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime == null
        || (this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime != null && FormatHelper.timespanToSeconds(this.autohealingSettings.autoHealRules.actions.minProcessExecutionTime) < 600)) {
        this.validationWarning.push(minProcessExecutionTimeNotSet);
      }

      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.Recycle) {
        this.validationWarning.push(actionSetToRecycle);
      }

      if (this.autohealingSettings.autoHealRules.actions.actionType === AutoHealActionType.CustomAction
        && this.autohealingSettings.autoHealRules.actions.customAction != null
        && this.autohealingSettings.autoHealRules.actions.customAction.exe != null) {
        if (this.autohealingSettings.autoHealRules.actions.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe') {
          const customActionParam = this.autohealingSettings.autoHealRules.actions.customAction.parameters;

          if (customActionParam.indexOf('"Memory Dump"') > 0) {
            this.validationWarning.push(diagnosticMemoryDumpChosen + diagnosticToolChosen);
          } else if (customActionParam.indexOf('"JAVA Memory Dump"') > 0 || customActionParam.indexOf('"JAVA Thread Dump"') > 0) {
            this.validationWarning.push(diagnosticJavaToolChosen + diagnosticToolChosen);
          } else if (customActionParam.indexOf('"CLR Profiler With ThreadStacks"') > 0) {
            this.validationWarning.push(diagnosticProfilerWithThreadStacksChosen + diagnosticToolChosen);
          } else if (customActionParam.indexOf('"CLR Profiler"') > 0) {
            this.validationWarning.push(diagnosticProfilerChosen + diagnosticToolChosen);
          }
        } else {
          this.validationWarning.push(diagnosticToolChosenCustom + diagnosticToolChosen);
        }
      }
    }
  }
}
