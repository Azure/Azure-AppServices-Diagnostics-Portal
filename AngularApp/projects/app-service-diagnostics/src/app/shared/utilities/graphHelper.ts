import { Injectable } from '@angular/core';
import { IMetricSet, IMetricSample } from '../models/detectorresponse';
import { ChartSeries, ChartPoint } from '../models/chartdata';
declare let d3: any;

export class GraphHelper {
  private static _colors: string[] = [
    'rgb(127, 186, 0)',
    'rgb(155, 79, 150)',
    'rgb(255, 140, 0)',
    'rgb(232, 17, 35)'
  ];

  static parseMetricsToChartData(
    metricSets: IMetricSet[],
    defaultMetricValue: number = 0,
    area: boolean = false
  ): any {
    const chartData: any = [];

    if (!metricSets) {
      return null;
    }

    for (const metricSet of metricSets) {
      const coeff = this._getTimeSpanInMilliseconds(metricSet.timeGrain);
      const startTime = new Date(
        Math.round(new Date(metricSet.startTime).getTime() / coeff) * coeff
      );

      const endTime = new Date(
        Math.round(new Date(metricSet.endTime).getTime() / coeff) * coeff
      );
      let metricName = metricSet.name;

      if (metricName === 'Average Time Taken') {
        metricName = 'Average Response Time';
      }

      const metricChartItem: any = {
        key: metricName,
        values: [],
        area: area
      };

      for (
        const d = new Date(startTime.getTime());
        d <= endTime;
        d.setTime(d.getTime() + coeff)
      ) {
        const xDate = new Date(d.getTime());
        let yValue = defaultMetricValue;
        let addToChartSeries: boolean = false;

        const element = metricSet.values.find(
          (p) => new Date(p.timestamp).getTime() === xDate.getTime()
        );
        if (element) {
          yValue = element.total;
          addToChartSeries = true;
        } else if (
          xDate.getTime() <
          new Date(metricSet.endTime).getTime() - 600000
        ) {
          addToChartSeries = true;
        }

        if (addToChartSeries) {
          metricChartItem.values.push({
            x: this.convertToUTCTime(xDate),
            y: yValue
          });
        }
      }

      chartData.push(metricChartItem);
    }

    return chartData;
  }

  static parseMetricsToChartDataPerInstance(
    metricSets: IMetricSet[],
    defaultMetricValue: number = 0,
    area: boolean = false,
    instancesToSelect: string[] = []
  ): ChartSeries[] {
    const chartData: ChartSeries[] = [];

    if (!metricSets) {
      return null;
    }

    metricSets.forEach((metricSet) => {
      this.parseMetricSetToChartDataPerInstance(
        metricSet,
        defaultMetricValue,
        area,
        instancesToSelect
      ).forEach((series) => {
        if (!(series === undefined)) {
          chartData.push(series);
        }
      });
    });

    return chartData;
  }

  static parseMetricSetToChartDataPerInstance(
    metricSet: IMetricSet,
    defaultMetricValue: number = 0,
    area: boolean = false,
    instancesToSelect: string[] = []
  ): ChartSeries[] {
    const chartData: ChartSeries[] = [];

    if (!metricSet || metricSet.values.length <= 0) {
      return [];
    }

    const coeff = this._getTimeSpanInMilliseconds(metricSet.timeGrain);
    const startTime = new Date(
      Math.round(new Date(metricSet.startTime).getTime() / coeff) * coeff
    );

    // end time is EndTime in metrics - 10 minutes (to account for dat delay)
    const endTime = new Date(
      Math.round((new Date(metricSet.endTime).getTime() - 600000) / coeff) *
        coeff
    );
    let metricName = metricSet.name;

    if (metricName === 'Average Time Taken') {
      metricName = 'Average Response Time';
    }

    metricSet.values.forEach((sample) => {
      let isAggregated = true;
      let roleInstance = '';
      if (sample.roleInstance) {
        isAggregated = false;
        roleInstance = sample.roleInstance;
      }

      if (!chartData.find((x) => x.roleInstance === roleInstance)) {
        chartData.push({
          key: isAggregated ? metricName : roleInstance + ' - ' + metricName,
          metricName: metricName,
          isAggregated: isAggregated,
          roleInstance: roleInstance,
          values: [],
          area: area,
          disabled:
            instancesToSelect &&
            instancesToSelect.length > 0 &&
            instancesToSelect.indexOf(roleInstance) < 0
        });
      }
    });

    chartData.forEach((series) => {
      const pointsForWorker = metricSet.values
        .filter(
          (point) =>
            point.isAggregated || point.roleInstance === series.roleInstance
        )
        .filter(
          (point) =>
            new Date(point.timestamp).getTime() >= startTime.getTime() &&
            new Date(point.timestamp).getTime() <= endTime.getTime()
        );
      pointsForWorker.sort(this.sortGraphPointsByTimestamp);

      let nextElement = pointsForWorker.pop();
      for (
        const d = new Date(startTime.getTime());
        d < endTime;
        d.setTime(d.getTime() + coeff)
      ) {
        const xDate = new Date(d.getTime());
        let yValue = defaultMetricValue;

        if (
          nextElement &&
          nextElement.timestamp &&
          xDate.getTime() === new Date(nextElement.timestamp).getTime()
        ) {
          let time = new Date(nextElement.timestamp).getTime();
          yValue = nextElement.total;
          while (xDate.getTime() === time) {
            nextElement = pointsForWorker.pop();
            if (!nextElement) {
              break;
            }
            time = new Date(nextElement.timestamp).getTime();
          }
        }

        series.values.push(<ChartPoint>{
          x: this.convertToUTCTime(xDate),
          y: yValue
        });
      }
    });

    return chartData;
  }

  static sortGraphPointsByTimestamp(a: IMetricSample, b: IMetricSample) {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    if (dateA > dateB) {
      return -1;
    }
    if (dateA < dateB) {
      return 1;
    }
    return 0;
  }

  static getDefaultChartOptions(
    chartType: string = 'lineChart',
    colors: string[] = this._colors,
    chartHeight: number = 200
  ): any {
    const chartOptions: any = {
      chart: {
        type: chartType,
        height: chartHeight,
        margin: {
          top: 20,
          right: 40,
          bottom: 50,
          left: 50
        },
        color: colors,
        useInteractiveGuideline: true,
        transitionDuration: 350,
        showLegend: true,
        stacked: true,
        clipEdge: false,
        showControls: false,
        x: function (d: any) {
          return d.x;
        },
        y: function (d: any) {
          return d.y;
        },
        xAxis: {
          showMaxMin: false,
          axisLabel: 'Time (UTC)',
          tickSize: 10,
          staggerLabels: false,
          tickFormat: function (d: any) {
            return d3.time.format('%m/%d %H:%M')(new Date(d));
          }
        },
        yAxis: {
          showMaxMin: false,
          tickFormat: d3.format('.2f'),
          axisLabel: '',
          axisLabelDistance: -10
        }
      }
    };

    return chartOptions;
  }

  static convertToUTCTime(localDate: Date): Date {
    const utcTime = new Date(
      localDate.getUTCFullYear(),
      localDate.getUTCMonth(),
      localDate.getUTCDate(),
      localDate.getUTCHours(),
      localDate.getUTCMinutes(),
      localDate.getUTCSeconds()
    );
    return utcTime;
  }

  private static _getTimeSpanInMilliseconds(timeSpan: string) {
    const a = timeSpan.split(':');
    return (+a[0] * 60 * 60 + +a[1] * 60 + +a[2]) * 1000;
  }
}
