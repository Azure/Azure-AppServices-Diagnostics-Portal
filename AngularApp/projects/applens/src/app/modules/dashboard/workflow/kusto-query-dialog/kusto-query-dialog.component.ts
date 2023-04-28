import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DataTableResponseColumn, DetectorControlService, stepVariable, workflowNode, workflow, workflowNodeData } from 'diagnostic-data';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { CanvasFlow } from 'projects/ng-flowchart/dist/lib/ng-flowchart-canvas.service';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { dynamicExpressionResponse, kustoQueryDialogParams } from '../models/kusto';
import { dynamicExpressionBody } from '../models/kusto';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'kusto-query-dialog',
  templateUrl: './kusto-query-dialog.component.html',
  styleUrls: ['./kusto-query-dialog.component.scss']
})

export class KustoQueryDialogComponent implements OnInit {

  // More editor options at https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
  editorOptions = { theme: 'vs-dark', language: 'csharp', minimap: { enabled: false } };
  code: string = '';
  kustoQueryColumns: DataTableResponseColumn[] = [];
  dataSource: any[] = [];
  variables: stepVariable[] = [];
  variablesInMemoryCopy: stepVariable[] = [];
  isExecutingQuery: boolean = false;
  error: string = '';
  kustoQueryLabel: string = '';
  variablesChanged: boolean = false;
  inputKustoQueryDialogParams: kustoQueryDialogParams;
  flow: CanvasFlow = null;
  currentNode: NgFlowchartStepComponent<workflowNodeData>;
  kustoQueryUrl: string = '';
  kustoDesktopUrl: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) data: kustoQueryDialogParams, public dialogRef: MatDialogRef<KustoQueryDialogComponent>,
    private _diagnosticService: ApplensDiagnosticService, private _detectorControlService: DetectorControlService,
    private _workflowService: WorkflowService) {
    this.inputKustoQueryDialogParams = data;
    this.code = '$@"' + data.queryText + '"';
    if (data.queryLabel) {
      this.kustoQueryLabel = data.queryLabel;
    }

    this.variables = data.variables;
    this.variablesInMemoryCopy = JSON.parse(JSON.stringify(data.variables));
    this.currentNode = data.currentNode;
  }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    if (!this._workflowService.isUniqueNodeName(this.kustoQueryLabel, this.currentNode)) {
      this._workflowService.showMessageBox("Error", `Please choose a unique name for the node. The current name ${this.kustoQueryLabel} is already in use.`);
      return;
    }

    if (!this._workflowService.isValidVariableName(this.kustoQueryLabel)) {
      this._workflowService.showMessageBox("Error", "Please choose a valid label for the node. The Kusto query label name cannot contain spaces or special characters and should follow valid C# variable naming conventions.");
      return;
    }

    if (!this.code.startsWith('$@"') || !this.code.endsWith('"')) {
      this._workflowService.showMessageBox("Error", "Invalid query text. The query text should start with $@ and end with a double quote");
      return;
    }

    let dialogResult: kustoQueryDialogParams = {
      queryText: this.encodeString(this.getQueryText()),
      variables: this.variablesInMemoryCopy,
      queryLabel: this.kustoQueryLabel,
      kustoQueryColumns: this.kustoQueryColumns,
      completionOptions: this.inputKustoQueryDialogParams.completionOptions,
      currentNode: null,
      addQueryOutputToMarkdown: this.inputKustoQueryDialogParams.addQueryOutputToMarkdown,
    };

    this.dialogRef.close(dialogResult);
  }

  executeQuery() {

    if (!this.code.startsWith('$@"') || !this.code.endsWith('"')) {
      this._workflowService.showMessageBox("Error", "Invalid query text. The query text should start with $@ and end with a double quote");
      return;
    }

    let dynamicExpression: dynamicExpressionBody = {
      WorkflowId: 'Workflow1',
      OperationName: this.kustoQueryLabel,
      Text: this.getQueryText(),
      Variables: this.inputKustoQueryDialogParams.completionOptions,
      IsKustoQuery: true
    };

    this.error = '';
    this.isExecutingQuery = true;
    this._diagnosticService.evaluateDynamicExpression(dynamicExpression, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe(dynamicResponse => {
      this.isExecutingQuery = false;
      this.kustoQueryColumns = [];

      let resp: any;
      if (dynamicResponse.columns) {
        resp = dynamicResponse;
      } else {
        let response: dynamicExpressionResponse = dynamicResponse
        resp = response.response;
        this.kustoQueryUrl = response.kustoQueryUrl;
        this.kustoDesktopUrl = response.kustoDesktopUrl;
      }

      resp.columns.forEach(entry => {
        this.kustoQueryColumns.push(entry);
      })

      this.dataSource = [];
      for (var i = 0; i < resp.rows.length; i++) {
        let obj = {};
        for (var j = 0; j < resp.rows[i].length; j++) {
          obj[this.kustoQueryColumns[j].columnName] = resp.rows[i][j];
        }
        this.dataSource.push(obj);
      }

    }, error => {
      this.isExecutingQuery = false;
      if (error.error) {
        this.error = error.error;
      } else {
        this.error = JSON.stringify(error);
      }
    });
  }

  clickCell(rowIndex: number, col: DataTableResponseColumn, element: any) {
    let value = "this.rows[" + rowIndex + "]['" + col.columnName + "']";
    let name = this.kustoQueryLabel + '_Row' + rowIndex + '_' + col.columnName;

    const newVariableArray: stepVariable[] = [];
    this.variablesInMemoryCopy.forEach(element => {
      newVariableArray.push(element);
    })

    if (newVariableArray.findIndex(x => x.name === name) === -1) {
      newVariableArray.push({
        name: name,
        value: value,
        type: col.dataType,
        runtimeValue: element[col.columnName],
        isUserInput: false
      });
    }

    this.variablesInMemoryCopy = [...newVariableArray]; // refresh the dataSource
  }

  getColumnNames(kustoQueryColumns: DataTableResponseColumn[]): string[] {
    let colNames: string[] = [];
    kustoQueryColumns.forEach(col => {
      colNames.push(col.columnName);
    });

    return colNames;
  }

  encodeString(input: string): string {
    return btoa(input);
  }

  updateVariables(variables: stepVariable[]) {
    this.variablesInMemoryCopy = variables;
    if (this.variables.length != this.variablesInMemoryCopy.length) {
      this.variablesChanged = true;
      return;
    }

    this.variablesChanged = JSON.stringify(this.variables) === JSON.stringify(this.variablesInMemoryCopy);
  }

  getKustoSampleUsage(variable: stepVariable): string {
    return this._workflowService.getKustoSampleUsage(variable);
  }

  getQueryText(): string {
    let code = this.code.substring(3);
    code = code.substring(0, code.length - 1);
    return code;
  }

}
