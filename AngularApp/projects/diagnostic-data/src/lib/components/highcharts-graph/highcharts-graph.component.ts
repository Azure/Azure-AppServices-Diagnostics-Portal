import * as momentNs from 'moment';
import { Component, Input, OnInit } from '@angular/core';
import { TimeSeriesType } from '../../models/detector';
import * as Highcharts from 'highcharts';
import AccessibilityModule from 'highcharts/modules/accessibility';

AccessibilityModule(Highcharts);

const moment = momentNs;

declare let d3: any;

Highcharts.setOptions({
    title: {
      style: {
        color: 'tomato'
      }
    },
    legend: {
      enabled: false
    }
  });

@Component({
  selector: 'highcharts-graph',
  templateUrl: './highcharts-graph.component.html',
  styleUrls: ['./highcharts-graph.component.scss']
})
export class HighchartsGraphComponent implements OnInit {
    Highcharts: typeof Highcharts = Highcharts;
    options: any;

    @Input() chartData: GraphSeries[];

    @Input() chartType: TimeSeriesType;

    @Input() chartOptions: any;

    @Input() startTime: momentNs.Moment;

    @Input() endTime: momentNs.Moment;

    loading: boolean = true;

    constructor() {
     // this._setOptions();
    }

    ngOnInit() {
      this._updateOptions();

      setTimeout(() => {
        this.loading = false;
      }, 100);
    }

    private _updateOptions() {
      if (this.chartType) {
        this.options.chart.type = Nvd3Utilities.getChartType(this.chartType);
      }

      if (this.chartOptions) {
        this._updateObject(this.options.chart, this.chartOptions);
      }

      if (this.startTime && this.endTime) {
        this.options.forceX = [this.startTime, this.endTime];
      }
    }

    private _updateObject(obj: Object, replacement: any): Object {
      Object.keys(replacement).forEach(key => {
        const subItem = obj[key];
        const replace = replacement[key];
        // Below returns true if subItem is an object
        if (subItem === Object(subItem)) {
          obj[key] = this._updateObject(subItem, replace);
        } else {
          obj[key] = replace;
        }
      });

      return obj;
    }

    private _setOptions() {

        Highcharts.setOptions({
            title: {
            style: {
                color: 'tomato'
            }
            },
            legend: {
            enabled: false
            }
        });

      this.options = {
        chart: {
          type: 'lineChart',
          height: 200,
          margin: {
            top: 30,
            right: 40,
            bottom: 50,
            left: 50
          },
          // color: colors,
          useInteractiveGuideline: true,
          transitionDuration: 350,
          showLegend: true,
          stacked: true,
          clipEdge: false,
          showControls: false,
          x: function (d: any) { return moment(d.x).valueOf(); },
          y: function (d: any) { return d.y; },
          xAxis: {
            showMaxMin: false,
            axisLabel: 'Time (UTC)',
            tickSize: 10,
            staggerLabels: false,
            tickFormat: function (d: any) { return moment(d).utc().format('MM/DD HH:mm'); }
          },
          yAxis: {
            showMaxMin: false,
            tickFormat: d3.format('.2f'),
            axisLabel: '',
            axisLabelDistance: -10
          },
          forceY: [0, 1]
        }
      };
    }

  }

  export interface GraphPoint {
    x: momentNs.Moment;
    y: number;
  }

  export interface GraphSeries {
    key: string;
    values: GraphPoint[];
  }
