import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MarkdownService } from 'ngx-markdown';
import { MarkdownQueryDialogComponent } from '../markdown-query-dialog/markdown-query-dialog.component';
import { markdownDialogParams } from '../models/markdown';
import { workflowNodeData } from "projects/diagnostic-data/src/lib/models/workflow";
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'markdown-node',
  templateUrl: './markdown-node.component.html',
  styleUrls: ['./markdown-node.component.scss', '../node-styles.scss']
})
export class MarkdownNodeComponent extends WorkflowNodeBaseClass implements OnInit {

  @Input() data: workflowNodeData;

  constructor(private _workflowServicePrivate: WorkflowService, private _markdownService: MarkdownService, private matDialog: MatDialog) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
  }

  configureMarkdown() {

    const dialogConfig = this.getNewMatDialogConfig();
    let dialogParams: markdownDialogParams = new markdownDialogParams();
    dialogParams.input = this.data.markdownText;
    dialogParams.variables = this.data.variables;
    dialogParams.completionOptions = this._workflowServicePrivate.getVariableCompletionOptions(this);

    dialogConfig.data = dialogParams;
    this.matDialog.open(MarkdownQueryDialogComponent, dialogConfig).afterClosed().subscribe(modelData => {
      if (modelData != null) {
        this.data.markdownText = modelData;
      }
    });
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

}
