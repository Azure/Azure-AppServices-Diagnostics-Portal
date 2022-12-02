import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import {
  MonitoringSession,
  MonitoringLogsPerInstance,
  ActiveMonitoringSession,
  DaasValidationResult
} from '../../../models/daas';
import { interval, Subscription } from 'rxjs';
import { DaasService } from '../../../services/daas.service';

@Component({
  selector: 'cpu-monitoring',
  templateUrl: './cpu-monitoring.component.html',
  styleUrls: ['./cpu-monitoring.component.scss']
})
export class CpuMonitoringComponent implements OnInit, OnDestroy {
  monitoringSessions: MonitoringSession[];
  gettingSessions: boolean = true;
  checkingActiveSessionOnComponentLoad: boolean = true;
  activeMonitoringSession: ActiveMonitoringSession = null;
  monitoringLogs: MonitoringLogsPerInstance[] = [];
  refreshingConfiguration: boolean = false;

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() scmPath: string;

  validationResult: DaasValidationResult = new DaasValidationResult();
  subscription: Subscription;
  inFlightSessionsSubscription: Subscription;
  inFlightActiveSessionSubscription: Subscription;

  configCollapsed: boolean = false;
  monitoringCollapsed: boolean = true;
  sessionsCollapsed: boolean = true;
  blobSasUri: string = '';

  titles: string[] = ['1. Configure', '2. Observe', '3. Analyze'];
  constructor(
    private _siteService: SiteService,
    private _daasService: DaasService
  ) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe((site) => {
      this.siteToBeDiagnosed = site;
      this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(
        (hostname) => hostname.indexOf('.scm.') > 0
      );
    });
  }

  onDaasValidated(validated: DaasValidationResult) {
    this.validationResult = validated;
    this.blobSasUri = this.validationResult.BlobSasUri;
  }

  ngOnInit(): void {
    this.getMonitoringSessions(true);
    this.subscription = interval(30000).subscribe((res) => {
      this.getMonitoringSessions(false);
    });
  }

  getMonitoringSessions(initialLoad: boolean) {
    this.inFlightSessionsSubscription = this._daasService
      .getAllMonitoringSessions(this.siteToBeDiagnosed)
      .subscribe((resp) => {
        if (resp && Array.isArray(resp)) {
          resp = resp.sort(function (a, b) {
            return (
              Number(new Date(b.StartDate)) - Number(new Date(a.StartDate))
            );
          });

          this.inFlightActiveSessionSubscription = this._daasService
            .getActiveMonitoringSessionDetails(this.siteToBeDiagnosed)
            .subscribe((activeMonitoringSession) => {
              this.refreshingConfiguration = false;
              if (initialLoad) {
                this.checkingActiveSessionOnComponentLoad = false;
              }
              this.monitoringSessions = resp;
              this.gettingSessions = false;
              if (activeMonitoringSession && activeMonitoringSession.Session) {
                if (initialLoad) {
                  this.showLogsAndSessions(true);
                }
                this.monitoringSessions.unshift(
                  activeMonitoringSession.Session
                );
                this.activeMonitoringSession = activeMonitoringSession;
              } else {
                this.activeMonitoringSession = null;
              }
            });
        }
      });
  }

  ngOnDestroy() {
    this.stopAllSubscriptions();
  }

  showLogsAndSessions(shouldShow: boolean) {
    if (shouldShow) {
      this.configCollapsed = true;
      this.sessionsCollapsed = false;
      this.monitoringCollapsed = false;
    } else {
      this.configCollapsed = false;
      this.sessionsCollapsed = true;
      this.monitoringCollapsed = true;
    }
  }

  updateMonitoringConfiguration(updated: boolean) {
    this.refreshingConfiguration = true;
    this.showLogsAndSessions(true);
    this.getMonitoringSessions(false);
    this.subscription = interval(30000).subscribe((res) => {
      this.getMonitoringSessions(false);
    });
  }

  savingMonitoringConfiguration(saving: boolean) {
    this.stopAllSubscriptions();
  }

  stopAllSubscriptions() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.inFlightActiveSessionSubscription) {
      this.inFlightActiveSessionSubscription.unsubscribe();
    }
    if (this.inFlightSessionsSubscription) {
      this.inFlightSessionsSubscription.unsubscribe();
    }
  }
}
