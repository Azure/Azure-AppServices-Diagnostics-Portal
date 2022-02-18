import { Component, OnInit, Input } from '@angular/core';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';
import { ActivatedRoute, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DiagnosticService } from 'diagnostic-data';
import * as momentNs from 'moment';
import { IButtonStyles } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs-compat';

const moment = momentNs;

export enum StatisticsType {
  Monitoring,
  Analytics
}

@Component({
  selector: 'tab-monitoring',
  templateUrl: './tab-monitoring.component.html',
  styleUrls: ['./tab-monitoring.component.scss']
})

export class TabMonitoringComponent implements OnInit {
  constructor(private _route: ActivatedRoute, private _diagnosticApiService: ApplensDiagnosticService, private _diagnosticService: DiagnosticService) { }

  systemInvokerResponse: DetectorResponse;
  detectorAuthor: String = "";
  authorInfo: string = "";

  @Input() systemInvokerId: string = "__monitoring";
  @Input() statisticsType: StatisticsType = StatisticsType.Monitoring;

  reportName: string = "";
  detectorId: string;
  private dataSourceMapping: Map<string, string> = new Map<string, string>([
    ["All", "0"],
    ["Applens", "1"],
    ["Azure Portal", "2"]
  ]);
  dataSourceKeys: string[];
  selectedDataSource: string = "All";
  private dataSourceFlag: string = "0";

  private timeRangeMapping: Map<string, string> = new Map<string, string>([
    ["Last 24 hours", "24"],
    ["Last 3 days", "72"],
    ["Last Week", "168"],
    ["Last Month", "720"]
  ]);
  timeRangeKeys: string[];
  selectedTimeRange: string = "Last Week";
  private timeRangeInHours: string = "168";

  endTime: momentNs.Moment = moment.utc();
  startTime: momentNs.Moment = this.endTime.clone().subtract(7, 'days');

  error: any;

  buttonStyle: IButtonStyles = {
    root: {
      color: "#323130",
      borderRadius: "12px",
      marginTop: "8px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    }
  }

  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  ngOnInit() {
    this.getMonitoringResponse();
    this.getDetectorResponse();
    this.dataSourceKeys = Array.from(this.dataSourceMapping.keys());
    this.timeRangeKeys = Array.from(this.timeRangeMapping.keys());
  }

  refresh() {
    this.getMonitoringResponse();
  }

  getMonitoringResponse() {
    this.systemInvokerResponse = null;
    this.detectorId = this._route.parent.snapshot.params['detector'].toLowerCase();
    this._diagnosticApiService.getSystemInvoker(this.detectorId, this.systemInvokerId, this.dataSourceFlag, this.timeRangeInHours)
      .subscribe((response: DetectorResponse) => {
        this.systemInvokerResponse = response;
      }, (error: any) => {
        this.error = error;
      });
  }

  getDetectorResponse() {
    this._diagnosticService.getDetectors().subscribe(detectors => {
      let detectorMetaData: DetectorMetaData = detectors.find(detector => this.detectorId === detector.id.toLowerCase());
      if (detectorMetaData && detectorMetaData.name) {
        this.reportName = this.statisticsType === StatisticsType.Monitoring ? `${detectorMetaData.name} Monitoring 📈` : `${detectorMetaData.name} Analytics 📊`;
      }
      if (detectorMetaData && detectorMetaData.author) {
        this.authorInfo = detectorMetaData.author;
      }
    }, (error: any) => {
      this.error = error;
    });
  }

  setDataSource(selectedDataSource: string) {
    this.selectedDataSource = selectedDataSource;
    this.dataSourceFlag = this.dataSourceMapping.get(selectedDataSource);
    this.refresh();
  }

  setTimeRange(selectedTimeRange: string) {
    this.selectedTimeRange = selectedTimeRange;
    this.timeRangeInHours = this.timeRangeMapping.get(selectedTimeRange);
    let timeRangeInDays: number = parseInt(this.timeRangeInHours) / 24;
    this.startTime = this.endTime.clone().subtract(timeRangeInDays, 'days');
    this.refresh();
  }
}
