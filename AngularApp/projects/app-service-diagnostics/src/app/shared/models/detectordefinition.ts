import { AnalysisType, ResourceTypes } from './enumerations';

export interface IDetectorDefinition {
  name: string;
  displayName: string;
  description: string;
  rank: number;
  isEnabled: boolean;
  isPublic: boolean;
  analysisTypes: AnalysisType;
  resourceTypes: ResourceTypes;
}
