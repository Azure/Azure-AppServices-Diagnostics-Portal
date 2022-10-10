import { Component, OnInit, Input, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter } from '@angular/core';
import { DiagnosticService, RenderingType, DataTableResponseObject, TelemetryEventNames, DiagnosticData } from 'diagnostic-data';
import { DaasService } from '../../../../services/daas.service';
import { SiteService } from '../../../../services/site.service';
import * as momentNs from 'moment';
import { CrashMonitoringSettings, DaasStorageConfiguration } from '../../../../models/daas';
import * as moment from 'moment';
import { Subscription, interval, Observable } from 'rxjs';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { Globals } from '../../../../../globals'
import { TelemetryService } from 'diagnostic-data';
import { DirectionalHint } from 'office-ui-fabric-react';
import { ITooltipOptions } from '@angular-react/fabric/lib/components/tooltip';

const crashMonitoringDetectorName: string = "crashmonitoring";

@Component({
  selector: 'crash-monitoring-analysis',
  templateUrl: './crash-monitoring-analysis.component.html',
  styleUrls: ['./crash-monitoring-analysis.component.scss']
})
export class CrashMonitoringAnalysisComponent implements OnInit, OnChanges, OnDestroy {

  @Input() crashMonitoringSettings: CrashMonitoringSettings;
  @Output() settingsChanged: EventEmitter<CrashMonitoringSettings> = new EventEmitter<CrashMonitoringSettings>();

  loading: boolean = true;
  blobSasUri: string = "";
  insights: CrashInsight[];
  monitoringEnabled: boolean = false;
  error: any;
  errorMessage: string;
  subscription: Subscription;
  readonly stringFormat: string = 'YYYY-MM-DD HH:mm';
  collapse = [{ title: 'Analyze', collapsed: true },
  { title: 'View History', collapsed: true }];
  dumpsCollected: number = 0;
  siteToBeDiagnosed: SiteDaasInfo = null;
  savingSettings: boolean = false;
  crashMonitoringHistory: CrashMonitoringData[] = [];
  refreshingHistory: boolean = true;
  blobSasUriObservable: Observable<DaasStorageConfiguration>;

  // For tooltip display
  directionalHint = DirectionalHint.rightTopEdge;
  toolTipStyles = { 'backgroundColor': 'black', 'color': 'white', 'border': '0px' };

  toolTipOptionsValue: ITooltipOptions = {
    calloutProps: {
      styles: {
        beak: this.toolTipStyles,
        beakCurtain: this.toolTipStyles,
        calloutMain: this.toolTipStyles
      }
    },
    styles: {
      content: this.toolTipStyles,
      root: this.toolTipStyles,
      subText: this.toolTipStyles
    }
  }

  constructor(public globals: Globals, private telemetryService: TelemetryService,
    private _diagnosticService: DiagnosticService, private _daasService: DaasService,
    private _siteService: SiteService) { }

  ngOnInit() {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.blobSasUriObservable = this._daasService.getStorageConfiguration(site, false);

      if (!this.blobSasUri) {

        this.blobSasUriObservable.subscribe(daasSasUri => {
          this.blobSasUri = daasSasUri.SasUri;
        });
      }
    });
    this.refreshHistory();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.init();
  }

  initGlobals() {
    this.loading = true;
    this.error = null;
    this.errorMessage = "";
    this.insights = [];
    this.monitoringEnabled = false;
    this.dumpsCollected = 0;
  }

  refreshData() {
    this.updateMonitoringStatus();
    if (this.crashMonitoringSettings != null) {

      let _startTime = moment.utc().subtract(1, 'days');
      let _endTime = moment.utc().subtract(16, 'minutes');

      this._diagnosticService.getDetector(crashMonitoringDetectorName, _startTime.format(this.stringFormat), _endTime.format(this.stringFormat), true, false, null, null).subscribe(detectorResponse => {
        let rawTable = detectorResponse.dataset.find(x => x.renderingProperties.type === RenderingType.Table) // && x.table.tableName === "CrashMonitoring");
        if (this.blobSasUri) {
          this.loadDetectorData(rawTable);
        } else {

          if (!this.blobSasUri) {
            this.blobSasUriObservable.subscribe(daasSasUri => {
                this.blobSasUri = daasSasUri.SasUri;
                this.loadDetectorData(rawTable);
            });
          }
        }
      });
    }
  }

  loadDetectorData(rawTable: DiagnosticData) {
    this.loading = false;
    if (rawTable != null && rawTable.table != null && rawTable.table.rows != null && rawTable.table.rows.length > 0) {
      let crashMonitoringDatas = this.parseData(rawTable.table);
      this.dumpsCollected = crashMonitoringDatas.length;
      this.populateInsights(crashMonitoringDatas);
      if (this.dumpsCollected === this.crashMonitoringSettings.MaxDumpCount) {
        this.monitoringEnabled = false;
      }
    }
  }

  refreshHistory() {
    this.refreshingHistory = true;
    let _startTime = moment.utc().subtract(1, 'days');
    let _endTime = moment.utc().subtract(16, 'minutes');

    this._diagnosticService.getDetector(crashMonitoringDetectorName, _startTime.format(this.stringFormat), _endTime.format(this.stringFormat), true, false, null, null).subscribe(detectorResponse => {
      let rawTable = detectorResponse.dataset.find(x => x.renderingProperties.type === RenderingType.Table) // && x.table.tableName === "CrashMonitoring");
      this.refreshingHistory = false;
      if (rawTable != null && rawTable.table != null && rawTable.table.rows != null && rawTable.table.rows.length > 0) {
        this.crashMonitoringHistory = this.parseData(rawTable.table, true);
      }
    });
  }

  updateMonitoringStatus() {
    if (this.crashMonitoringSettings == null) {
      this.monitoringEnabled = false;
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      return;
    }
    let monitoringDates = this._siteService.getCrashMonitoringDates(this.crashMonitoringSettings);
    if (momentNs.utc() > momentNs.utc(monitoringDates.start)
      && momentNs.utc() < momentNs.utc(monitoringDates.end) && this.dumpsCollected < this.crashMonitoringSettings.MaxDumpCount) {
      this.monitoringEnabled = true;
    } else {
      this.monitoringEnabled = false
    }
  }

  init() {
    this.initGlobals()
    this.collapse[1].collapsed = true;
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      if (this.crashMonitoringSettings != null) {
        this.collapse[0].collapsed = false;
        this.refreshData();
        if (this.monitoringEnabled) {
          this.subscription = interval(45 * 1000).subscribe(res => {
            this.refreshData();
          });
        }
      } else {
        this.collapse[0].collapsed = true;
        this.loading = false;
      }
    });
  }

  populateInsights(crashMonitoringDatas: CrashMonitoringData[]) {
    let unique = Array.from(new Set(crashMonitoringDatas.map(item => item.exitCode)));
    unique.forEach(exitCode => {
      let insight = new CrashInsight();
      insight.data = crashMonitoringDatas.filter(x => x.exitCode == exitCode);

      // sort the array based on timestamp
      insight.data.sort((a, b) => a.timeStamp > b.timeStamp ? -1 : a.timeStamp < b.timeStamp ? 1 : 0);
      insight.exitCode = exitCode;

      const idx = this.insights.findIndex(x => x.exitCode === exitCode);
      if (idx === -1) {
        this.insights.push(insight);
        this.setInsightTitle(insight);
      } else {
        this.mergeArrays(this.insights[idx].data, insight.data);
        this.setInsightTitle(this.insights[idx]);
      }
    });
  }

  setInsightTitle(insight: CrashInsight) {
    if (insight.data.length > 1) {
      insight.title = insight.data.length + " crashes";
    } else {
      insight.title = "One crash"
    }
    insight.title += " due to exit code 0x" + insight.exitCode;
  }

  parseData(dataTable: DataTableResponseObject, ignoreCurrentSession: boolean = false): CrashMonitoringData[] {
    let cIdxTimeStamp: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.timeStamp);
    let cIdxExitCode: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.exitCode);
    let cIdxCallStack: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.callStack);
    let cIdxManagedException: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.managedException);
    let cIdxDumpFileName: number = dataTable.columns.findIndex(c => c.columnName === tblIndex.dumpFileName);

    let monitoringDates: any = null;
    let crashMonitoringDatas: CrashMonitoringData[] = [];
    if (this.crashMonitoringSettings != null) {
      monitoringDates = this._siteService.getCrashMonitoringDates(this.crashMonitoringSettings);
    }

    dataTable.rows.forEach(row => {
      let rowDate: Date = moment.utc(row[cIdxTimeStamp]).toDate();
      if ((monitoringDates != null && rowDate > monitoringDates.start && rowDate < monitoringDates.end) ||
        ignoreCurrentSession) {
        let crashMonitoringData = new CrashMonitoringData();
        crashMonitoringData.timeStamp = row[cIdxTimeStamp];
        crashMonitoringData.exitCode = row[cIdxExitCode];
        crashMonitoringData.callStack = row[cIdxCallStack];
        crashMonitoringData.managedException = row[cIdxManagedException];
        crashMonitoringData.dumpFileName = row[cIdxDumpFileName];
        crashMonitoringData.dumpHref = this.getLinkToDumpFile(crashMonitoringData.dumpFileName);
        crashMonitoringDatas.push(crashMonitoringData);
      }
    });
    return crashMonitoringDatas;
  }

  getDisplayDate(date: Date): string {
    return momentNs(date).format('YYYY-MM-DD HH:mm') + ' UTC';
  }

  toggleInsightStatus(insight: CrashInsight) {
    insight.isExpanded = !insight.isExpanded;
  }

  getLinkToDumpFile(dumpFileName: string): string {
    if (this.blobSasUri !== "") {
      let blobUrl = new URL(this.blobSasUri);
      let relativePath = "CrashDumps/" + dumpFileName;
      return `https://${blobUrl.host}${blobUrl.pathname}/${relativePath}?${blobUrl.searchParams}`;
    } else {
      return "";
    }
  }

  stopMonitoring(viaAgent: boolean) {
    this.errorMessage = "";
    this.error = null;
    this.savingSettings = true;
    this._siteService.saveCrashMonitoringSettings(this.siteToBeDiagnosed, null).subscribe(resp => {
      this.logCrashMonitoringStopped(viaAgent);
      this.savingSettings = false;
      this.crashMonitoringSettings = null;
      this.settingsChanged.emit(this.crashMonitoringSettings);
      this.collapse.forEach(item => item.collapsed = true);
    },
      error => {
        this.savingSettings = false;
        this.errorMessage = "Failed while stopping crash monitoring for the current app. ";
        this.error = error;
      });
  }

  logCrashMonitoringStopped(viaAgent: boolean) {
    if (!viaAgent) {
      this.telemetryService.logEvent(TelemetryEventNames.CrashMonitoringStopped);
    } else {
      this.telemetryService.logEvent(TelemetryEventNames.CrashMonitoringAgentDisabled);
    }
  }

  viewCallStack(data: CrashMonitoringData) {
    this.globals.callStackDetails.managedException = data.managedException;
    this.globals.callStackDetails.callStack = data.callStack.trim();
    this.globals.openCallStackPanel = !this.globals.openCallStackPanel;
    this.telemetryService.logEvent("OpenCallStackPanel");
    this.telemetryService.logPageView("CallStackPanelView");
  }

  getErrorDetails(): string {
    return JSON.stringify(this.error);
  }

  mergeArrays(target: CrashMonitoringData[], source: CrashMonitoringData[]) {
    for (let index = 0; index < source.length; index++) {
      const sourceElement = source[index];
      let existingIdx = target.findIndex(x => x.dumpFileName === sourceElement.dumpFileName);
      if (existingIdx === -1) {
        // insert at the start of the array as the array is already sorted
        target.splice(0, 0, sourceElement);
      } else {
        if (sourceElement.callStack != target[existingIdx].callStack
          || sourceElement.managedException != target[existingIdx].managedException)
          Object.assign(target[existingIdx], sourceElement);
      }
    }
  }
}

enum tblIndex {
  timeStamp = "TIMESTAMP",
  exitCode = "ExitCode",
  callStack = "StackTrace",
  managedException = "ManagedException",
  dumpFileName = "DumpFile",
}

export class CrashMonitoringData {
  timeStamp: Date;
  exitCode: string;
  callStack: string;
  managedException: string = "";
  dumpFileName: string;
  dumpHref: string
}

export class CrashInsight {
  isExpanded: boolean = false;
  title: string;
  data: CrashMonitoringData[];
  exitCode: string;
}