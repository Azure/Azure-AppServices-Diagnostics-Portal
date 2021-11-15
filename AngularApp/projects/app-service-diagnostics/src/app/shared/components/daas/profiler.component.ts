import { Component, OnInit, OnDestroy } from '@angular/core';
import { Session, DaasAppInfo } from '../../models/daas';
import { StepWizardSingleStep } from '../../models/step-wizard-single-step';
import { DaasService } from '../../services/daas.service';
import { WindowService } from '../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasComponent } from './daas.component';
import { SiteService } from '../../services/site.service';


@Component({
    selector: 'profiler',
    templateUrl: 'profiler.component.html',
    styleUrls: ['profiler.component.scss']
})

export class ProfilerComponent extends DaasComponent implements OnInit, OnDestroy {

    instancesStatus: Map<string, number>;
    selectedInstance: string;
    WizardSteps: StepWizardSingleStep[] = [];
    error: any;
    collectStackTraces: boolean = true;
    appInfo: DaasAppInfo;
    checkingAppInfo: boolean = false;
    isAspnetCoreLowerVersion: boolean = false;
    isAspnetCore: boolean = false;
    aspnetCoreWarningExpanded: boolean = true;
    netCoreVersion: string = "";

    constructor(private _serverFarmServiceLocal: ServerFarmDataService, private _siteServiceLocal: SiteService, private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService, private _loggerLocal: AvailabilityLoggingService) {

        super(_serverFarmServiceLocal, _siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal);
        this.diagnoserName = 'CLR Profiler';
        this.diagnoserNameLookup = 'CLR Profiler';
    }

    ngOnInit(): void {
        this.checkingAppInfo = true;
        this._daasServiceLocal.getAppInfo(this.siteToBeDiagnosed).subscribe(resp => {
            this.appInfo = resp;
            this.checkingAppInfo = false;
            if (this.appInfo.Framework === "DotNetCore" || this.appInfo.AspNetCoreVersion != null) {
                this.isAspnetCore = true;
                this.netCoreVersion = this.appInfo.FrameworkVersion != null ? this.appInfo.FrameworkVersion : this.appInfo.AspNetCoreVersion;
                this.isAspnetCoreLowerVersion = !(this.netCoreVersion && this.cmpVersions(this.netCoreVersion, "2.2.3") >= 0);
            }
        }, error => {
            this.checkingAppInfo = false;
        });
    }

    collectProfilerTrace() {
        this.aspnetCoreWarningExpanded = false;
        if (this.collectStackTraces) {
            this.diagnoserName = 'CLR Profiler with Thread Stacks';
        } else {
            this.diagnoserName = 'CLR Profiler';
        }

        this.collectDiagnoserData(false);
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
            AdditionalText: 'Profiler trace will stop automatically after 60 seconds unless overriden explicitly',
            CaptionCompleted: 'Step 2: Events captured'
        });

        this.WizardSteps.push({
            Caption: 'Step 3: Stopping profiler',
            IconType: 'fa-stop',
            AdditionalText: '',
            CaptionCompleted: 'Step 3: Profiler Stopped'
        });

        this.WizardSteps.push({
            Caption: 'Step 4: Analyzing profiler trace',
            IconType: 'fa-cog',
            AdditionalText: '',
            CaptionCompleted: 'Step 4: Analysis Complete'
        });

    }

    getDiagnoserStateFromSession(session: Session) {
        const clrDiagnoser = session.DiagnoserSessions.find(x => x.Name.startsWith('CLR Profiler'));
        if (clrDiagnoser) {
            this.diagnoserSession = clrDiagnoser;
            this.Logs = clrDiagnoser.Logs;
            this.Reports = clrDiagnoser.Reports;
            if (clrDiagnoser.CollectorStatus === 2) {
                if (clrDiagnoser.CollectorStatusMessages.length > 0) {
                    clrDiagnoser.CollectorStatusMessages.forEach(msg => {
                        // The order of this IF check should not be changed
                        if (msg.Message.indexOf('Stopping') >= 0 || msg.Message.indexOf('Stopped') >= 0) {

                            this.instancesStatus.set(msg.EntityType, 3);
                        } else if (msg.Message.indexOf('seconds') >= 0) {
                            this.instancesStatus.set(msg.EntityType, 2);
                        }
                    });
                    this.sessionStatus = this.instancesStatus.get(this.selectedInstance);
                }
            } else if (clrDiagnoser.AnalyzerStatus === 2) {

                // once we are at the analyzer, lets just set all instances's status to
                // analyzing as we will reach here once all the collectors have finsihed
                this.sessionStatus = 4;

                this.WizardStepStatus = '';
                if (clrDiagnoser.AnalyzerStatusMessages.length > 0) {
                    const thisInstanceMessages = clrDiagnoser.AnalyzerStatusMessages.filter(x => x.EntityType.startsWith(this.selectedInstance));
                    if (thisInstanceMessages != null) {
                        const messagesLength = thisInstanceMessages.length;
                        if (messagesLength > 0) {
                            this.WizardStepStatus = thisInstanceMessages[messagesLength - 1].Message;
                        }
                    }
                }

            }
        }
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
        this.aspnetCoreWarningExpanded = !this.aspnetCoreWarningExpanded;
    }

}
