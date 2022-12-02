import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { AutoHealCustomAction } from '../../shared/models/autohealing';
import {
  DaasValidationResult,
  linuxCollectionModes,
  linuxDiagnosticTools,
  linuxDumpType,
  linuxToolParams
} from '../../shared/models/daas';
import { SiteInfoMetaData } from '../../shared/models/site';

@Component({
  selector: 'autohealing-custom-action-linux',
  templateUrl: './autohealing-custom-action-linux.component.html',
  styleUrls: [
    './autohealing-custom-action-linux.component.scss',
    '../autohealing-custom-action/autohealing-custom-action.component.scss'
  ]
})
export class AutohealingCustomActionLinuxComponent
  implements OnInit, OnChanges
{
  @Input() siteToBeDiagnosed: SiteInfoMetaData;
  @Input() customAction: AutoHealCustomAction;
  @Output() customActionChanged: EventEmitter<AutoHealCustomAction> =
    new EventEmitter<AutoHealCustomAction>();

  diagnoser: any = null;
  diagnoserOption: any = null;
  showDiagnoserOptionWarning: boolean = true;
  validationResult: DaasValidationResult = new DaasValidationResult();
  updatedCustomAction: AutoHealCustomAction = new AutoHealCustomAction();
  linuxProfileDuration: number = 60;
  linuxDumpType: linuxDumpType = linuxDumpType.Full;
  allowedDumpTypes: string[] = Object.values(linuxDumpType).map((item) =>
    item.toString()
  );
  allowedDurationValues: string[] = ['30', '45', '60', '90', '120'];
  Diagnosers = [
    {
      Name: linuxDiagnosticTools.MemoryDump,
      Description: 'Collects memory dumps of the .NET Core process'
    },
    {
      Name: linuxDiagnosticTools.Profiler,
      Description:
        'Profiles ASP.NET Core application code to identify exceptions and slow performance issues'
    }
  ];

  DiagnoserOptions = [
    {
      option: linuxCollectionModes.CollectLogs,
      Description:
        "With this option, only the above selected tool's data will collected."
    },
    {
      option: linuxCollectionModes.CollectLogsAndKill,
      Description:
        "With this option, the above selected tool's data will collected and the dotnet process will be restarted."
    }
  ];

  constructor() {}

  ngOnInit() {
    this.initComponent();
  }

  ngOnChanges() {
    this.initComponent();
  }

  initComponent() {
    if (this.customAction == null) {
      this.diagnoser = this.Diagnosers[0];
      this.diagnoserOption = this.DiagnoserOptions[0];
      return;
    }

    if (this.customAction.exe != null) {
      if (this.customAction.exe.indexOf(' -mode:') > -1) {
        let customActionArray = this.customAction.exe.split(' -mode:');
        let diagnoserName = customActionArray[0];
        let diagnoserOption = customActionArray[1];

        this.setDiagnoser(diagnoserName);
        const diagnoserOptionIndex = this.DiagnoserOptions.findIndex(
          (item) => item.option === diagnoserOption
        );
        if (diagnoserOptionIndex > -1) {
          this.diagnoserOption = this.DiagnoserOptions[diagnoserOptionIndex];
          this.showDiagnoserOptionWarning =
            this.diagnoserOption.option === linuxCollectionModes.CollectLogs;
        }
      } else {
        if (this.customAction.exe.indexOf(' ') === -1) {
          this.setDiagnoser(this.customAction.exe);
        } else {
          //
          // This condition indicates that value configured currently
          // in autohealing configuration in ARM is invalid. Pass default
          //
          this.setDiagnoser(linuxDiagnosticTools.MemoryDump);
        }
        this.diagnoserOption = this.DiagnoserOptions[0];
      }

      this.setToolParams();
    }
  }

  setToolParams() {
    if (this.customAction.exe != null && this.customAction.parameters != null) {
      if (this.customAction.exe.startsWith(linuxDiagnosticTools.MemoryDump)) {
        this.linuxDumpType = this.getParameterValue(
          this.customAction.parameters,
          linuxToolParams.DumpType,
          this.allowedDumpTypes,
          linuxDumpType.Full
        );
      } else if (
        this.customAction.exe.startsWith(linuxDiagnosticTools.Profiler)
      ) {
        this.linuxProfileDuration = this.getParameterValue(
          this.customAction.parameters,
          linuxToolParams.DurationSeconds,
          this.allowedDurationValues,
          60
        );
      }
    }
  }

  setDiagnoser(diagnoserName: string): void {
    const diagnoserNameIndex = this.Diagnosers.findIndex(
      (item) => item.Name === diagnoserName
    );
    if (diagnoserNameIndex > -1) {
      this.diagnoser = this.Diagnosers[diagnoserNameIndex];
    } else {
      this.diagnoser = this.Diagnosers[0];
    }
  }

  chooseDiagnoser(val: any) {
    if (val != null) {
      this.diagnoser = val;
      this.updateCustomAction(false);
    }
  }

  chooseDiagnoserAction(val: any) {
    this.diagnoserOption = val;
    this.showDiagnoserOptionWarning =
      this.diagnoserOption.option !== linuxCollectionModes.CollectLogsAndKill;
    this.updateCustomAction(false);
  }

  updateCustomAction(emitEvent: boolean) {
    if (this.validationResult.Validated) {
      this.updatedCustomAction.exe = this.diagnoser.Name;
      if (
        this.diagnoserOption != null &&
        this.diagnoserOption.option === linuxCollectionModes.CollectLogsAndKill
      ) {
        this.updatedCustomAction.exe += ` -mode:${linuxCollectionModes.CollectLogsAndKill}`;
      }

      if (this.diagnoser.Name === linuxDiagnosticTools.MemoryDump) {
        this.updatedCustomAction.parameters = this.getToolParams(
          linuxToolParams.DumpType,
          this.linuxDumpType
        );
      } else if (this.diagnoser.Name === linuxDiagnosticTools.Profiler) {
        this.updatedCustomAction.parameters = this.getToolParams(
          linuxToolParams.DurationSeconds,
          this.linuxProfileDuration
        );
      }
    } else {
      this.updatedCustomAction.exe = '';
      this.updatedCustomAction.parameters = '';
    }

    if (emitEvent) {
      this.customActionChanged.emit(this.updatedCustomAction);
    }
  }

  saveCustomAction() {
    this.updateCustomAction(true);
  }

  getToolParams(paramName: string, paramValue: any): string {
    return `${paramName}=${paramValue}`;
  }

  getParameterValue(
    params: string,
    toolParams: linuxToolParams,
    allowedValues: any[],
    defaultValue: any
  ): any {
    let delimiter = toolParams + '=';
    let paramsArray = params.split(delimiter);
    if (
      paramsArray.length > 1 &&
      allowedValues.indexOf(paramsArray[1]) !== -1
    ) {
      return paramsArray[1];
    }
    return defaultValue;
  }

  onDaasValidated(event: DaasValidationResult) {
    this.validationResult = event;
    this.updateCustomAction(false);
  }
}
