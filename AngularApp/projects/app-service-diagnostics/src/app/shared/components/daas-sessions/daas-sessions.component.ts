import { Component, Input, OnInit, SimpleChanges, OnChanges, Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { SessionStatus, Session, LogFile, DiagnosisStatus, CpuMonitoringMode, SessionMaster, SessionFile, SessionMode } from '../../models/daas';
import { WindowService } from '../../../startup/services/window.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { DaasService } from '../../services/daas.service';
import { SiteDaasInfo } from '../../models/solution-metadata';
import { Subscription, Observable, interval, of } from 'rxjs';
import { catchError, map, retry, mergeMap } from 'rxjs/operators';
import { FormatHelper } from '../../utilities/formattingHelper';
import { ActivatedRoute } from '@angular/router';
import { Globals } from '../../../globals';
import { TelemetryService } from 'diagnostic-data';
import { ITooltipOptions } from '@angular-react/fabric';
import { DirectionalHint } from 'office-ui-fabric-react';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../models/site';

@Component({
  selector: 'daas-sessions',
  templateUrl: 'daas-sessions.component.html',
  styleUrls: ['daas-sessions.component.scss']
})

export class DaasSessionsComponent implements OnChanges, OnDestroy {

  checkingExistingSessions: boolean;
  sessions: SessionMaster[] = [];

  @Input() public diagnoserNameLookup: string = '';
  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Input() public scmPath: string;
  @Input() public showDetailsLink: boolean = true;

  DiagnoserHeading: string;
  supportedTier: boolean = false;
  enableSessionsPanel: boolean = false;

  @Input() refreshSessions: boolean = false;
  showDetailedView: boolean = false;
  allSessions: string = '../../diagnosticTools';
  subscription: Subscription;
  initializedOnce: boolean = false;

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

  isWindowsApp: boolean = true;

  constructor(private _windowService: WindowService, private _serverFarmService: ServerFarmDataService,
    private _daasService: DaasService, protected _route: ActivatedRoute, public globals: Globals,
    public telemetryService: TelemetryService, private _webSiteService: WebSitesService) {
    this._serverFarmService.siteServerFarm.subscribe(serverFarm => {
      if (serverFarm) {
        if (serverFarm.sku.tier === 'Standard' || serverFarm.sku.tier === 'Basic' || serverFarm.sku.tier.indexOf('Isolated') > -1 || serverFarm.sku.tier.indexOf('Premium') > -1) {
          this.supportedTier = true;
        }
      }
    }, error => {
      //TODO: handle error
    });
    this.enableSessionsPanel = this._route.snapshot.params['category'] != null || this._route.parent.snapshot.params['category'] != null;
    this.isWindowsApp = this._webSiteService.platform === OperatingSystem.windows;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refreshSessions']) {
      this.checkSessions();
    }
  }

  ngOnInit(): void {
    if (this.diagnoserNameLookup === '') {
      this.showDetailedView = true;
    }
    this.initHeading();
    if (this.showDetailedView) {
      this.checkSessions();
      this.subscription = interval(60000).subscribe(res => {
        this.checkSessions();
      });

    }
  }

  initHeading() {
    if (this.diagnoserNameLookup.indexOf('Profiler') > -1) {
      this.DiagnoserHeading = 'profiling sessions';
    } else if (this.diagnoserNameLookup.indexOf('Memory Dump') > -1 || this.diagnoserNameLookup.indexOf('MemoryDump') > -1) {
      this.DiagnoserHeading = 'dumps collected';
    } else {
      this.DiagnoserHeading = 'diagnostic sessions';
    }
  }

  reducedSession(obj: SessionMaster) {
    return { sessionId: obj.sessionId, tool: obj.tool, status: obj.status, collectorStatus: obj.collectorStatus, analyzerStatus: obj.analyzerStatus };
  }

  getDaasSessionsV2(): Observable<Session[]> {
    return this._daasService.getSessions(this.siteToBeDiagnosed, false).pipe(retry(2))
  }

  getLinuxDiagnosticServerSessions(): Observable<Session[]> {
    let emptyArray: Session[] = [];
    if (this.isWindowsApp) {
      return of(emptyArray);
    }

    return this._daasService.isDiagServerEnabledForLinux(this.siteToBeDiagnosed).pipe(
      map((isEnabled) => {
        return isEnabled;
      }),
      mergeMap((isEnabled) => {
        if (!isEnabled) {
          return of(isEnabled);
        } else {
          return this._daasService.isStorageAccountConfiguredForDiagServer(this.siteToBeDiagnosed);
        }
      }),
      mergeMap(isEnabled => {
        if (!isEnabled) {
          return of(emptyArray);
        } else {
          return this._daasService.getSessions(this.siteToBeDiagnosed, true).pipe(retry(2));
        }
      }));
  }


  checkSessions() {
    if (!this.initializedOnce) {
      this.initializedOnce = true;
      this.checkingExistingSessions = true;
    }

    Observable.combineLatest(
      this.getDaasSessionsV2().pipe(catchError(err => {
        return of(err);
      })),
      this.getLinuxDiagnosticServerSessions().pipe(catchError(err => {
        return of(err);
      })))
      .subscribe(results => {
        let sessions: SessionMaster[] = [];

        if (this.isArrayWithItems(results[0])) {
          let sessionsV2: Session[] = results[0];
          sessionsV2.forEach(session => {
            sessions.push(this.getSessionMasterFromV2(session));
          });
        }

        if (this.isArrayWithItems(results[1])) {
          let sessionsV2: Session[] = results[1];
          sessionsV2.forEach(session => {
            sessions.push(this.getSessionMasterFromV2(session, true));
          });
        }

        this.mergeSessions(sessions);
        this.sessions = this.sessions
          .sort((a, b) => { return new Date(a.startDate) < new Date(b.startDate) ? 1 : -1; });

        if (!this.showDetailedView) {
          this.sessions = this.takeTopFiveDiagnoserSessions(sessions);
        }

        if (this.checkingExistingSessions) {
          this.checkingExistingSessions = false;
        }
      })
  }

  isArrayWithItems(obj: any): boolean {
    if (obj && Array.isArray(obj) && obj.length > 0) {
      return true;
    }
    return false;
  }

  getSessionMasterFromV2(session: Session, isDiagServerSession: boolean = false): SessionMaster {
    let sessionMaster: SessionMaster = new SessionMaster();
    sessionMaster.isV2 = true;
    sessionMaster.isDiagServerSession = isDiagServerSession;
    sessionMaster.sessionId = session.SessionId;
    sessionMaster.tool = session.Tool;
    sessionMaster.toolParams = session.ToolParams;
    sessionMaster.startDate = session.StartTime;
    sessionMaster.mode = session.Mode;
    sessionMaster.instances = session.Instances;
    sessionMaster.blobStorageHostName = session.BlobStorageHostName;

    if (sessionMaster.mode === SessionMode.CollectAndAnalyze) {
      sessionMaster.analyzerStatus = DiagnosisStatus.WaitingForInputs;
    } else {
      sessionMaster.analyzerStatus = DiagnosisStatus.NotRequested;
    }

    if (session.Status === "Active") {
      sessionMaster.status = SessionStatus.Active;
    } else if (session.Status === "Completed") {
      sessionMaster.status = SessionStatus.Complete;
    }

    let logFiles: LogFile[] = [];
    let collectedInstances: string[] = [];
    if (this.isArrayWithItems(session.ActiveInstances)) {
      session.ActiveInstances.forEach(activeInstance => {

        if (activeInstance.Status === "Analyzing") {
          sessionMaster.analyzerStatus = DiagnosisStatus.InProgress;
        }

        if (activeInstance.Status != "Started") {
          collectedInstances.push(activeInstance.Name);
        }

        if (this.isArrayWithItems(activeInstance.Logs)) {
          logFiles = logFiles.concat(activeInstance.Logs);
        }

        if (this.isArrayWithItems(activeInstance.CollectorErrors)) {
          sessionMaster.collectorErrors = sessionMaster.collectorErrors.concat(activeInstance.CollectorErrors);
          sessionMaster.status = SessionStatus.Error;
        }
        if (this.isArrayWithItems(activeInstance.AnalyzerErrors)) {
          sessionMaster.analyzerErrors = sessionMaster.analyzerErrors.concat(activeInstance.AnalyzerErrors);
          sessionMaster.status = SessionStatus.Error;
        }
      });
    }

    if (this.isEqualArray(sessionMaster.instances, collectedInstances)) {
      sessionMaster.collectorStatus = DiagnosisStatus.Complete;
    } else {
      sessionMaster.collectorStatus = DiagnosisStatus.InProgress;
    }

    let size = 0;
    logFiles.forEach(logFile => {
      let file: SessionFile = new SessionFile();
      file.name = logFile.Name;
      file.relativePath = logFile.RelativePath;
      sessionMaster.logs.push(file);
      if (logFile.Size > 0) {
        size += logFile.Size;
      }

      if (this.isArrayWithItems(logFile.Reports)) {

        logFile.Reports.forEach(report => {
          let file: SessionFile = new SessionFile();
          file.name = report.Name;
          file.relativePath = report.RelativePath;
          sessionMaster.reports.push(file);
        });
      }
    });

    sessionMaster.size = size;
    return sessionMaster;
  }

  isEqualArray(array1: string[], array2: string[]) {
    array1.sort();
    array2.sort();
    for (var i = 0; i < array1.length; i++) {
      if (array1[i] !== array2[i]) return false;
    }
    return true;
  }

  mergeSessions(sessions: SessionMaster[]) {
    if (sessions != null && Array.isArray(sessions)) {
      const newSessions = sessions.map(this.reducedSession);
      const existingSessions = this.sessions.map(this.reducedSession);
      let anySessionUpdated = newSessions.filter(newSession => existingSessions.findIndex(session => JSON.stringify(session) === JSON.stringify(newSession)) === -1).length > 0;
      if (newSessions.length !== existingSessions.length || anySessionUpdated) {
        this.sessions = this.setExpanded(sessions);
      }
    }
  }

  takeTopFiveDiagnoserSessions(sessions: SessionMaster[]): SessionMaster[] {
    let arrayToReturn = new Array<SessionMaster>();
    sessions.forEach(session => {
      if (this.isMatchingDiagnoser(session)) {
        arrayToReturn.push(session);
      }
    });

    if (arrayToReturn.length > 5) {
      arrayToReturn = arrayToReturn.slice(0, 5);
    }
    return arrayToReturn;
  }

  isMatchingDiagnoser(session: SessionMaster): boolean {
    if (this.diagnoserNameLookup.indexOf("MemoryDump") > -1 || this.diagnoserNameLookup.indexOf("Memory Dump") > -1) {
      if (session.tool.indexOf("MemoryDump") > -1 || session.tool.indexOf("Memory Dump") > -1) {
        return true;
      }
    } else {
      return session.tool.indexOf(this.diagnoserNameLookup) > -1
    }
    return false;
  }

  getInstanceNameFromReport(reportName: string, toolName: string): string {
    if (toolName.indexOf('Profiler') > -1
      || toolName.indexOf('MemoryDump') > -1
      || toolName.indexOf('Memory Dump') > -1) {
      const reportNameArray = reportName.split('_');
      if (reportNameArray.length > 0) {
        return reportNameArray[0];
      }
    }

    return reportName;
  }

  toggleExpanded(i: number): void {
    this.sessions[i].expanded = !this.sessions[i].expanded;
  }

  hasErrors(session: SessionMaster): boolean {
    return session.status == SessionStatus.Error;
  }

  hasDifferentBlobStorage(log: SessionFile, session: SessionMaster): boolean {
    return session.blobStorageHostName && log.relativePath && log.relativePath.toLowerCase().indexOf('https://' + session.blobStorageHostName.toLowerCase()) === -1;
  }

  isCollectingData(session: SessionMaster): boolean {
    return session.collectorStatus === DiagnosisStatus.InProgress;
  }

  isAnalysisRequested(session: SessionMaster) {
    return session.mode === SessionMode.CollectAndAnalyze;
  }

  setExpanded(sessions: SessionMaster[]): SessionMaster[] {
    const maxValue = (sessions.length > 3 ? 3 : sessions.length);
    let counter = 0;
    while (counter < maxValue) {
      sessions[counter].expanded = true;
      counter++;
    }
    return sessions;
  }

  deleteSession(sessionIndex: number) {
    if (sessionIndex > -1) {
      const sessionToDelete = this.sessions[sessionIndex];
      sessionToDelete.expanded = true;
      sessionToDelete.deletingFailure = '';
      sessionToDelete.deleting = true;
      this.deleteDiagnosticSession(sessionToDelete, sessionIndex);
    }
  }

  deleteDiagnosticSession(sessionToDelete: SessionMaster, sessionIndex: number) {
    this._daasService.deleteDaasSession(this.siteToBeDiagnosed, sessionToDelete.sessionId, sessionToDelete.isDiagServerSession)
      .subscribe(resp => {
        sessionToDelete.deleting = false;
        this.sessions.splice(sessionIndex, 1);
      }, err => {
        sessionToDelete.deleting = false;
        sessionToDelete.deletingFailure = 'Failed while deleting the session with an error : ' + err;
      });
  }

  isSessionInProgress(session: SessionMaster): boolean {
    return session.status === SessionStatus.Active;
  }

  getAnalyzerStatus(session: SessionMaster): string {
    if (session.analyzerStatus === DiagnosisStatus.InProgress) {
      return "In Progress...";
    } else if (session.analyzerStatus === DiagnosisStatus.WaitingForInputs) {
      return "Waiting...";
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  convertUtcIfNeeded(dateString: string): string {
    return dateString.toUpperCase().endsWith('Z') ? dateString : dateString += 'Z';;
  }

  toggleSessionPanel() {
    this.globals.openSessionPanel = !this.globals.openSessionPanel;
    this.telemetryService.logEvent("OpenSesssionsPanel");
    this.telemetryService.logPageView("SessionsPanelView");
  }

  openUrl(url: string) {
    this._windowService.open(url);
  }

  getSessionSize(session: SessionMaster) {
    return " (" + FormatHelper.formatBytes(session.size, 2) + ")";
  }
}

@Pipe({ name: 'datetimediff' })
export class DateTimeDiffPipe implements PipeTransform {
  transform(datetime: string): string {
    let utc = new Date().toUTCString();
    return FormatHelper.getDurationFromDate(datetime, utc);
  }
}
