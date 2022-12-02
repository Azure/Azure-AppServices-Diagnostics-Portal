import { IDetectorDefinition } from './detectordefinition';
import {
  IDetectorAbnormalTimePeriod,
  IDetectorMetaData,
  IMetricSet
} from './detectorresponse';
import { INameValuePair } from './namevaluepair';
import { ISolution } from './solution';

export interface IAppAnalysisResponse {
  startTime: string;
  endTime: string;
  abnormalTimePeriods: IAbnormalTimePeriod[];
  payload: IAnalysisData[];
  nonCorrelatedDetectors: IDetectorDefinition[];
}

export interface IAbnormalTimePeriod {
  startTime: string;
  endTime: string;
  events: IDetectorAbnormalTimePeriod[];
  solutions: ISolution[];
}

export interface IAnalysisData {
  source: string;
  detectorDefinition: IDetectorDefinition;
  metrics: IMetricSet[];
  data: INameValuePair[][];
  detectorMetaData: IDetectorMetaData;
}
