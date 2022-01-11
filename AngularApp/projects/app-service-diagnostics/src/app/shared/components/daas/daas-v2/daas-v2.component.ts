import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { Session, Diagnoser, Report, Log, DaasValidationResult, ReportV2, LogFile, SessionV2, ActiveInstance, SessionModeV2 } from '../../../models/daas';
import { Subscription, Observable, interval } from 'rxjs';
import { StepWizardSingleStep } from '../../../models/step-wizard-single-step';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';
import { retry } from 'rxjs/operators';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { OperatingSystem } from '../../../models/site';

class InstanceSelection {
  InstanceName: string;
  Selected: boolean;
}

@Component({
  selector: 'daas-v2',
  templateUrl: './daas-v2.component.html',
  styleUrls: ['./daas-v2.component.scss', '../daas.component.scss']
})
export class DaasV2Component implements OnInit, OnDestroy {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() scmPath: string;
  @Input() diagnoserName: string;
  @Input() diagnoserNameLookup: string = '';

  @Output() SessionsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  instances: string[];
  instancesToDiagnose: string[];
  instancesSelected: InstanceSelection[] = [];
  sessionId: string;
  sessionInProgress: boolean;
  subscription: Subscription;
  sessionStatus: number;
  instancesStatus: Map<string, number>;
  selectedInstance: string;
  operationInProgress: boolean;
  operationStatus: string;
  sessionCompleted: boolean;
  WizardSteps: StepWizardSingleStep[] = [];

  WizardStepStatus: string;

  error: any;
  retrievingInstancesFailed: boolean = false;
  instancesChanged: boolean = false;

  validationResult: DaasValidationResult = new DaasValidationResult();
  cancellingSession: boolean = false;
  collectionMode: SessionModeV2 = SessionModeV2.CollectAndAnalyze;
  showInstanceWarning: boolean = false;
  sessionHasBlobSasUri: boolean = false;

  activeInstance: ActiveInstance;
  logFiles: LogFile[] = [];
  isWindowsApp: boolean = true;
  linuxDumpType: string = "Full";
  showCancelButton: boolean = false;

  constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService,
    private _daasService: DaasService, private _windowService: WindowService,
    private _logger: AvailabilityLoggingService, private _webSiteService: WebSitesService) {
    this.isWindowsApp = this._webSiteService.platform === OperatingSystem.windows;

    //
    // For Linux, only collection is supported currently
    //
    this.collectionMode = this.isWindowsApp ? SessionModeV2.CollectAndAnalyze : this.sessionMode.Collect;
  }

  public get sessionMode(): typeof SessionModeV2 {
    return SessionModeV2;
  }

  onDaasValidated(validation: DaasValidationResult) {
    this.validationResult = validation;
    if (validation.Validated) {
      if (this.diagnoserNameLookup === '') {
        this.diagnoserNameLookup = this.diagnoserName;
      }

      this.sessionCompleted = false;
      this.operationInProgress = true;
      this.operationStatus = 'Retrieving instances...';

      this._daasService.getInstances(this.siteToBeDiagnosed, this.isWindowsApp).pipe(retry(2))
        .subscribe(result => {
          this.operationInProgress = false;
          this.operationStatus = '';

          this.instances = result;
          this.checkRunningSessions();
          this.populateInstancesToDiagnose();
        },
          error => {
            this.error = error;
            this.operationInProgress = false;
            this.retrievingInstancesFailed = true;
          });
    }
  }

  ngOnInit(): void {
  }

  initWizard(): void {
    this.WizardSteps = [];
    this.WizardSteps.push({
      Caption: 'Step 1: Initializing Diagnostics ',
      IconType: 'fa-clock-o',
      AdditionalText: '',
      CaptionCompleted: 'Step 1: Initialized Diagnostics'
    });

    this.WizardSteps.push({
      Caption: 'Step 2: Collecting ' + this.diagnoserName,
      IconType: 'fa-clone',
      AdditionalText: '',
      CaptionCompleted: 'Step 2: ' + this.diagnoserName + ' Collected'
    });

    if (this.isWindowsApp) {
      this.WizardSteps.push({
        Caption: 'Step 3: Analyzing ' + this.diagnoserName,
        IconType: 'fa-cog',
        AdditionalText: '',
        CaptionCompleted: 'Step 3: ' + this.diagnoserName + ' Analyzed'
      });
    }
  }

  selectMode(mode: SessionModeV2) {
    this.collectionMode = mode;
  }

  checkRunningSessions() {
    this.operationInProgress = true;
    this.operationStatus = 'Checking active sessions...';

    this._daasService.getActiveSession(this.siteToBeDiagnosed, this.isWindowsApp).pipe(retry(2))
      .subscribe(activeSession => {
        this.operationInProgress = false;
        this.operationStatus = '';
        if (activeSession && activeSession.Tool === this.diagnoserName) {
          this.sessionInProgress = true;
          this.initWizard();
          this.updateInstanceInformationOnLoad(activeSession.Instances);
          this.populateSessionInformation(activeSession);
          this.sessionId = activeSession.SessionId;
          this.subscription = interval(10000).subscribe(res => {
            this.pollRunningSession(this.sessionId);
          });
        }
      });
  }

  pollRunningSession(sessionId: string) {
    this._daasService.getSession(this.siteToBeDiagnosed, sessionId)
      .subscribe(activeSession => {
        if (activeSession != null && activeSession.Tool === this.diagnoserName) {
          this.populateSessionInformation(activeSession);

          if (activeSession.Status != "Active") {
            this.sessionInProgress = false;
            this.sessionCompleted = true;
            // stop our timer at this point
            if (this.subscription) {
              this.subscription.unsubscribe();
            }
            this.SessionsEvent.emit(true);
          } else {
            this.sessionInProgress = true;
          }
        }
      });
  }

  populateSessionInformation(session: SessionV2) {

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

    if (activeInstance.Status == "Started") {
      this.sessionStatus = 2;
      if (Array.isArray(activeInstance.CollectorStatusMessages)) {
        let messageCount = activeInstance.CollectorStatusMessages.length;
        if (messageCount > 0) {
          this.WizardStepStatus = activeInstance.CollectorStatusMessages[messageCount - 1];
        } else {
          this.WizardStepStatus = "";
        }
      }
    } else if (activeInstance.Status == "Analyzing" || activeInstance.Status == "Complete") {
      this.sessionStatus = 3;
      if (Array.isArray(activeInstance.AnalyzerStatusMessages)) {
        let messageCount = activeInstance.AnalyzerStatusMessages.length;
        if (messageCount > 0) {
          this.WizardStepStatus = activeInstance.CollectorStatusMessages[messageCount - 1];
        } else {
          this.WizardStepStatus = "";
        }
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

  updateInstanceInformationOnLoad(instances: string[]) {
    this.instancesStatus = new Map<string, number>();
    if (instances == null || instances.length == 0) {
      return;
    }

    instances.forEach(x => {
      this.instancesStatus.set(x, 1);
    });

    this.selectedInstance = instances[0];
  }

  updateInstanceInformation() {
    this.instancesStatus = new Map<string, number>();

    if (this.instancesToDiagnose.length > 0) {
      this.instancesToDiagnose.forEach(x => {
        this.instancesStatus.set(x, 1);
      });

      this.selectedInstance = this.instancesToDiagnose[0];
    }
  }

  populateInstancesToDiagnose() {
    this.instancesSelected = new Array();

    if (this.instances && this.instances.length > 0) {
      this.instances.forEach(x => {
        const s = new InstanceSelection();
        s.InstanceName = x;
        s.Selected = false;
        this.instancesSelected.push(s);
      });
    }
  }

  compareInstances(oldInstances: string[], newInstances: string[]): boolean {
    return oldInstances.length == newInstances.length && oldInstances.every(function (v, i) { return v === newInstances[i]; });
  }

  getSelectedInstanceCount(): number {
    let instancesSelected = 0;
    this.instancesSelected.forEach(x => {
      if (x.Selected) {
        instancesSelected++;
      }
    });
    return instancesSelected;
  }

  validateInstancesToCollect(): boolean {
    let consentRequired = false;
    if (this.instances.length > 1) {
      let instancesSelected = this.getSelectedInstanceCount();
      let percentInstanceSelected: number = (instancesSelected / this.instances.length);
      if (percentInstanceSelected > 0.5) {
        consentRequired = true;
      }
    }
    return consentRequired;
  }

  collectDiagnoserData(consentRequired: boolean, additionalParams: string = "") {
    consentRequired = consentRequired && !this.diagnoserName.startsWith("CLR Profiler");
    if (consentRequired && this.validateInstancesToCollect()) {
      this.showInstanceWarning = true;
      return;
    }
    else {
      this.showInstanceWarning = false;
    }
    this.instancesChanged = false;
    this.operationInProgress = true;
    this.operationStatus = 'Validating instances...';

    this._daasService.getInstances(this.siteToBeDiagnosed, this.isWindowsApp).pipe(retry(2))
      .subscribe(result => {
        this.operationInProgress = false;
        this.operationStatus = '';

        if (!this.compareInstances(this.instances, result)) {
          this.instances = result;
          this.populateInstancesToDiagnose();
          this.instancesChanged = true;
          return;
        }

        this._logger.LogClickEvent(this.diagnoserName, 'DiagnosticTools');
        this.instancesToDiagnose = new Array<string>();

        if (this.instancesSelected && this.instancesSelected !== null) {
          this.instancesSelected.forEach(x => {
            if (x.Selected) {
              this.instancesToDiagnose.push(x.InstanceName);
            }
          });
        }

        if (this.instancesToDiagnose.length === 0) {
          alert('Please choose at-least one instance');
          return false;
        }

        this.sessionHasBlobSasUri = this.validationResult.BlobSasUri.length > 0;
        this.sessionInProgress = true;
        this.sessionStatus = 1;
        this.updateInstanceInformation();

        let sessionV2 = new SessionV2();
        sessionV2.Mode = this.collectionMode;
        sessionV2.Tool = this.diagnoserName;
        sessionV2.Instances = this.instancesToDiagnose;

        if (!this.isWindowsApp) {
          sessionV2.ToolParams = this.diagnoserName.startsWith('MemoryDump') ? `DumpType=${this.linuxDumpType}` : additionalParams
        }

        this.initWizard();
        this._daasService.submitDaasSessionV2(this.siteToBeDiagnosed, sessionV2)
          .subscribe(result => {
            this.sessionId = result;
            this.subscription = interval(10000).subscribe(res => {
              this.pollRunningSession(this.sessionId);
            });
          },
            error => {
              this.error = error;
              this.sessionInProgress = false;
            });
      },
        error => {
          this.error = error;
          this.operationInProgress = false;
          this.retrievingInstancesFailed = true;
        });
  }

  onInstanceChange(instanceSelected: string): void {
    this.selectedInstance = instanceSelected;
  }

  openFile(url: string) {
    if (url.indexOf("https://") > -1) {
      this._windowService.open(url);
    } else {
      this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }
  }

  openLog(log: LogFile, hasBlobSasUri: boolean) {
    this._windowService.open(`${log.RelativePath}`);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.activeInstance = null;

  }

  cancelSession(): void {
    this.cancellingSession = true;
    this._daasService.cancelDaasSession(this.siteToBeDiagnosed, this.sessionId).subscribe(resp => {
      this.cancellingSession = false;
      this.sessionInProgress = false;
      this.SessionsEvent.emit(true);
    });

  }

  getInstanceNameFromReport(reportName: string): string {
    if (this.diagnoserNameLookup.indexOf('Profiler') > -1
      || this.diagnoserNameLookup.indexOf('MemoryDump') > -1
      || this.diagnoserNameLookup.indexOf('Memory Dump') > -1) {
      const reportNameArray = reportName.split('_');
      if (reportNameArray.length > 0) {
        return reportNameArray[0];
      }
    }
    return reportName;
  }
}
