import { Component, OnInit, OnDestroy } from '@angular/core';
import { StepWizardSingleStep } from '../../../models/step-wizard-single-step';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { LogFile, Session } from '../../../models/daas';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { DaasComponent } from '../daas/daas.component';
import { WebSitesService } from 'projects/app-service-diagnostics/src/app/resources/web-sites/services/web-sites.service';

@Component({
    selector: 'java-flight-recorder',
    templateUrl: './java-flight-recorder.component.html',
    styleUrls: ['./java-flight-recorder.component.scss', '../daas/daas.component.scss']
})
export class JavaFlightRecorderComponent extends DaasComponent implements OnInit, OnDestroy {

    instancesStatus: Map<string, number>;
    selectedInstance: string;
    WizardSteps: StepWizardSingleStep[] = [];
    error: any;

    constructor(private _serverFarmServiceLocal: ServerFarmDataService, private _siteServiceLocal: SiteService,
        private _daasServiceLocal: DaasService, private _windowServiceLocal: WindowService,
        private _loggerLocal: AvailabilityLoggingService, private _webSiteServiceLocal: WebSitesService) {
        super(_serverFarmServiceLocal, _siteServiceLocal, _daasServiceLocal, _windowServiceLocal, _loggerLocal, _webSiteServiceLocal);
        this.diagnoserName = 'JAVA Flight Recorder';
        this.diagnoserNameLookup = 'JAVA Flight Recorder';
    }

    ngOnInit(): void {
    }

    collectJfrTrace() {
        this.collectDiagnoserData(false);
    }

    initWizard(): void {
        this.WizardSteps = [];
        this.WizardSteps.push({
            Caption: 'Step 1: Starting Java Flight Recorder',
            IconType: 'fa-clock-o',
            AdditionalText: '',
            CaptionCompleted: 'Step 1: Java Flight Recorder Started'
        });

        this.WizardSteps.push({
            Caption: 'Step 2: Reproduce the issue now',
            IconType: 'fa-user',
            AdditionalText: 'Flight Recorder trace will stop automatically after 60 seconds',
            CaptionCompleted: 'Step 2: Events captured'
        });

        this.WizardSteps.push({
            Caption: 'Step 3: Stopping Flight Recorder',
            IconType: 'fa-stop',
            AdditionalText: '',
            CaptionCompleted: 'Step 3: Flight Recorder Stopped'
        });

        this.WizardSteps.push({
            Caption: 'Step 4: Analyzing Flight Recorder trace',
            IconType: 'fa-cog',
            AdditionalText: '',
            CaptionCompleted: 'Step 4: Analysis Complete'
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
          if (activeInstance.Status == "Started") {
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

}
