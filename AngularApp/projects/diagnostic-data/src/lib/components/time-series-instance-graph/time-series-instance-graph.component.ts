import { Component, OnInit, Input } from '@angular/core';
import { DataTableDataType, DiagnosticData, TimeSeriesPerInstanceRendering, DataTableResponseObject, DataTableResponseColumn } from '../../models/detector';
import { GraphSeries, GraphPoint } from '../nvd3-graph/nvd3-graph.component';
import { DataRenderBaseComponent, DataRenderer } from '../data-render-base/data-render-base.component';
import { InstanceDetails, DetailedInstanceTimeSeries, DetailedInstanceHighChartTimeSeries } from '../../models/time-series';
import { TimeZones, TimeUtilities } from '../../utilities/time-utilities';
import * as momentNs from 'moment';
import { HighchartsData, HighchartGraphSeries } from '../highcharts-graph/highcharts-graph.component';

const moment = momentNs;

@Component({
  selector: 'time-series-instance-graph',
  templateUrl: './time-series-instance-graph.component.html',
  styleUrls: ['./time-series-instance-graph.component.scss']
})
export class TimeSeriesInstanceGraphComponent extends DataRenderBaseComponent implements OnInit, DataRenderer {

  allSeries: DetailedInstanceTimeSeries[] = [];
  allSeriesNames: string[] = [];

  allHighChartSeries: DetailedInstanceHighChartTimeSeries[] = [];
  allHighChartSeriesNames: string[] = [];

  instances: InstanceDetails[];
  selectedInstance: InstanceDetails;
  counters: string[];

  selectedSeries: GraphSeries[];
  selectedHighChartSeries: HighchartGraphSeries[];

  renderingProperties: TimeSeriesPerInstanceRendering;
  dataTable: DataTableResponseObject;
  graphOptions: any;

  defaultValue: number = 0;

  filterByInstance: boolean;

  error: string;
  warning: string;

  timeGrainInMinutes: number = 5;
  useHighchart: boolean = true;
  // showMetrics: boolean = false;
  showMetrics: boolean = true;
  processData(data: DiagnosticData) {
    super.processData(data);

    if (data) {
      const start = this.startTime;
      const end = this.endTime;
      const timeGrain = this.timeGrainInMinutes;

      TimeUtilities.roundDownByMinute(start, this.timeGrainInMinutes);
      TimeUtilities.roundDownByMinute(end, this.timeGrainInMinutes);
      end.minute(end.minute() - end.minute() % timeGrain).second(0);
      this.startTime = start;
      this.endTime = end;

      this.renderingProperties = <TimeSeriesPerInstanceRendering>data.renderingProperties;
      this.dataTable = data.table;
      this.graphOptions = data.renderingProperties.graphOptions;
      this._processDiagnosticData(data);
      this.selectSeries();

      if (this.graphOptions != undefined && this.graphOptions.useHighchart != undefined)
      {
        this.useHighchart = this.graphOptions && this.graphOptions.useHighchart &&  this.graphOptions.useHighchart === "true";
      }

      if(this.renderingProperties.showMetrics != undefined) {
        this.showMetrics = this.renderingProperties.showMetrics;
      }
    }
  }

  selectSeries() {
    // TODO: Use below to add filtering
    // if (this.counters.length <= 1) {
    //   this.filterByInstance = false;
    //   this.allSeries.forEach(series => series.series.key = series.instance.displayName);
    // }
    // else {
    //   this.filterByInstance = true;
    //   this.selectedInstance = this.instances[0];
    // }

    this.selectedSeries = this.allSeries.map(series => series.series);
    this.selectedHighChartSeries = this.allHighChartSeries.map(series => series.series);
  }

  private _processDiagnosticData(data: DiagnosticData) {
    const timestampColumnIndex = data.table.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);
    const instances = this._determineInstances(data.table);
    this.instances = instances;

    if (!instances || instances.length <= 0) {
      return;
    }

    const allSeries: DetailedInstanceTimeSeries[] = [];
    const allHighChartSeries: DetailedInstanceHighChartTimeSeries[] = [];
    const tablePoints: InstanceTablePoint[] = [];
    if (!this.renderingProperties.counterColumnName || this.renderingProperties.counterColumnName === '') {
      const valueColumns: DataTableResponseColumn[] = data.table.columns.filter(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);
      this.counters = valueColumns.map(col => col.columnName);
      valueColumns.forEach(column => instances.forEach(instance =>
        {
          allSeries.push(<DetailedInstanceTimeSeries>{
            instance: instance,
            name: column.columnName,
            series: <GraphSeries>{
              key: `${instance.displayName}-${column.columnName}`,
              values: []
            }
          });

        allHighChartSeries.push(<DetailedInstanceHighChartTimeSeries>{
          instance: instance,
          name: column.columnName,
          series: <HighchartGraphSeries>{
            name: `${instance.displayName}-${column.columnName}`,
            data: [],
            accessibility: {
              description: `${instance.displayName}-${column.columnName}`,
              enabled: true,
              exposeAsGroupOnly: false,
              keyboardNavigation: {
                enabled: true
            }
          }
        }});
        }
    ));

      data.table.rows.forEach(row => {
        const instance = this._getInstanceFromRow(data.table, row);
        valueColumns.forEach(column => {
          const columnIndex: number = data.table.columns.indexOf(column);

          const timestamp = moment.utc(row[timestampColumnIndex]);

          const point: InstanceTablePoint = <InstanceTablePoint>{
            timestamp: timestamp,
            value: Number(row[columnIndex]),
            counterName: column.columnName,
            instance: instance
          };

          tablePoints.push(point);
        });
      });
    } else {
      const counterNameColumnIndex = data.table.columns.findIndex(column => column.columnName.toLowerCase() === 'countername');
      const uniqueCounterNames = data.table.rows.map(row => row[counterNameColumnIndex]).filter((item, index, array) => array.indexOf(item) === index);
      // Only allow one value column => default is first number column
      const counterValueColumnIndex = data.table.columns.findIndex(column => DataTableDataType.NumberTypes.indexOf(column.dataType) >= 0);

      this.counters = uniqueCounterNames;

      uniqueCounterNames.forEach(counter =>
        instances.forEach(instance =>
          {
            allSeries.push(<DetailedInstanceTimeSeries>{
              instance: instance,
              name: counter,
              series: <GraphSeries>{
                key: `${instance.displayName}-${counter}`,
                values: []
              }
            });

            allHighChartSeries.push(<DetailedInstanceHighChartTimeSeries>{
              instance: instance,
              name: counter,
              series: <HighchartGraphSeries>{
                name: `${instance.displayName}-${counter}`,
                data: [],
                accessibility: {
                  description: `${instance.displayName}-${counter}`,
                  enabled: true,
                  exposeAsGroupOnly: false,
                  keyboardNavigation: {
                    enabled: true
                }
                }
              }
            });
          }

        )
      );

      data.table.rows.forEach(row => {

        const timestamp = moment.utc(row[timestampColumnIndex]);
        const instance = this._getInstanceFromRow(data.table, row);

        const point: InstanceTablePoint = <InstanceTablePoint>{
          timestamp: timestamp,
          value: parseFloat(row[counterValueColumnIndex]),
          instance: instance,
          counterName: data.table.columns[counterValueColumnIndex].columnName
        };

        tablePoints.push(point);
      });
    }

    allSeries.forEach(series => {

      const pointsForThisSeries =
        tablePoints
          .filter(point => point.instance.equals(series.instance) && point.counterName === series.name)
          .sort((b, a) => a.timestamp.diff(b.timestamp));

      let pointToAdd = pointsForThisSeries.pop();

      for (const d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrainInMinutes, 'minutes')) {
        let value = this.defaultValue;

        if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
          value = pointToAdd.value;

          pointToAdd = pointsForThisSeries.pop();
        }

        series.series.values.push(<GraphPoint>{ x: d.clone(), y: value });
      }
    });

    allHighChartSeries.forEach(series => {

      const pointsForThisSeries =
        tablePoints
          .filter(point => point.instance.equals(series.instance) && point.counterName === series.name)
          .sort((b, a) => a.timestamp.diff(b.timestamp));

      let pointToAdd = pointsForThisSeries.pop();

      for (const d = this.startTime.clone(); d.isBefore(this.endTime); d.add(this.timeGrainInMinutes, 'minutes')) {
        let value = this.defaultValue;

        if (pointToAdd && d.isSame(moment.utc(pointToAdd.timestamp))) {
          value = pointToAdd.value;

          pointToAdd = pointsForThisSeries.pop();
        }

        series.series.data.push([d.clone().valueOf(), value ]);
      }
    });

    this.allSeries = allSeries;
    this.allHighChartSeries = allHighChartSeries;
  }

  private _getPointsFromValueColumns(instance: InstanceDetails, row: string[]) {

  }

  private _getInstanceFromRow(table: DataTableResponseObject, row: string[]) {
    const roleInstanceColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'roleinstance');
    const tenantColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'tenant');
    const machineNameColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'machinename');

    return new InstanceDetails(roleInstanceColumnIndex >= 0 ? row[roleInstanceColumnIndex] : '',
      tenantColumnIndex >= 0 ? row[tenantColumnIndex] : '',
      machineNameColumnIndex >= 0 ? row[machineNameColumnIndex] : '');
  }

  private _determineInstances(table: DataTableResponseObject) {
    const roleInstanceColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'roleinstance');
    const tenantColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'tenant');
    const machineNameColumnIndex = table.columns.findIndex(column => column.columnName.toLowerCase() === 'machinename');

    if (roleInstanceColumnIndex === -1 && tenantColumnIndex === -1 && machineNameColumnIndex === -1) {
      this.error = 'Could not find appropriate instance name columns';
      return [];
    }

    if (tenantColumnIndex === -1 && machineNameColumnIndex === -1) {
      this.warning = 'If you are only grouping instances by RoleInstance name, your query may be invalid for megastamps';
    }

    const roleInstances: InstanceDetails[] = [];
    table.rows.forEach(row => {
      const roleInstance = roleInstanceColumnIndex >= 0 ? row[roleInstanceColumnIndex] : '';
      const tenant = tenantColumnIndex >= 0 ? row[tenantColumnIndex] : '';
      const machineName = machineNameColumnIndex >= 0 ? row[machineNameColumnIndex] : '';

      if (!roleInstances.find(instance => instance.roleInstance === roleInstance && instance.tenant === tenant && instance.machineName === machineName)) {
        roleInstances.push(new InstanceDetails(roleInstance, tenant, machineName));
      }
    });

    return roleInstances;
  }

  private _getTimeStampColumn() {
    const timeStampColumn = this.renderingProperties.timestampColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.timestampColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.dataType === DataTableDataType.DateTime);

    return timeStampColumn;
  }

  private _getRoleInstanceColumn() {
    const timeStampColumn = this.renderingProperties.roleInstanceColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.roleInstanceColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.columnName === 'RoleInstance');

    this.renderingProperties.roleInstanceColumnName = this.dataTable.columns[timeStampColumn].columnName;

    return timeStampColumn;
  }

  private _getCounterNameColumn() {
    const timeStampColumn = this.renderingProperties.counterColumnName ?
      this.dataTable.columns.findIndex(column => this.renderingProperties.counterColumnName === column.columnName) :
      this.dataTable.columns.findIndex(column => column.columnName !== this.renderingProperties.roleInstanceColumnName
        && column.dataType === DataTableDataType.String);

    return timeStampColumn;
  }
}

interface InstanceTablePoint {
  timestamp: momentNs.Moment;
  value: number;
  counterName: string;
  instance: InstanceDetails;
}
