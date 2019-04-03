import { SolutionTypeTag } from '../../models/solution-type-tag';

export class Solution {
  Name: string;
  Title: string;
  DescriptionMarkdown: string;
  Action: ActionType;
  ApiOptions: ArmApiOptions;
  BladeOptions: GoToBladeOptions;
  TabOptions: OpenTabOptions;
  OverrideOptions: {};
  RequiresConfirmation: boolean;
  ResourceUri: string;
  InternalMarkdown: string;
  TypeTag: SolutionTypeTag;
  IsInternal: boolean;
  DetectorId: string;
}

export enum ActionType {
  ArmApi = 'ArmApi',
  OpenTab = 'OpenTab',
  GoToBlade = 'GoToBlade'
}

export class ArmApiOptions {
  Route: string;
  Verb: string;
}

export class OpenTabOptions {
  TabUrl: string;
}

export class GoToBladeOptions {
  DetailBlade: string;
  DetailBladeInputs: any;
  Extension?: string;
}
