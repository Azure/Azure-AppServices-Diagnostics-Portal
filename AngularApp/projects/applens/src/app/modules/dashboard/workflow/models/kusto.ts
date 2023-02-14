import { DataTableResponseColumn, workflowNodeData, stepVariable } from "diagnostic-data";
import { NgFlowchartStepComponent } from "projects/ng-flowchart/dist";

export class kustoQueryDialogParams {
  queryLabel: string;
  queryText: string;
  variables: stepVariable[];
  kustoQueryColumns: DataTableResponseColumn[];
  completionOptions: stepVariable[] = [];
  currentNode: NgFlowchartStepComponent<workflowNodeData>;
}

export interface dynamicExpressionBody {
  WorkflowId: string;
  Text: string;
  OperationName: string;
  Variables: any;
  IsKustoQuery: boolean;
}

export interface dynamicExpressionResponse {
  response: string;
  kustoQueryText: string;
  kustoQueryUrl: string;
  kustoDesktopUrl: string;
}