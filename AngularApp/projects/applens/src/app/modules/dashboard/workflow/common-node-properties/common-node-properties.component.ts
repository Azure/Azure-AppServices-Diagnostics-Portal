import { Component, Input, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { EditorInstance, EditorOption } from 'angular-markdown-editor';
import { MarkdownService } from 'ngx-markdown';
import { MarkdownQueryDialogComponent } from '../markdown-query-dialog/markdown-query-dialog.component';
import { markdownDialogParams } from '../models/markdown';
import { nodeStatus, promptType } from "projects/diagnostic-data/src/lib/models/workflow";

@Component({
  selector: 'common-node-properties',
  templateUrl: './common-node-properties.component.html',
  styleUrls: ['./common-node-properties.component.scss']
})
export class CommonNodePropertiesComponent implements OnInit {

  promptTypes: string[] = Object.keys(promptType);
  nodeStatuses: string[] = Object.keys(nodeStatus);
  uniqueId: string;
  editorOptions: EditorOption;
  bsEditorInstance: EditorInstance;

  @Input() showMarkdown: boolean = true;
  @Input() data: any;
  @Input() readonly: boolean = false;

  constructor(private _markdownService: MarkdownService, private matDialog: MatDialog) {
    this.uniqueId = Date.now().toString();
  }

  ngOnInit(): void {

    this.editorOptions = {
      autofocus: false,
      iconlibrary: 'fa',
      savable: false,
      onShow: (e) => this.bsEditorInstance = e,
      parser: (val) => this.parse(val)
    };
  }

  parse(inputValue: string) {
    const markedOutput = this._markdownService.compile(inputValue.trim());
    return markedOutput;
  }

  configureMarkdown() {
    const dialogConfig = this.getNewMatDialogConfig();
    let dialogParams: markdownDialogParams = new markdownDialogParams();
    dialogParams.input = this.data.markdownText;
    dialogParams.variables = this.data.variables;
    dialogParams.completionOptions = this.data.completionOptions;

    dialogConfig.data = dialogParams;
    this.matDialog.open(MarkdownQueryDialogComponent, dialogConfig).afterClosed().subscribe(modelData => {
      if (modelData != null) {
        this.data.markdownText = modelData;
      }
    });
  }

  configureStatus() {
    const dialogConfig = this.getNewMatDialogConfig();
    let dialogParams: markdownDialogParams = new markdownDialogParams();
    dialogParams.input = this.data.status;
    dialogParams.variables = this.data.variables;
    dialogParams.completionOptions = this.data.completionOptions;
    dialogParams.evaluateStatus = true;

    dialogConfig.data = dialogParams;
    this.matDialog.open(MarkdownQueryDialogComponent, dialogConfig).afterClosed().subscribe(modelData => {
      if (modelData != null) {
        this.data.status = modelData;
      }
    });
  }

  getNewMatDialogConfig(): MatDialogConfig {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 30px)";
    dialogConfig.maxWidth = "100%";
    dialogConfig.maxHeight = "100%";
    dialogConfig.disableClose = true;
    dialogConfig.panelClass = "matDialogClass";
    return dialogConfig;
  }

}
