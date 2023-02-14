import { Component, OnInit } from '@angular/core';
import { DataTableDataType, DiagnosticData, GanttChartInnerMarkdownPosition, TimeSeriesRendering, DataTableResponseObject, RenderingType, TimeSeriesType } from '../../models/detector';
import { HighchartsData, HighchartGraphSeries } from '../highcharts-graph/highcharts-graph.component';
import { DataRenderBaseComponent, DataRenderer } from '../data-render-base/data-render-base.component';
import { TimeSeries, TablePoint, HighChartTimeSeries, MetricType,GraphSeries, GraphPoint } from '../../models/time-series';
import * as momentNs from 'moment';
import { TimeUtilities } from '../../utilities/time-utilities';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

const moment = momentNs;

@Component({
    selector: 'time-series-graph',
    templateUrl: './time-series-graph.component.html',
    styleUrls: ['./time-series-graph.component.scss']
})
export class TimeSeriesGraphComponent extends DataRenderBaseComponent implements OnInit, DataRenderer {
    DataRenderingType = RenderingType.TimeSeries;
    InnerMarkdownPosition = GanttChartInnerMarkdownPosition;

    constructor(protected telemetryService: TelemetryService) {
        super(telemetryService);
    }

    allSeries: TimeSeries[] = [];
    allSeriesNames: string[] = [];

    // All series with highchart
    allHighChartSeries: HighChartTimeSeries[] = [];
    allHighChartSeriesNames: string[] = [];

    selectedSeries: GraphSeries[];
    selectedHighChartSeries: HighchartGraphSeries[];

    yAxisCategories: any = [];
    formattedGanttChartData: any[] = [];
    mappedGanttChartData: { [key: string]: any[] } = {};
    startTimestampColumnName: string;
    endTimestampColumnName: string;

    renderingProperties: TimeSeriesRendering;
    dataTable: DataTableResponseObject;
    defaultValue: number = 0;
    graphOptions: any;
    customizeXAxis: boolean;

    timeGrain: momentNs.Duration;
    metricType: MetricType = MetricType.Avg;
    processData(data: DiagnosticData) {
        super.processData(data);

        if (data) {
            this.renderingProperties = <TimeSeriesRendering>data.renderingProperties;
            this.defaultValue = this.renderingProperties.defaultValue !== null ? this.renderingProperties.defaultValue : this.defaultValue;
            this.graphOptions = this.renderingProperties.graphOptions;

            if(this.renderingProperties.metricType != undefined) {
                this.metricType = this.renderingProperties.metricType;
            }

            this.customizeXAxis = this.graphOptions && this.graphOptions.customizeX && this.graphOptions.customizeX === 'true';
            this.timeGrain = this._getInitialTimegrain();
            this.dataTable = data.table;
            if (this.renderingProperties?.graphType === TimeSeriesType.GanttChart) {
                this._processDiagnosticDataForGanttChart(data);
                this._processCategoriesAndSeriesData();
            } else {
                this._processDiagnosticDataForOtherCharts(data);
                this.selectSeries();
            }
        }
    }

    selectSeries() {
        this.selectedSeries = this.allSeries.map(series => series.series);
        this.selectedHighChartSeries = this.allHighChartSeries.map(series => series.series);
    }

    private _processDiagnosticDataForGanttChart(diagnosticData: DiagnosticData) {
        const { columns, rows } = diagnosticData?.table || {};
        const { eventStatusColumnName, seriesColumns, startTimestampColumnName, endTimestampColumnName } =
        this.renderingProperties || {};

        if (
        !seriesColumns?.length ||
        endTimestampColumnName == null ||
        startTimestampColumnName  == null
        )
        return;

        const { columnName: yAxisColumnName } =
        this._getCounterValueColumns()[0] || {};

        this.startTimestampColumnName = startTimestampColumnName;
        this.endTimestampColumnName = endTimestampColumnName;

        this.formattedGanttChartData = this._getFormattedChartData(rows, columns);
        this.formattedGanttChartData.forEach((data) => {
            const key = data[yAxisColumnName];
            const currentStartTime: string = data[this.startTimestampColumnName];
            const currentEndTime : string = data[this.endTimestampColumnName];

            const chartRowData = this.mappedGanttChartData[key];
            if (chartRowData != null) {
            const lastElementInChartRowDataArray =
                chartRowData[chartRowData.length - 1];
            const endTime: string =
                lastElementInChartRowDataArray[this.endTimestampColumnName];
            const diffInMinutes = this._getDifferenceInMinutes(
                currentStartTime,
                endTime
            );
    
            if (
                diffInMinutes !== 0 ||
                (!!eventStatusColumnName &&
                data[eventStatusColumnName] !==
                    lastElementInChartRowDataArray[eventStatusColumnName])
            ) {
                chartRowData.push({
                ...data,
                [this.startTimestampColumnName]: momentNs
                    .utc(currentStartTime)
                    .toISOString(),
                [this.endTimestampColumnName]: momentNs
                    .utc(currentEndTime)
                    .toISOString(),
                });
            } else {
                lastElementInChartRowDataArray[this.endTimestampColumnName] = momentNs
                .utc(currentEndTime)
                .toISOString();
            }
            } else {
            this.mappedGanttChartData[key] = [
                {
                ...data,
                [this.startTimestampColumnName]: momentNs
                    .utc(currentStartTime)
                    .toISOString(),
                [this.endTimestampColumnName]: momentNs
                    .utc(currentEndTime)
                    .toISOString(),
                },
            ];
            }
        });
    }

    private _processDiagnosticDataForOtherCharts(data: DiagnosticData) {
        const timestampColumn = this._getTimeStampColumnIndex();
        const counterNameColumnIndex = this._getCounterNameColumnIndex();
        const numberValueColumns = this._getCounterValueColumns();

        let uniqueCounterNames: string[] = [];
        if (counterNameColumnIndex >= 0) {
            // This gets unique values in counter name row
            uniqueCounterNames = data.table.rows.map(row => row[counterNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
        }

        const timeSeriesDictionary = {};
        const highchartTimeSeriesDictionary = {};

        numberValueColumns.forEach(column => {
            if (uniqueCounterNames.length > 0) {
                uniqueCounterNames.forEach(counterName => {
                    const seriesName = this._getSeriesName(column.columnName, counterName);
                    timeSeriesDictionary[seriesName] = <TimeSeries>{ name: seriesName, series: <GraphSeries>{ key: seriesName, values: [] } };
                    let accessibilitySetting = {
                        description: seriesName,
                        enabled: true,
                        exposeAsGroupOnly: false,
                        keyboardNavigation: {
                            enabled: true
                        }
                    };

                    highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting }};
                })
            } else {
                const seriesName = column.columnName;
                let accessibilitySetting = {
                    description: seriesName,
                    enabled: true,
                    exposeAsGroupOnly: false,
                    keyboardNavigation: {
                        enabled: true
                    }
                };
                timeSeriesDictionary[seriesName] = <TimeSeries>{ name: seriesName, series: <GraphSeries>{ key: seriesName, values: [] } };
                highchartTimeSeriesDictionary[seriesName] = <HighChartTimeSeries>{ name: seriesName, series: <HighchartGraphSeries>{ name: seriesName, data: [], accessibility: accessibilitySetting } };
            }
        });

        const tablePoints: TablePoint[] = [];

        let lastTimeStamp: momentNs.Moment = this.startTime;

        data.table.rows.forEach(row => {
            numberValueColumns.forEach(column => {
                const columnIndex: number = data.table.columns.indexOf(column);

                const timestamp = moment.utc(row[timestampColumn]);

                if (!this.customizeXAxis) {
                    const currentGcf = this._getGreatestCommonFactor(timestamp);
                    if (currentGcf.asMilliseconds() < this.timeGrain.asMilliseconds()) {
                        this.timeGrain = currentGcf.clone();
                    }
                }

                lastTimeStamp = timestamp;

                if (columnIndex > -1 && row[columnIndex] != null) {
                    const point: TablePoint = <TablePoint>{
                        timestamp: timestamp,
                        value: parseFloat(row[columnIndex]),
                        column: column.columnName,
                        counterName: counterNameColumnIndex >= 0 ? row[counterNameColumnIndex] : null
                    };

                    tablePoints.push(point);
                }
            });
        });

        // If there is no point, fallback on no data defaults
        if (data.table.rows.length < 1) {
            this.timeGrain = this._getNoDataTimegrain();
        }

        if (!this.customizeXAxis) {
            this._prepareStartAndEndTime();
        }

        Object.keys(timeSeriesDictionary).forEach(key => {

            const pointsForThisSeries =
                tablePoints
                    .filter(point => this._getSeriesName(point.column, point.counterName) === key)
                    .sort((b, a) => !this.customizeXAxis ? a.timestamp.diff(b.timestamp) : b.timestamp.diff(a.timestamp));

            if (!this.customizeXAxis) {
                let pointToAdd = pointsForThisSeries.pop();

                // Remove the points that earlier than starttime
                while (pointToAdd && pointToAdd.timestamp && pointToAdd.timestamp.isBefore(this.startTime)) {
                    pointToAdd = pointsForThisSeries.pop();
                }

                for (const d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrain)) {
                    let value = this.defaultValue;
                    if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
                        value = pointToAdd.value;
                        pointToAdd = pointsForThisSeries.pop();
                    }
                    timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: d.clone(), y: value });
                    highchartTimeSeriesDictionary[key].series.data.push([d.clone().valueOf(), value]);
                }
            } else {
                pointsForThisSeries.forEach(pointToAdd => {
                    if (pointToAdd.timestamp.isBefore(this.startTime)) {
                        this.startTime = pointToAdd.timestamp;
                    }
                    timeSeriesDictionary[key].series.values.push(<GraphPoint>{ x: momentNs.utc(pointToAdd.timestamp), y: pointToAdd.value });
                    highchartTimeSeriesDictionary[key].series.data.push([momentNs.utc(pointToAdd.timestamp).valueOf(), pointToAdd.value]);
                });
            }

            this.allSeries.push(timeSeriesDictionary[key]);

            this.allHighChartSeries.push(highchartTimeSeriesDictionary[key]);
        });
    }

    private _processCategoriesAndSeriesData() {
        const { useCustomColor, customTooltipColumnName, customColorColumnName } =
        this.graphOptions?.taskBar || {};

        let yIndex = 0;
        const xAxisData = [],
        yAxisCategories = [];

        for (const [key, value] of Object.entries(this.mappedGanttChartData)) {
        yAxisCategories.push(key);

        value.forEach((data: any) => {
            xAxisData.push({
            id: data[customTooltipColumnName] || key,
            x2: Date.parse(data[this.endTimestampColumnName]),
            x: Date.parse(data[this.startTimestampColumnName]),
            y: yIndex,
            ...(!!useCustomColor && {
                color: data[customColorColumnName],
            }),
            });
        });
        yIndex++;
        }

        const highchartData = [
        {
            type: 'xrange',
            name: this.renderingProperties?.title,
            data: xAxisData,
            dataLabels: {
            enabled: true,
            },
            dataLength: yIndex,
            accessibility: {},
            events: () => {},
        },
        ];

        this.selectedHighChartSeries = highchartData;
        this.selectedSeries = [];
        this.yAxisCategories = yAxisCategories;
    }

    private _getFormattedChartData(rows: any[], columns: any[]) {
        return rows
        .map((row: any[]) => {
            const obj = {};
            row.forEach((value, index) => {
            Object.assign(obj, { [columns[index].columnName]: value });
            });

            return obj;
        })
        .sort((a, b) => {
            return (
            new Date(a[this.startTimestampColumnName]).getTime() -
            new Date(b[this.startTimestampColumnName]).getTime()
            );
        })
        .filter(
            (value, index, arr) =>
              arr.findIndex((v2) => JSON.stringify(v2) === JSON.stringify(value)) === index
        );
    }

    private _getDifferenceInMinutes(currentTime: string, endTime: string) {
        const diff =
          (this._getTimeStamp(currentTime) - this._getTimeStamp(endTime)) /
          1000 /
          60;
        return Math.abs(Math.round(diff));
      }
    
    private _getTimeStamp(datetimeString: string) {
        return momentNs.utc(datetimeString).milliseconds(0).toDate().getTime();
    }

    private _getGreatestCommonFactor(timestamp: momentNs.Moment): momentNs.Duration {
        const minuteGcf = this._gcd(timestamp.minutes(), this.timeGrain.asMinutes());
        if (minuteGcf !== 60) { return moment.duration(minuteGcf, 'minutes'); }

        const hourGcf = this._gcd(timestamp.hours(), this.timeGrain.asHours());
        if (hourGcf !== 24) { return moment.duration(hourGcf, 'hours'); }

        const daysInMonth = timestamp.daysInMonth();
        const daysGcf = hourGcf === 24 ? this._gcd(timestamp.days(), daysInMonth) : 0;
        if (daysGcf !== daysInMonth) { return moment.duration(daysGcf, 'days'); }

        return moment.duration(1, 'month');
    }

    private _gcd(a: number, b: number) {
        a = Math.abs(a);
        b = Math.abs(b);

        while (true) {
            if (b > a) { const temp = a; a = b; b = temp; }
            if (b === 0) { return a; }
            a %= b;
            if (a === 0) { return b; }
            b %= a;
        }
    }

    // Initial Time Grain: The max allowed for each range
    private _getInitialTimegrain(): momentNs.Duration {
        const rangeInMonths = Math.abs(this.startTime.diff(this.endTime, 'months'));
        const rangeInHours = Math.abs(this.startTime.diff(this.endTime, 'hours'));

        // Greater than 1 month: 1 month
        if (rangeInMonths > 1 || this.customizeXAxis && rangeInMonths === 1) {
            return moment.duration(1, 'months');
        }
         // 7 days -> 1 month: 1 day
         if (rangeInHours > 168) {
            return moment.duration(1, 'days');
        }

        // Other scenarios we set the default as 60 minutes
        return moment.duration(60, 'minutes');
    }

    // No data time grain: The default in the case of one or no data points
    private _getNoDataTimegrain() {
        const rangeInMonths = Math.abs(this.startTime.diff(this.endTime, 'months'));
        const rangeInHours = Math.abs(this.startTime.diff(this.endTime, 'hours'));

        // Greater than 1 month: 1 month
        if (rangeInMonths > 1) {
            return moment.duration(1, 'months');
        }
        // 7 days -> 1 month: 1 day
        if (rangeInHours >= 168) {
            return moment.duration(1, 'days');
        }

        // 1 days -> 7 days
        if (rangeInHours > 24) {
            return moment.duration(1, 'hours');
        }

        // else 1 hr
        return moment.duration(5, 'minutes');
    }

    private _prepareStartAndEndTime() {
        const start = this.startTime;
        const end = this.endTime;

        TimeUtilities.roundDown(start, this.timeGrain);
        TimeUtilities.roundDown(end, this.timeGrain);
        end.minute(end.minute() - end.minute() % this.timeGrain.minutes()).second(0);
        this.startTime = start;
        this.endTime = end;
    }

    private _getSeriesName(column: string, countername: string) {
        return countername ? `${countername}-${column}` : column;
    }

    private _getTimeStampColumnIndex(): number {
        const columnIndex = this.renderingProperties.timestampColumnName ?
            this.dataTable.columns.findIndex(column => this.renderingProperties.timestampColumnName === column.columnName) :
            this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);

        return columnIndex;
    }

    private _getCounterNameColumnIndex(): number {
        const columnIndex = this.renderingProperties.counterColumnName ?
            this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === column.columnName) :
            this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.String);

        return columnIndex;
    }

    private _getCounterValueColumns() {
        const columns = this.renderingProperties.seriesColumns ?
            this.dataTable.columns.filter(column => this.renderingProperties.seriesColumns.indexOf(column.columnName) >= 0) :
            this.dataTable.columns.filter(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);

        return columns;
    }
}
