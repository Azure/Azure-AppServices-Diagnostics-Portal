import { stepVariable } from "projects/diagnostic-data/src/lib/models/workflow";

export class markdownDialogParams {
  queryLabel: string;
  input: string;
  variables: stepVariable[];
  completionOptions: stepVariable[] = [];
  evaluateStatus: boolean = false;
}