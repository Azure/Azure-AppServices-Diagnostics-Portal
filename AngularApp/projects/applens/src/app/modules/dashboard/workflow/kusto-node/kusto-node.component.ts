import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { kustoNode, promptType, stepVariable, workflowNodeData } from 'projects/diagnostic-data/src/lib/models/workflow';
import { NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';
import { ConfigureVariablesComponent } from '../configure-variables/configure-variables.component';
import { KustoQueryDialogComponent } from '../kusto-query-dialog/kusto-query-dialog.component';
import { kustoQueryDialogParams } from '../models/kusto';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';
import { ResourceService } from '../../../../shared/services/resource.service';
import { DetectorGistApiService } from '../../../../shared/services/detectorgist-template-api.service';

@Component({
  selector: 'kusto-node',
  templateUrl: './kusto-node.component.html',
  styleUrls: ['./kusto-node.component.scss', '../node-styles.scss']
})
export class KustoNodeComponent extends WorkflowNodeBaseClass implements OnInit {

  @Input() data: workflowNodeData;

  defaultQueryText: string = "cluster('<CLUSTER>').database('<DATABASE>').<TABLE>\n| where { Utilities.TimeFilterQuery(cxt.StartTime, cxt.EndTime, \"PreciseTimeStamp\") }\n| take 5";
  promptTypes: string[] = [promptType.automatic, promptType.onClick];

  constructor(private _workflowServicePrivate: WorkflowService, private matDialog: MatDialog,
    private resourceService: ResourceService, private detectorGistApiService: DetectorGistApiService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
    let templateFileName = "WorkflowKustoNode_" + this.resourceService.templateFileName;
    this.detectorGistApiService.getTemplateWithExtension(templateFileName, "txt").subscribe(resp => {
      this.defaultQueryText = resp;
    });
  }

  configureKustoQuery() {
    const dialogConfig = this.getNewMatDialogConfig();
    let dialogParams: kustoQueryDialogParams = new kustoQueryDialogParams();
    let queryText = this._workflowServicePrivate.getQueryText(this.data);
    dialogParams.queryText = queryText !== '' ? this._workflowServicePrivate.decodeBase64String(queryText) : this.defaultQueryText;
    dialogParams.queryLabel = this.data.name;
    dialogParams.variables = this.data.variables;
    dialogParams.kustoQueryColumns = this.data.kustoQueryColumns;
    dialogParams.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this, false);
    dialogParams.currentNode = this.getCurrentNode();
    if (this.data.kustoNode && this.data.kustoNode.addQueryOutputToMarkdown){
      dialogParams.addQueryOutputToMarkdown = true;
    }

    dialogConfig.data = dialogParams;
    this.matDialog.open(KustoQueryDialogComponent, dialogConfig).afterClosed().subscribe(modelData => {
      if (modelData != null) {
        this.variables = modelData.variables;
        this.data.name = modelData.queryLabel;
        this.data.kustoNode = new kustoNode();
        this.data.kustoNode.queryText = modelData.queryText;
        this.data.kustoNode.addQueryOutputToMarkdown = modelData.addQueryOutputToMarkdown
        this.data.variables = this.variables;
        this.data.kustoQueryColumns = modelData.kustoQueryColumns;
        this._workflowServicePrivate.emitVariablesChange(true);
        if (this.data.title === this._workflowServicePrivate.titleKustoNode) {
          this.data.title = this.data.name;
        }
      }
    });
  }

  getCurrentNode(): NgFlowchartStepComponent<workflowNodeData> {
    let idx = this.canvas.flow.steps.findIndex(x => x.id == this.id);
    if (idx > -1) {
      return this.canvas.flow.steps[idx];
    }
  }

  configureVariables() {
    const dialogConfig = this.getNewMatDialogConfig();
    let existingVariables = this.getVariables();
    dialogConfig.data = existingVariables;

    this.matDialog.open(ConfigureVariablesComponent, dialogConfig).afterClosed().subscribe(modelData => {
    });

  }

  getVariables(): stepVariable[] {
    let stepVars: stepVariable[] = [];
    let currentNode: NgFlowchartStepComponent<workflowNodeData> = this;
    while (currentNode != null) {
      if (this._workflowServicePrivate.isActionNode(currentNode)) {
        currentNode.data.variables.forEach(v => {
          stepVars.push(v);
        })
      }
      currentNode = currentNode.parent;
    }
    return stepVars;
  }

  getNewMatDialogConfig(): MatDialogConfig {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.height = "calc(100% - 150px)";
    dialogConfig.width = "calc(100% - 30px)";
    dialogConfig.maxWidth = "100%";
    dialogConfig.maxHeight = "100%";
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = "matDialogClass";
    return dialogConfig;
  }

  getQueryText(queryText: string) {
    if (!queryText) {
      return '(Specify query by clicking the "Configure Kusto Query" button)';
    }
    let queryTextPlain = this._workflowServicePrivate.decodeBase64String(queryText);
    return queryTextPlain.length > 100 ? queryTextPlain.substring(0, 90) + '...' : queryTextPlain;
  }

}
