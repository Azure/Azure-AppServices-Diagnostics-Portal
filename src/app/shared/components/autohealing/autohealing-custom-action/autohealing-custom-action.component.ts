import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { DaasService } from '../../../services/daas.service';
import { SiteInfoMetaData } from '../../../models/site';
import { AutoHealCustomAction } from '../../../models/autohealing';

@Component({
  selector: 'autohealing-custom-action',
  templateUrl: './autohealing-custom-action.component.html',
  styleUrls: ['./autohealing-custom-action.component.css']
})
export class AutohealingCustomActionComponent implements OnInit, OnChanges {

  constructor(private _serverFarmService: ServerFarmDataService, private _daasService: DaasService) {
  }

  @Input() siteToBeDiagnosed: SiteInfoMetaData;
  @Input() customAction: AutoHealCustomAction;
  @Output() customActionChanged: EventEmitter<AutoHealCustomAction> = new EventEmitter<AutoHealCustomAction>();

  checkingSupportedTier: boolean = true;
  supportedTier: boolean = true;

  diagnoser: any;
  diagnoserOption: any = [{ option: "", Description: "" }];

  Diagnosers = [{ Name: "Memory Dump", Description: "Collects memory dumps of the process and the child process'es hosting your App and analyzes them for errors" },
  { Name: "CLR Profiler", Description: "Profiles ASP.NET application code to identify exceptions and performance issues" },
  { Name: "CLR Profiler With ThreadStacks", Description: "Profiles ASP.NET application code to identify exceptions and performance issues and dumps stacks to identify deadlocks" },
  { Name: "JAVA Memory Dump", Description: "Collects a binary memory dump using jMap of all java.exe processes running for this WebApp" },
  { Name: "JAVA Thread Dump", Description: "Collects jStack output of all java.exe processes running for this App and analyzes the same" }];
  DiagnoserOptions = [
    { option: "CollectKillAnalyze", Description: "With this option, the above selected tool's data will collected, analyzed and the process will be recycled." },
    { option: "CollectLogs", Description: "With this option, only the above selected tool's data will collected. No analysis will be performed and process will not be restarted." },
    { option: "Troubleshoot", Description: "With this option, the above selected tool's data will collected and then analyzed. This will not cause the process to restart. " }
  ];
  customActionType: string = 'Diagnostics';
  customActionParams: string = '';
  customActionExe: string = '';

  ngOnChanges() {
    this.initComponent();
  }

  ngOnInit() {
    this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
      if (serverFarm) {
        this.checkingSupportedTier = false;
        if (serverFarm.sku.tier === "Standard" || serverFarm.sku.tier === "Basic" || serverFarm.sku.tier.indexOf("Premium") > -1 || serverFarm.sku.tier === "Isolated") {
          this.supportedTier = true;
          this.initComponent();
        }
      }
    });
    
  }

  initComponent() {
    if (this.customAction == null) {
      return;
    }
    let diagnosticsConfiguredCorrectly = this.isDiagnosticsConfigured();
    if (!diagnosticsConfiguredCorrectly) {
      this.diagnoser = this.Diagnosers[0];
      this.diagnoserOption = this.DiagnoserOptions[2];
      this.updateDaasAction();
    }
  }

  isDiagnosticsConfigured(): boolean {
    let invalidSetting = false;
    if (this.customAction != null) {
      if (this.customAction.exe.toLowerCase() === 'd:\\home\\data\\daas\\bin\\daasconsole.exe') {
        this.customActionType = 'Diagnostics';
        if (this.customAction.parameters !== '') {
          invalidSetting = this.getDiagnoserNameAndOptionFromParameter(this.customAction.parameters);
        }
        if (invalidSetting) {
          this.diagnoser = this.Diagnosers[0];
          this.diagnoserOption = this.DiagnoserOptions[2];
          this.updateDaasAction();
        }

      }
      else {
        this.customActionType = 'Custom';
        this.customActionExe = this.customAction.exe;
        this.customActionParams = this.customAction.parameters;
        this.updateCustomAction();
      }
      return true;
    }
    else {
      return false;
    }
  }

  chooseDiagnoser(val) {
    this.diagnoser = val;
    this.updateDaasAction();
  }

  chooseDiagnoserAction(val) {
    this.diagnoserOption = val;
    this.updateDaasAction();
  }

  updateCustomActionExe(exe:string){
    this.customActionExe = exe;
    this.updateCustomAction();
  }
  updateCustomActionParams(params:string){
    this.customActionParams = params;
    this.updateCustomAction();
  }
  updateCustomAction() {
    let autoHealCustomAction = new AutoHealCustomAction();
    autoHealCustomAction.exe = this.customActionExe
    autoHealCustomAction.parameters = this.customActionParams;
    this.customActionChanged.emit(autoHealCustomAction);
  }

  updateDaasAction() {
    let autoHealDaasAction = new AutoHealCustomAction();
    autoHealDaasAction.exe = 'D:\\home\\data\\DaaS\\bin\\DaasConsole.exe';
    autoHealDaasAction.parameters = `-${this.diagnoserOption.option} "${this.diagnoser.Name}"  60`;
    this.customActionChanged.emit(autoHealDaasAction);
  }


  getDiagnoserNameAndOptionFromParameter(param: string): boolean {
    let invalidSetting = true;
    let paramArray = param.split(' ');
    let diagnoserOption = paramArray[0];
    if (diagnoserOption.startsWith('-')) {
      diagnoserOption = diagnoserOption.substring(1);

      let diagnoserOptionIndex = this.DiagnoserOptions.findIndex(item => item.option === diagnoserOption)
      if (diagnoserOptionIndex > -1) {
        this.diagnoserOption = this.DiagnoserOptions[diagnoserOptionIndex];
        let firstQuote = param.indexOf('"');
        let secondQuote = param.indexOf('"', firstQuote + 1);
        let diagnoserName = '';
        if (secondQuote > firstQuote && secondQuote > 0 && firstQuote > 0) {
          diagnoserName = param.substring(firstQuote + 1, secondQuote);
          let diagnoserIndex = this.Diagnosers.findIndex(item => item.Name === diagnoserName)
          if (diagnoserIndex > -1) {
            this.diagnoser = this.Diagnosers[diagnoserIndex];
            invalidSetting = false;
          }
        }
      }
    }
    return invalidSetting;
  }
}
