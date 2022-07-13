import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { DaasValidationResult, LogFile, Session, ActiveInstance, SessionMode, Instance } from '../../../models/daas';
import { Subscription, Observable, interval, forkJoin, of } from 'rxjs';
import { StepWizardSingleStep } from '../../../models/step-wizard-single-step';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from '../../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';
import { catchError, delay, map, retry, retryWhen, take } from 'rxjs/operators';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { OperatingSystem } from '../../../models/site';
import moment = require('moment');

class InstanceSelection {
  InstanceName: string;
  Selected: boolean;
  InstanceId: string;
}

@Component({
  selector: 'daas',
  templateUrl: './daas.component.html',
  styleUrls: ['./daas.component.scss']
})
export class DaasComponent implements OnInit, OnDestroy {

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() scmPath: string;
  @Input() diagnoserName: string = '';
  @Input() diagnoserNameLookup: string = '';
  @Input() allLinuxInstancesOnAnt98: boolean;

  @Output() SessionsEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  instances: Instance[];
  instancesToDiagnose: Instance[];
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
  useDiagServerForLinux: boolean = false;
  linuxSubmittedInstances: SessionResponse[] = [];

  WizardStepStatus: string;

  error: any;
  retrievingInstancesFailed: boolean = false;
  instancesChanged: boolean = false;

  validationResult: DaasValidationResult = new DaasValidationResult();
  cancellingSession: boolean = false;
  collectionMode: SessionMode = SessionMode.CollectAndAnalyze;
  showInstanceWarning: boolean = false;

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
    this.collectionMode = this.isWindowsApp ? SessionMode.CollectAndAnalyze : this.sessionMode.Collect;
  }

  public get sessionMode(): typeof SessionMode {
    return SessionMode;
  }

  onDaasValidated(validation: DaasValidationResult) {
    this.validationResult = validation;
    if (validation.Validated) {
      this.useDiagServerForLinux = validation.UseDiagServerForLinux
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

  selectMode(mode: SessionMode) {
    this.collectionMode = mode;
  }

  checkRunningSessions() {
    this.operationInProgress = true;
    this.operationStatus = 'Checking active sessions...';

    this._daasService.getActiveSession(this.siteToBeDiagnosed, this.isWindowsApp, this.useDiagServerForLinux).pipe(retryWhen(errors => errors.pipe(delay(3000), take(3))))
      .subscribe(activeSession => {
        this.populateActiveSession(activeSession);
      });
  }

  populateActiveSession(activeSession: Session) {
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
  }

  pollRunningSession(sessionId: string) {
    this._daasService.getSession(this.siteToBeDiagnosed, sessionId, this.useDiagServerForLinux)
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
    if (activeInstance.Status == "Started" || activeInstance.Status == "Active") {
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
        this.instancesStatus.set(x.machineName, 1);
      });

      this.selectedInstance = this.instancesToDiagnose[0].machineName;
    }
  }

  populateInstancesToDiagnose() {
    this.instancesSelected = new Array();

    if (this.instances && this.instances.length > 0) {
      this.instances.forEach(x => {
        const s = new InstanceSelection();
        s.InstanceName = x.machineName;
        s.Selected = false;
        s.InstanceId = x.instanceId;
        this.instancesSelected.push(s);
      });
    }
  }

  compareInstances(oldInstances: Instance[], newInstances: Instance[]): boolean {
    return oldInstances.length == newInstances.length && oldInstances.every(function (v, i) { return v.instanceId === newInstances[i].instanceId; });
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
    this.linuxSubmittedInstances = [];
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
        this.instancesToDiagnose = new Array<Instance>();

        if (this.instancesSelected && this.instancesSelected !== null) {
          this.instancesSelected.forEach(x => {
            if (x.Selected) {
              this.instancesToDiagnose.push({ instanceId: x.InstanceId, machineName: x.InstanceName });
            }
          });
        }

        if (this.instancesToDiagnose.length === 0) {
          alert('Please choose at-least one instance');
          return false;
        }

        this.sessionInProgress = true;
        this.sessionStatus = 1;
        this.updateInstanceInformation();

        let session = new Session();
        session.Mode = this.collectionMode;
        session.Tool = this.diagnoserName;
        session.Instances = this.instancesToDiagnose.map(i => i.machineName);

        if (!this.isWindowsApp) {
          session.ToolParams = this.diagnoserName.startsWith('MemoryDump') ? `DumpType=${this.linuxDumpType}` : additionalParams
        }

        this.initWizard();
        this.submitDaasSession(session)
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

  submitDaasSession(session: Session): Observable<string> {
    if (this.useDiagServerForLinux) {
      return this.submitDiagnosticServerSession(session).pipe(
        map(responses => {
          this.linuxSubmittedInstances = responses;
          let successfulSessionSubmission = responses.filter(x => x.sessionId != null && x.sessionId.length > 5);
          if (successfulSessionSubmission != null && successfulSessionSubmission.length > 0) {
            return responses[0].sessionId;
          } else {
            let errors = responses.filter(x => x.error != null);
            if (errors != null && errors.length > 0) {
              this.error = errors[0].error;
              this.sessionInProgress = false;
            }
          }

        }));
    } else {
      return this._daasService.submitDaasSession(this.siteToBeDiagnosed, session);
    }
  }

  submitDiagnosticServerSession(session: Session): Observable<Array<SessionResponse>> {
    session.SessionId = moment().utc().format('YYMMDD_HHmmssSSSS');
    let tasks = this.instancesToDiagnose.map(instance => {
      return this.submitSessionOnInstance(instance, session)
    });

    return forkJoin(tasks);
  }

  submitSessionOnInstance(instance: Instance, session: Session): Observable<SessionResponse> {
    return this._daasService.submitDaasSessionOnInstance(this.siteToBeDiagnosed, session, instance.instanceId).pipe(
      retry(1),
      map((sessionId) => {
        let sessionResponse = new SessionResponse();
        sessionResponse.error = null;
        sessionResponse.sessionId = sessionId;
        sessionResponse.instanceId = instance.instanceId;
        sessionResponse.machineName = instance.machineName;
        return sessionResponse;
      }),
      catchError(error => {
        let sessionResponse = new SessionResponse();
        sessionResponse.error = error;
        sessionResponse.sessionId = null;
        sessionResponse.instanceId = instance.instanceId;
        sessionResponse.machineName = instance.machineName;
        return of(sessionResponse);
      }));
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

  openLog(log: LogFile) {
    this._windowService.open(`${log.RelativePath}`);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.activeInstance = null;

  }

  cancelSession(): void {
    // this.cancellingSession = true;
    // this._daasService.cancelDaasSession(this.siteToBeDiagnosed, this.sessionId).subscribe(resp => {
    //   this.cancellingSession = false;
    //   this.sessionInProgress = false;
    //   this.SessionsEvent.emit(true);
    // });
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

class SessionResponse {
  sessionId: string;
  error: any;
  instanceId: string;
  machineName: string;
}
