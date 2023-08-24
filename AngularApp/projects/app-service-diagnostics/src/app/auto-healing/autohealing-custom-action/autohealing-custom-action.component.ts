import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ViewChild, AfterViewInit } from '@angular/core';
import { ServerFarmDataService } from '../../shared/services/server-farm-data.service';
import { SiteService } from '../../shared/services/site.service';
import { SiteInfoMetaData } from '../../shared/models/site';
import { AutoHealCustomAction } from '../../shared/models/autohealing';
import { DaasService } from '../../shared/services/daas.service';
import { DaasValidatorComponent } from '../../shared/components/daas/daas-validator.component';
import { DaasValidationResult } from '../../shared/models/daas';

const daasConsolePath: string = "D:\\home\\data\\DaaS\\bin\\DaasConsole.exe";

@Component({
  selector: 'autohealing-custom-action',
  templateUrl: './autohealing-custom-action.component.html',
  styleUrls: ['./autohealing-custom-action.component.scss', '../autohealing.component.scss']
})
export class AutohealingCustomActionComponent implements OnInit, OnChanges, AfterViewInit {
  constructor(private _serverFarmService: ServerFarmDataService, private _siteService: SiteService, private _daasService: DaasService) {
  }

  @ViewChild('daasValidatorRef') daasValidatorRef: DaasValidatorComponent;

  @Input() siteToBeDiagnosed: SiteInfoMetaData;
  @Input() customAction: AutoHealCustomAction;
  @Output() customActionChanged: EventEmitter<AutoHealCustomAction> = new EventEmitter<AutoHealCustomAction>();

  diagnoser: any = null;
  diagnoserOption: any = null;
  showDiagnoserOptionWarning: boolean = false;
  validationResult: DaasValidationResult = new DaasValidationResult();
  updatedCustomAction: AutoHealCustomAction = new AutoHealCustomAction();
  
  isElasticPremium: boolean = false;

  Diagnosers = [{ Name: 'Memory Dump', Enabled: true, Description: 'Collects memory dumps of the process and the child processes hosting your app and analyzes them for errors' },
  { Name: 'CLR Profiler', Enabled: true, Description: 'Profiles ASP.NET application code to identify exceptions and performance issues' },
  { Name: 'CLR Profiler with Thread Stacks', Enabled: true, Description: 'Profiles ASP.NET application code to identify exceptions and performance issues and dumps stacks to identify deadlocks' },
  { Name: 'JAVA Memory Dump', Enabled: true, Description: 'Collects a binary memory dump using jMap of all java.exe processes running for this web app' },
  { Name: 'JAVA Thread Dump', Enabled: true, Description: 'Collects jStack output of all java.exe processes running for this app and analyzes the same' }];
  DiagnoserOptions = [
    { option: 'CollectKillAnalyze', Description: 'With this option, the above selected tool\'s data will collected, analyzed and the process will be recycled.' },
    { option: 'CollectLogs', Description: 'With this option, only the above selected tool\'s data will collected. No analysis will be performed and process will not be restarted.' },
    { option: 'Troubleshoot', Description: 'With this option, the above selected tool\'s data will collected and then analyzed. This will not cause the process to restart. ' }
  ];
  customActionType: string = 'Diagnostics';

  ngOnChanges() {
    this.initComponent();
  }

  ngOnInit() {
    this.initComponent();
    // This is required in case someone lands on Mitigate page
    // without ever hitting DAAS endpoint. Browsing to any DAAS
    // endpoint, will ensure that DaaSConsole is copied to the
    // right folders and will allow autohealing to work correctly
    this.makeDaasWarmupCall();
  }

  ngAfterViewInit() {
    this.chooseDiagnoser(this.diagnoser);
  }

  makeDaasWarmupCall(): any {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(siteDaasInfo => {
      this._daasService.getDiagnosers(siteDaasInfo).subscribe(resp => {
        //do nothing with resp
      });
    });

  }
  initComponent() {
    if (this.customAction == null) {
      this.diagnoserOption = this.DiagnoserOptions[0];
      this.diagnoser = this.Diagnosers[0];

      return;
    } else {
      const diagnosticsConfiguredCorrectly = this.isDiagnosticsConfigured();
      if (!diagnosticsConfiguredCorrectly) {
        this.initDiagnosticsIfRequired();
      }
    }
  }

  saveCustomAction() {
    if (this.customActionType === 'Diagnostics') {
      this.updateDaasAction(true);
    } else {
      this.updateCustomAction();
    }
  }

  initDiagnosticsIfRequired() {
    if (this.diagnoser == null) {
      this.diagnoser = this.Diagnosers[0];
    }

    if (this.diagnoserOption == null) {
      this.diagnoserOption = this.DiagnoserOptions[0];
    }
  }

  isDiagnosticsConfigured(): boolean {
    let invalidSetting = false;
    if (this.customAction != null) {
      if (this.customAction.exe.toLowerCase() === daasConsolePath.toLowerCase()) {
        this.customActionType = 'Diagnostics';
        if (this.customAction.parameters !== '') {
          invalidSetting = this.getDiagnoserNameAndOptionFromParameter(this.customAction.parameters);
        }
        if (invalidSetting) {
          this.initDiagnosticsIfRequired();
        }
      } else {
        this.customActionType = 'Custom';
        this.updatedCustomAction.exe = this.customAction.exe;
        this.updatedCustomAction.parameters = this.customAction.parameters;
      }
      return true;
    } else {
      return false;
    }
  }

  chooseDiagnoser(val) {
    if (val != null && val.Enabled) {
      this.diagnoser = val;
      this.daasValidatorRef.diagnoserName = this.diagnoser.Name;
      this.daasValidatorRef.validateDiagnoser();
      this.updateDaasAction(false);
    }
  }

  chooseDiagnoserAction(val) {
    this.diagnoserOption = val;
    if (this.diagnoserOption.option !== 'CollectKillAnalyze') {
      this.showDiagnoserOptionWarning = true;
    } else {
      this.showDiagnoserOptionWarning = false;
    }
    this.updateDaasAction(false);

  }

  resetCustomAction() {
    this.customActionType = 'Custom';
    if (this.customAction == null || this.customAction.exe.toLowerCase() === daasConsolePath.toLowerCase()) {
      this.updatedCustomAction.exe = '';
      this.updatedCustomAction.parameters = '';
    } else {
      this.updatedCustomAction.exe = this.customAction.exe;
      this.updatedCustomAction.parameters = this.customAction.parameters;
    }
  }

  updateCustomActionExe(exe: string) {
    this.updatedCustomAction.exe = exe;

  }
  updateCustomActionParams(params: string) {
    this.updatedCustomAction.parameters = params;

  }
  updateCustomAction() {
    this.customActionChanged.emit(this.updatedCustomAction);
  }

  updateDaasAction(emitEvent: boolean) {
    if (this.validationResult.Validated) {
      this.updatedCustomAction.exe = daasConsolePath;
      this.updatedCustomAction.parameters = `-${this.diagnoserOption.option} "${this.diagnoser.Name}"`;
    } else {
      this.updatedCustomAction.exe = '';
      this.updatedCustomAction.parameters = '';
    }

    if (emitEvent) {
      this.customActionChanged.emit(this.updatedCustomAction);
    }

  }

  getDiagnoserNameAndOptionFromParameter(param: string): boolean {
    let invalidSetting = true;
    const paramArray = param.split(' ');
    let diagnoserOption = paramArray[0];
    if (diagnoserOption.startsWith('-')) {
      diagnoserOption = diagnoserOption.substring(1);

      const diagnoserOptionIndex = this.DiagnoserOptions.findIndex(item => item.option === diagnoserOption);
      if (diagnoserOptionIndex > -1) {
        this.diagnoserOption = this.DiagnoserOptions[diagnoserOptionIndex];
        if (this.diagnoserOption.option !== 'CollectKillAnalyze') {
          this.showDiagnoserOptionWarning = true;
        } else {
          this.showDiagnoserOptionWarning = false;
        }

        //
        // Handle cases where the parameters are set with a single quote
        // e.g. -CollectKillAnalyze 'Memory Dump'
        //

        let separatingChar: string = '"';
        if (param.indexOf(separatingChar) === -1 && param.indexOf("'") > -1) {
          separatingChar = "'";
        }

        const firstQuote = param.indexOf(separatingChar);
        const secondQuote = param.indexOf(separatingChar, firstQuote + 1);
        let diagnoserName = '';
        if (secondQuote > firstQuote && secondQuote > 0 && firstQuote > 0) {
          diagnoserName = param.substring(firstQuote + 1, secondQuote);
          const diagnoserIndex = this.Diagnosers.findIndex(item => item.Name === diagnoserName);
          if (diagnoserIndex > -1) {
            this.diagnoser = this.Diagnosers[diagnoserIndex];
            invalidSetting = false;
          }
        }
      }
    }
    return invalidSetting;
  }

  onDaasValidated(event: DaasValidationResult) {
    this.validationResult = event;
    this.isElasticPremium = event.ServerFarmSku != null && event.ServerFarmSku.toLowerCase().startsWith('elastic');
    if (this.isElasticPremium) {
      this.validationResult.Validated = false;
    }

    this.updateDaasAction(false);
  }
}
