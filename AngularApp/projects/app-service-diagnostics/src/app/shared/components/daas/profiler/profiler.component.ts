import { Component, OnDestroy, OnInit } from '@angular/core';
import { DaasService } from '../../../services/daas.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { SiteService } from '../../../services/site.service';
import { DaasComponent } from '../daas/daas.component';
import { WindowService } from '../../../../startup/services/window.service';
import { StepWizardSingleStep } from '../../../models/step-wizard-single-step';
import { DaasAppInfo, LogFile, Session } from '../../../models/daas';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../../models/site';

@Component({
  selector: 'profiler',
  templateUrl: './profiler.component.html',
  styleUrls: ['./profiler.component.scss', '../daas/daas.component.scss']
})
export class ProfilerComponent extends DaasComponent implements OnInit, OnDestroy {

  instancesStatus: Map<string, number>;
  selectedInstance: string;
  WizardSteps: StepWizardSingleStep[] = [];
  error: any;
  collectStackTraces: boolean = true;
  appInfo: DaasAppInfo;
  checkingAppInfo: boolean = false;
  isAspNetCoreLowerVersion: boolean = false;
  isAspNetCore: boolean = false;
  aspNetCoreWarningExpanded: boolean = true;
  netCoreVersion: string = "";
  linuxProfileDuration: number = 60;

  constructor(private _serverFarmServiceLocal: ServerFarmDataService, private _siteServiceLocal: SiteService,
    private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService,
    private _loggerLocal: AvailabilityLoggingService, private _webSiteServiceLocal: WebSitesService) {
    super(_serverFarmServiceLocal, _siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal, _webSiteServiceLocal);

    if (this.diagnoserName === '') {
      this.diagnoserName = 'Profiler';
      this.diagnoserNameLookup = 'Profiler';
    }
    this.collectStackTraces = this.isWindowsApp;
    this.diagnoserName = this.collectStackTraces ? 'Profiler with Thread Stacks' : 'Profiler';
  }

  ngOnInit(): void {
    if (this.isWindowsApp) {
      this.checkingAppInfo = true;
      this._daasServiceLocal.getAppInfo(this.siteToBeDiagnosed).subscribe(resp => {
        this.appInfo = resp;
        this.checkingAppInfo = false;
        if (this.appInfo.Framework === "DotNetCore" || this.appInfo.AspNetCoreVersion != null) {
          this.isAspNetCore = true;
          this.netCoreVersion = this.appInfo.FrameworkVersion != null ? this.appInfo.FrameworkVersion : this.appInfo.AspNetCoreVersion;
          this.isAspNetCoreLowerVersion = !(this.netCoreVersion && this.cmpVersions(this.netCoreVersion, "2.2.3") >= 0);
        }
      }, error => {
        this.checkingAppInfo = false;
      });
    }
  }

  collectProfilerTrace() {
    this.aspNetCoreWarningExpanded = false;
    let toolParams = `DurationSeconds=${this.linuxProfileDuration}`;
    this.collectDiagnoserData(false, toolParams);
  }

  initWizard(): void {
    this.WizardSteps = [];
    this.WizardSteps.push({
      Caption: 'Step 1: Starting Profiler',
      IconType: 'fa-clock-o',
      AdditionalText: '',
      CaptionCompleted: 'Step 1: Profiler Started'
    });

    this.WizardSteps.push({
      Caption: 'Step 2: Reproduce the issue now',
      IconType: 'fa-user',
      AdditionalText: this.isWindowsApp ? 'Profiler trace will stop automatically after 60 seconds unless overridden explicitly' : `Profiler trace will stop automatically after the configured duration`,
      CaptionCompleted: 'Step 2: Events captured'
    });

    this.WizardSteps.push({
      Caption: 'Step 3: Stopping profiler',
      IconType: 'fa-stop',
      AdditionalText: '',
      CaptionCompleted: 'Step 3: Profiler Stopped'
    });

    if (this.isWindowsApp) {
      this.WizardSteps.push({
        Caption: 'Step 4: Analyzing profiler trace',
        IconType: 'fa-cog',
        AdditionalText: '',
        CaptionCompleted: 'Step 4: Analysis Complete'
      });
    }
  }

  populateSessionInformation(session: Session) {

    if (session.Status === "Active") {
      this.sessionStatus = 1;
    }
    if (!session.ActiveInstances) {
      return;
    }

    let activeInstance = session.ActiveInstances.find(x => x.Name === this.selectedInstance);
    if (!activeInstance) {
      return;
    }

    this.activeInstance = activeInstance;
    if (this.isWindowsApp) {
      if (activeInstance.Status == "Started") {
        this.WizardStepStatus = "";
        activeInstance.CollectorStatusMessages.forEach(msg => {

          //
          // The order of this IF check should not be changed
          //

          if (msg.indexOf('Stopping') >= 0 || msg.indexOf('Stopped') >= 0) {
            this.sessionStatus = 3;
          } else if (msg.indexOf('seconds') >= 0) {
            this.sessionStatus = 2;
          }
        });
      } else if (activeInstance.Status == "Analyzing" || activeInstance.Status == "Complete") {

        //
        // once we are at the analyzer, lets just set all instances's status to
        // analyzing as we will reach here once all the collectors have finished

        this.sessionStatus = 4;
        this.activeInstance = activeInstance;
        let messageCount = activeInstance.AnalyzerStatusMessages.length;
        if (messageCount > 0) {
          this.WizardStepStatus = activeInstance.AnalyzerStatusMessages[messageCount - 1];
        } else {
          this.WizardStepStatus = "";
        }
      }
    } else {
      if (activeInstance.Status == "Started" || activeInstance.Status == "Active") {
        this.sessionStatus = 2;
      }
    }

    let logFiles: LogFile[] = [];
    session.ActiveInstances.forEach(activeInstance => {
      if (activeInstance.Logs && activeInstance.Logs.length > 0) {
        logFiles = logFiles.concat(activeInstance.Logs);
      }
    });

    this.logFiles = logFiles;
  }

  // https://stackoverflow.com/questions/6832596/how-to-compare-software-version-number-using-js-only-number
  cmpVersions(a: string, b: string) {
    var i = 0, diff = 0;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
      diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
      if (diff) {
        return diff;
      }
    }
    return segmentsA.length - segmentsB.length;
  }

  toggleExpanded(): void {
    this.aspNetCoreWarningExpanded = !this.aspNetCoreWarningExpanded;
  }

}
