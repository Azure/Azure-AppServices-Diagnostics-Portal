import { Component, Input, OnInit } from '@angular/core';
import { IMetricSet } from '../../models/detectorresponse';
import { ReplaySubject } from 'rxjs';
import { GraphHelper } from '../../utilities/graphHelper';
import { ChartSeries, ChartType } from '../../models/chartdata';

@Component({
  selector: 'metric-graph',
  templateUrl: 'metric-graph.component.html'
})
export class MetricGraphComponent implements OnInit {
  constructor() {
    this.chartType = ChartType.lineChart;
  }

  private _metricSetsSubject: ReplaySubject<IMetricSet[]> = new ReplaySubject<
    IMetricSet[]
  >(1);

  @Input() set metricSets(value: IMetricSet[]) {
    this._metricSetsSubject.next(value);
  }

  @Input() title: string;
  @Input() description: string;
  @Input() chartType: ChartType;
  @Input() yAxisLabel: string;
  @Input() instancesToSelect: string[] = [];
  @Input() chartOptions: any;

  chartData: ChartSeries[];

  showDescription: boolean = true;

  ngOnInit() {
    if (!this.chartOptions) {
      this.chartOptions = GraphHelper.getDefaultChartOptions();
    }

    this._metricSetsSubject.subscribe((metricSets: IMetricSet[]) => {
      if (metricSets) {
        this.chartOptions.chart.type = ChartType[this.chartType].toString();
        this.chartOptions.chart.yAxis.axisLabel = this.yAxisLabel;
        this.chartOptions.chart.margin.bottom = 40;
        this.chartData = GraphHelper.parseMetricsToChartDataPerInstance(
          metricSets,
          0,
          false,
          this.instancesToSelect
        );
      } else {
        this.chartData = null;
      }
    });
  }
}
