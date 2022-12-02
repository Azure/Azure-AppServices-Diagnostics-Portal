import { IDetectorDefinition } from './detectordefinition';
import { IssueType } from './enumerations';
import { INameValuePair } from './namevaluepair';
import { ISolution } from './solution';

export interface IDetectorResponse {
  startTime: string;
  endTime: string;
  issueDetected: boolean;
  detectorDefinition: IDetectorDefinition;
  metrics: IMetricSet[];
  abnormalTimePeriods: IDetectorAbnormalTimePeriod[];
  data: INameValuePair[][];
  responseMetaData: IDetectorMetaData;
}

export interface IMetricSet {
  name: string;
  unit: string;
  startTime: string;
  endTime: string;
  timeGrain: string;
  values: IMetricSample[];
}

export interface IMetricSample {
  timestamp: string;
  roleInstance: string;
  total: number;
  maximum: number;
  minimum: number;
  isAggregated: boolean;
}

export interface IDetectorAbnormalTimePeriod {
  startTime: string;
  endTime: string;
  message: string;
  source: string;
  priority: number;
  metaData: INameValuePair[][];
  type: IssueType;
  solutions: ISolution[];
}

export interface IDetectorMetaData {
  dataSource: IDataSource;
}

export interface IDataSource {
  instructions: string[];
  dataSourceUri: INameValuePair[][];
}
