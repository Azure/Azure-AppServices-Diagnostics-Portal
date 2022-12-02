import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  DevelopMode,
  OnboardingFlowComponent
} from '../../onboarding-flow/onboarding-flow.component';
import * as momentNs from 'moment';

const moment = momentNs;

@Component({
  selector: 'tab-monitoring-develop',
  templateUrl: './tab-monitoring-develop.component.html',
  styleUrls: ['./tab-monitoring-develop.component.scss']
})
export class TabMonitoringDevelopComponent implements OnInit {
  @Input() mode: DevelopMode = DevelopMode.EditMonitoring;
  DevelopMode = DevelopMode;
  detectorId: string;
  private dataSourceMapping: Map<string, string> = new Map<string, string>([
    ['All', '0'],
    ['Applens', '1'],
    ['Azure Portal', '2']
  ]);
  dataSourceKeys: string[];
  selectedDataSource: string = 'All';
  dataSourceFlag: string = '0';

  private timeRangeMapping: Map<string, string> = new Map<string, string>([
    ['Last 24 hours', '24'],
    ['Last 3 days', '72'],
    ['Last Week', '168'],
    ['Last Month', '720']
  ]);
  timeRangeKeys: string[];
  selectedTimeRange: string = 'Last Week';
  timeRangeInHours: string = '168';
  endTime: momentNs.Moment = moment.utc();
  startTime: momentNs.Moment = this.endTime.clone().subtract(7, 'days');

  constructor(private _route: ActivatedRoute) {}

  ngOnInit() {
    this.detectorId =
      this._route.parent.snapshot.params['detector'].toLowerCase();
    this.dataSourceKeys = Array.from(this.dataSourceMapping.keys());
    this.timeRangeKeys = Array.from(this.timeRangeMapping.keys());
  }

  setDataSource(selectedDataSource: string) {
    this.selectedDataSource = selectedDataSource;
    this.dataSourceFlag = this.dataSourceMapping.get(selectedDataSource);
  }

  setTimeRange(selectedTimeRange: string) {
    this.selectedTimeRange = selectedTimeRange;
    this.timeRangeInHours = this.timeRangeMapping.get(selectedTimeRange);
    let timeRangeInDays: number = parseInt(this.timeRangeInHours) / 24;
    this.startTime = this.endTime.clone().subtract(timeRangeInDays, 'days');

    if (this.selectedTimeRange === 'Last Month') {
      let daysInMonth = this.endTime.daysInMonth();
      this.startTime = this.endTime.clone().subtract(daysInMonth, 'days');
    }
  }
}
