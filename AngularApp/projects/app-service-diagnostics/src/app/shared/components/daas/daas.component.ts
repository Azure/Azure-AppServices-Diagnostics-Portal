import { Component, Input, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { Session, Diagnoser, Report, DiagnoserDefinition, Log, DaasValidationResult } from '../../models/daas';
import { Subscription, Observable, interval } from 'rxjs';
import { StepWizardSingleStep } from '../../models/step-wizard-single-step';
import { SiteService } from '../../services/site.service';
import { DaasService } from '../../services/daas.service';
import { WindowService } from '../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { retry } from 'rxjs/operators';

class InstanceSelection {
    InstanceName: string;
    Selected: boolean;
}

@Component({
    selector: 'daas',
    templateUrl: 'daas.component.html',
    styleUrls: ['daas.component.scss'
    ]
})
export class DaasComponent implements OnInit, OnDestroy {

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
    diagnoserSession: Diagnoser;
    subscription: Subscription;
    sessionStatus: number;
    sessions: Session[];
    instancesStatus: Map<string, number>;
    selectedInstance: string;
    operationInProgress: boolean;
    operationStatus: string;
    Reports: Report[] = [];
    Logs: Log[] = [];
    sessionCompleted: boolean;
    WizardSteps: StepWizardSingleStep[] = [];

    WizardStepStatus: string;

    error: any;
    retrievingInstancesFailed: boolean = false;
    instancesChanged: boolean = false;

    validationResult: DaasValidationResult = new DaasValidationResult();
    cancellingSession: boolean = false;
    collectionMode: number = 0;
    showInstanceWarning: boolean = false;
    sessionHasBlobSasUri: boolean = false;

    constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService, private _windowService: WindowService, private _logger: AvailabilityLoggingService) {
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

            this._daasService.getInstances(this.siteToBeDiagnosed).pipe(retry(2))
                .subscribe(result => {
                    this.operationInProgress = false;
                    this.operationStatus = '';

                    this.instances = result;
                    this.checkRunningSessions();
                    this.populateinstancesToDiagnose();
                    this.initWizard();
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

        this.WizardSteps.push({
            Caption: 'Step 3: Analyzing ' + this.diagnoserName,
            IconType: 'fa-cog',
            AdditionalText: '',
            CaptionCompleted: 'Step 3: ' + this.diagnoserName + ' Analyzed'
        });

    }

    selectMode(mode: number) {
        this.collectionMode = mode;
    }

    checkRunningSessions() {
        this.operationInProgress = true;
        this.operationStatus = 'Checking active sessions...';

        this._daasService.getDaasActiveSessionsWithDetails(this.siteToBeDiagnosed).pipe(retry(2))
            .subscribe(sessions => {
                this.operationInProgress = false;
                this.operationStatus = '';

                let runningSession;
                for (let index = 0; index < sessions.length; index++) {
                    if (sessions[index].Status === 0) {
                        const daasDiagnoser = sessions[index].DiagnoserSessions.find(x => x.Name.startsWith(this.diagnoserNameLookup));
                        if (daasDiagnoser) {
                            runningSession = sessions[index];
                            this.sessionHasBlobSasUri = sessions[index].HasBlobSasUri;
                            break;
                        }
                    }
                }
                if (runningSession) {
                    this.sessionInProgress = true;
                    this.updateInstanceInformationOnLoad();
                    this.getDiagnoserStateFromSession(runningSession);
                    this.sessionId = runningSession.SessionId;
                    this.subscription = interval(10000).subscribe(res => {
                        this.pollRunningSession(this.sessionId);
                    });
                }
            });
    }

    pollRunningSession(sessionId: string) {
        let inProgress = false;
        this._daasService.getDaasSessionWithDetails(this.siteToBeDiagnosed, sessionId)
            .subscribe(runningSession => {
                this.getDiagnoserStateFromSession(runningSession);
                if (runningSession.Status === 0) {
                    inProgress = true;
                } else {
                    this.sessionInProgress = false;

                    // stop our timer at this point
                    if (this.subscription) {
                        this.subscription.unsubscribe();
                    }

                    const daasDiagnoser = runningSession.DiagnoserSessions.find(x => x.Name.startsWith(this.diagnoserNameLookup));
                    if (daasDiagnoser) {
                        this.Reports = daasDiagnoser.Reports;
                        this.Logs = daasDiagnoser.Logs;
                        this.sessionCompleted = true;
                    }

                    // Update the sessions information table when a running session finishes
                    this.SessionsEvent.emit(true);
                }
                this.sessionInProgress = inProgress;
            });
    }

    getDiagnoserStateFromSession(session: Session) {
        const daasDiagnoser = session.DiagnoserSessions.find(x => x.Name.startsWith(this.diagnoserNameLookup));
        if (daasDiagnoser) {
            this.diagnoserSession = daasDiagnoser;
            this.Logs = daasDiagnoser.Logs;
            this.Reports = daasDiagnoser.Reports;
            if (daasDiagnoser.CollectorStatus === 2) {
                this.sessionStatus = 2;
                if (daasDiagnoser.CollectorStatusMessages.length > 0) {
                    const thisInstanceMessages = daasDiagnoser.CollectorStatusMessages.filter(x => x.EntityType === this.selectedInstance);
                    const messagesLength = thisInstanceMessages.length;
                    if (messagesLength > 0) {
                        this.WizardStepStatus = thisInstanceMessages[messagesLength - 1].Message;
                    }
                }
            } else if (daasDiagnoser.AnalyzerStatus === 2) {
                this.WizardStepStatus = '';
                if (daasDiagnoser.AnalyzerStatusMessages.length > 0) {
                    const thisInstanceMessages = daasDiagnoser.AnalyzerStatusMessages.filter(x => x.EntityType.startsWith(this.selectedInstance));
                    if (thisInstanceMessages != null) {
                        const messagesLength = thisInstanceMessages.length;
                        if (messagesLength > 0) {
                            this.WizardStepStatus = thisInstanceMessages[messagesLength - 1].Message;
                        }
                    }
                }

                this.sessionStatus = 3;
            }
        }
    }

    updateInstanceInformationOnLoad() {
        this.instancesStatus = new Map<string, number>();
        this.instances.forEach(x => {
            this.instancesStatus.set(x, 1);
        });
        if (this.instances.length > 0) {
            this.selectedInstance = this.instances[0];
        }
    }

    updateInstanceInformation() {
        this.instancesStatus = new Map<string, number>();

        if (this.instancesToDiagnose.length > 0) {
            this.instancesToDiagnose.forEach(x => {
                this.instancesStatus.set(x, 1);
            });

            this.selectedInstance = this.instances[0];
        }
    }

    populateinstancesToDiagnose() {
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

    collectDiagnoserData(consentRequired: boolean) {
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

        this._daasService.getInstances(this.siteToBeDiagnosed).pipe(retry(2))
            .subscribe(result => {
                this.operationInProgress = false;
                this.operationStatus = '';

                if (!this.compareInstances(this.instances, result)) {
                    this.instances = result;
                    this.populateinstancesToDiagnose();
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
                this.Reports = [];
                this.Logs = [];
                this.sessionInProgress = true;
                this.sessionStatus = 1;
                this.updateInstanceInformation();

                const submitNewSession = this._daasService.submitDaasSession(this.siteToBeDiagnosed, this.diagnoserName, this.instancesToDiagnose, this.collectionMode === 1, this.validationResult.SasUriAsAppSetting ? "" : this.validationResult.BlobSasUri)
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
        this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${url}`);
    }

    openLog(log: Log, hasBlobSasUri: boolean) {
        if (hasBlobSasUri) {
            this._windowService.open(`${log.FullPermanentStoragePath}`);
        } else {
            this._windowService.open(`https://${this.scmPath}/api/vfs/data/DaaS/${log.RelativePath}`);
        }

    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.Reports = [];
        this.Logs = [];

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
