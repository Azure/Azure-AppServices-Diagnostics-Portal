import { GraphSeries } from '../components/nvd3-graph/nvd3-graph.component';
import { HighchartGraphSeries } from '../components/highcharts-graph/highcharts-graph.component';
import * as momentNs from 'moment';

export interface TimeSeries {
  name: string;
  series: GraphSeries;
}

export interface HighChartTimeSeries {
    name: string;
    series: HighchartGraphSeries;
  }

export interface InstanceTimeSeries extends TimeSeries {
  aggregated: boolean;
  instance: string;
}

export interface InstanceHighChartTimeSeries extends HighChartTimeSeries {
  aggregated: boolean;
  instance: string;
}

export interface DetailedInstanceTimeSeries extends TimeSeries {
  instance: InstanceDetails;
}

export interface DetailedInstanceHighChartTimeSeries extends HighChartTimeSeries {
  instance: InstanceDetails;
}

export class xAxisPlotBand {
  public color:string;
  public from: momentNs.Moment;
  public to: momentNs.Moment;
  public style?: xAxisPlotBandStyles;
  public borderColor?: string;
  public borderWidth?:number;
  public id?:string;
}

export enum xAxisPlotBandStyles {
  BehindPlotLines = "0",
  AbovePlotLines = "3",
  AbovePlotLinesAndSeries = "5"
}

export enum zoomBehaviors {
  Zoom = 1,
  CancelZoom = 2,
  FireXAxisSelectionEvent = 4,
  ShowXAxisSelectionDisabledMessage = 8,
  GeryOutGraph = 16,
  UnGreyGraph = 32,
}

export class XAxisSelection {
  public chart:Highcharts.Chart;
  public _rawEventArgs:Highcharts.ChartSelectionContextObject;
  public fromTime:momentNs.Moment;
  public toTime:momentNs.Moment;
}

export class InstanceDetails {
  roleInstance: string; // SmallDedid...
  tenant: string; // Stamp Tenant
  machineName: string; // RD...

  displayName: string;

  constructor(roleInstance, tenant, machinename) {
    this.roleInstance = roleInstance;
    this.tenant = tenant;
    this.machineName = machinename;

    this.displayName = this._getDisplayName();
  }

  private _getDisplayName() {
    if (this.machineName && this.machineName !== '') {
      return this.machineName;
    }

    const truncatedTenant = this.tenant && this.tenant !== '' ? this.tenant.substr(0, 4) + '-' : '';
    const truncatedInstance = this.roleInstance.replace('DedicatedWebWorkerRole_IN', '').replace('DedicatedLinuxWebWorkerRole_IN', '');

    return `${truncatedTenant}${truncatedInstance}`;
  }

  equals(instance: InstanceDetails): boolean {
    return this.roleInstance === instance.roleInstance &&
      this.tenant === instance.tenant &&
      this.machineName === instance.machineName;
  }
}

export interface TablePoint {
  timestamp: momentNs.Moment;
  value: number;
  column: string;
  counterName: string;
}

export enum MetricType {
  None,
  Avg,
  Min,
  Max,
  Sum,
}
