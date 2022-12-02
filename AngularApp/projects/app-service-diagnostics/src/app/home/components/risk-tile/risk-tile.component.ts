import { Component, Input, OnInit } from '@angular/core';
import {
  HealthStatus,
  LoadingStatus,
  StatusStyles,
  TelemetryEventNames,
  TelemetryService
} from 'diagnostic-data';
import { RiskAlertService } from '../../../shared-v2/services/risk-alert.service';
import { RiskAlertConfig } from '../../../shared/models/arm/armResourceConfig';
import { RiskTile, RiskInfo } from '../../models/risk';
import { Globals } from '../../../globals';

@Component({
  selector: 'risk-tile',
  templateUrl: './risk-tile.component.html',
  styleUrls: ['./risk-tile.component.scss']
})
export class RiskTileComponent implements OnInit {
  StatusStyles = StatusStyles;
  LoadingStatus = LoadingStatus;
  title: string = '';
  linkText: string = '';
  infoList: RiskInfoDisplay[] = [];
  loading = LoadingStatus.Loading;
  showTile: boolean = true;
  riskProperties = { TileLoaded: LoadingStatus[LoadingStatus.Loading] };
  get loadingAriaLabel() {
    return `loading ${this.title}`;
  }

  @Input() riskAlertConfig: RiskAlertConfig;
  riskTile: RiskTile;
  constructor(
    private telemetryService: TelemetryService,
    private _riskAlertService: RiskAlertService,
    public globals: Globals
  ) {}

  ngOnInit() {
    this.title = this.riskAlertConfig.title;
    this._riskAlertService.riskPanelContentsSub.subscribe(
      (riskAlertContents) => {
        this.riskTile =
          this._riskAlertService.riskAlertNotifications[
            this.riskAlertConfig.riskAlertDetectorId
          ];
        this.riskProperties['Title'] = this.title;
        this.linkText = this.riskTile.linkText;

        if (
          this.riskTile.riskInfo != null &&
          Object.keys(this.riskTile.riskInfo).length > 0
        ) {
          this.infoList = this.processRiskInfo(this.riskTile.riskInfo);
        } else {
          this.infoList = [
            {
              message: 'No data available',
              status: HealthStatus.Info
            }
          ];
        }

        this._riskAlertService.isRiskTileRefreshing.subscribe(
          (isRefreshing) => {
            this.loading = isRefreshing
              ? LoadingStatus.Loading
              : this.riskTile.loadingStatus;
          }
        );

        this.riskProperties['TileLoaded'] = LoadingStatus[this.loading];
        this.riskProperties['InfoList'] = JSON.stringify(this.infoList);
      }
    );
  }

  ngAfterViewInit() {
    this.logEvent(TelemetryEventNames.RiskTileLoaded, {});
  }

  clickTileHandler() {
    this.logEvent(TelemetryEventNames.RiskTileClicked, {});
    this.globals.openRiskAlertsPanel = true;
    this._riskAlertService.currentRiskPanelContentIdSub.next(
      this.riskAlertConfig.riskAlertDetectorId
    );
  }

  private processRiskInfo(info: RiskInfo): RiskInfoDisplay[] {
    const statuses = Object.values(info);
    const map = new Map<HealthStatus, number>();

    for (const status of statuses) {
      const count = map.has(status) ? map.get(status) : 0;
      map.set(status, count + 1);
    }

    this.copyStatusToRiskProps(map);

    //sort from most critical to less critical
    const sortedStatus = Array.from(map.keys());
    sortedStatus.sort((s1, s2) => s1 - s2);

    //get 2 most critical ones
    const res: RiskInfoDisplay[] = [];
    if (sortedStatus.length >= 1) {
      res.push(new RiskInfoDisplay(sortedStatus[0], map.get(sortedStatus[0])));
    }

    if (sortedStatus.length >= 2) {
      res.push(new RiskInfoDisplay(sortedStatus[1], map.get(sortedStatus[1])));
    }

    return res;
  }

  private logEvent(
    eventMessage: string,
    eventProperties?: any,
    measurements?: any
  ) {
    for (const id of Object.keys(this.riskProperties)) {
      if (this.riskProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.riskProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  private copyStatusToRiskProps(map: Map<HealthStatus, number>) {
    const keys = Array.from(map.keys());
    for (let status of keys) {
      this.riskProperties[HealthStatus[status]] = map.get(status);
    }
  }
}

class RiskInfoDisplay {
  message: string;
  status: HealthStatus;

  constructor(status: HealthStatus, count: number) {
    this.status = status;
    this.message = `${count} ${HealthStatus[status]}`;
  }
}
