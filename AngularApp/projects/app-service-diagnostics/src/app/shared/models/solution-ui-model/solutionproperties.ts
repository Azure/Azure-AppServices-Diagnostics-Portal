import { INameValuePair } from '../namevaluepair';
import {
  SolutionType,
  ActionType,
  SolutionStatus,
  ActionStatus
} from '../enumerations';

export class SolutionProperties {
  id: number;
  title: string;
  description: string;
  status: SolutionStatus;
  type: SolutionType;
  actionType: ActionType;
  actionText: string;
  subActions: SubAction[];
  additionalData: SolutionMetadata[];
  warning: string;

  constructor() {
    this.status = SolutionStatus.NotStarted;
    this.subActions = [];
    this.additionalData = [];
  }
}

export class SubAction {
  title: string;
  status: ActionStatus;
  parameter: INameValuePair[];

  constructor() {
    this.status = ActionStatus.NotStarted;
  }
}

export class SolutionMetadata {
  type: string;
  message: string;
  og_Url: string;
  og_Title: string;
  og_Description: string;
  og_ImageUrl: string;
}
