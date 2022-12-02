import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { MonitoringSession } from '../../../../models/daas';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { DaasService } from '../../../../services/daas.service';
import { WindowService } from 'projects/app-service-diagnostics/src/app/startup/services/window.service';
import { FormatHelper } from '../../../../utilities/formattingHelper';

@Component({
  selector: 'cpu-monitoring-sessions',
  templateUrl: './cpu-monitoring-sessions.component.html',
  styleUrls: ['./cpu-monitoring-sessions.component.scss']
})
export class CpuMonitoringSessionsComponent implements OnInit, OnChanges {
  @Input() public monitoringSessions: MonitoringSession[];
  @Input() public siteToBeDiagnosed: SiteDaasInfo;
  @Input() public scmPath: string;
  @Input() public gettingSessions: boolean = true;

  description: string =
    'The below table shows you all the CPU monitoring rules for this app. To save disk space, older rules and their associated data is automatically deleted.';

  constructor(
    private _daasService: DaasService,
    private _windowService: WindowService
  ) {}

  ngOnInit() {}

  ngOnChanges() {}

  openReport(relativePath: string, blobSasUri: string) {
    if (blobSasUri && blobSasUri.toLowerCase().startsWith('https')) {
      let blobUrl = new URL(blobSasUri);
      this._windowService.open(
        `https://${blobUrl.host}${blobUrl.pathname}/${relativePath}?${blobUrl.searchParams}`
      );
    } else {
      this._windowService.open(
        `https://${this.scmPath}/api/vfs/${relativePath}`
      );
    }
  }

  getfileNameFromPath(path: string): string {
    let reportNameArray = path.split('/');
    if (reportNameArray.length > 0) {
      let shortName = reportNameArray[reportNameArray.length - 1];

      let friendlyNameArray = shortName.split('_');
      if (friendlyNameArray.length > 2) {
        return (
          friendlyNameArray[0] +
          '_' +
          friendlyNameArray[1] +
          '_' +
          friendlyNameArray[2]
        );
      } else {
        return shortName;
      }
    } else {
      return path;
    }
  }

  analyzeSession(session: MonitoringSession) {
    session.AnalysisSubmitted = true;
    this._daasService
      .analyzeMonitoringSession(this.siteToBeDiagnosed, session.SessionId)
      .subscribe(
        (resp) => {
          if (!resp) {
            session.AnalysisSubmitted = false;
            session.ErrorSubmittingAnalysis =
              'Failed to submit analysis for the rule. Please try again after some time';
          }
        },
        (error) => {
          session.AnalysisSubmitted = false;
          session.ErrorSubmittingAnalysis = JSON.stringify(error);
        }
      );
  }

  formatStartDate(session: MonitoringSession): string {
    var date = new Date(session.StartDate);
    let formattedDate =
      (date.getUTCMonth() + 1).toString().padStart(2, '0') +
      '/' +
      date.getUTCDate().toString().padStart(2, '0') +
      '/' +
      date.getUTCFullYear().toString() +
      ' ' +
      (date.getUTCHours() < 10 ? '0' : '') +
      date.getUTCHours() +
      ':' +
      (date.getUTCMinutes() < 10 ? '0' : '') +
      date.getUTCMinutes() +
      ' UTC';

    const utc = new Date().toUTCString();
    if (this.isSessionActive(session)) {
      formattedDate +=
        '<br/>' +
        FormatHelper.getDurationFromDate(session.StartDate, utc) +
        ' ago';
    }
    return formattedDate;
  }

  isSessionActive(session: MonitoringSession): boolean {
    return session.StartDate > session.EndDate;
  }
}
