import { IDetectorAbnormalTimePeriod, IMetricSet } from './detectorresponse';
import { IAnalysisData } from './appanalysisresponse';

export interface SummaryViewModel {
  detectorName: string;
  loading: boolean;
  health: SummaryHealthStatus;
  detectorAbnormalTimePeriod: IDetectorAbnormalTimePeriod;
  renderAbnormalTimePeriodAsHtml: boolean;
  detectorData: IAnalysisData;
  mainMetricSets: IMetricSet[];
  detailMetricSets: IMetricSet[];
  mainMetricGraphTitle: string;
  mainMetricGraphDescription: string;
  perInstanceGraphTitle: string;
  perInstanceGraphDescription;
  emptyDataResponse: string;
}

export enum SummaryHealthStatus {
  Healthy = 0,
  Warning = 1,
  Error = 2
}
