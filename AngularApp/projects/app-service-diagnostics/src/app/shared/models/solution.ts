import { SolutionType } from './enumerations';
import { INameValuePair } from './namevaluepair';
import { SolutionTypeTag } from 'diagnostic-data';

export interface ISolution {
  id: number;
  displayName: string;
  order: number;
  description: string;
  type: SolutionType;
  data: INameValuePair[][];
  metadata: INameValuePair[][];
}

export interface SolutionData {
  title: string;
  tags: SolutionTypeTag[];
  solution: ISolution;
}
