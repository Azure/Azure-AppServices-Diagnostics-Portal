import { Component, OnInit } from '@angular/core';
import { StatisticsType } from '../tab-monitoring/tab-monitoring.component';

@Component({
  selector: 'tab-analytics-dashboard',
  templateUrl: './tab-analytics-dashboard.component.html',
  styleUrls: ['./tab-analytics-dashboard.component.scss']
})
export class TabAnalyticsDashboardComponent implements OnInit {
  systemInvokerId: string = '__analytics';
  statisticsType: StatisticsType = StatisticsType.Analytics;
  constructor() {}

  ngOnInit() {}
}
