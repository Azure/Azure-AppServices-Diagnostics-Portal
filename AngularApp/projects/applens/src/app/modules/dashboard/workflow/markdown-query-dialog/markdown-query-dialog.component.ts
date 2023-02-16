import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { EditorInstance, EditorOption } from 'angular-markdown-editor';
import { DetectorControlService, stepVariable } from 'diagnostic-data';
import { MarkdownService } from 'ngx-markdown';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { dynamicExpressionBody } from '../models/kusto';
import { markdownDialogParams } from '../models/markdown';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'markdown-query-dialog',
  templateUrl: './markdown-query-dialog.component.html',
  styleUrls: ['./markdown-query-dialog.component.scss']
})

export class MarkdownQueryDialogComponent implements OnInit {

  evaluateStatus: boolean = false;
  input: string = '';
  output: string = '';
  error: any;
  isExecuting: boolean = false;
  inputParams: markdownDialogParams;
  editorOptions: EditorOption;
  bsEditorInstance: EditorInstance;
  uniqueId: string;
  defaultMarkdownText: string = "**Sample Text** to be used as markdown. Use any custom `variables` available in variables section";
  chooseStatusType: string = 'fixed';
  statuses: string[] = ['Critical', 'Warning', 'Success', 'Info'];
  statusValue: string = 'Info';
  statusExpression: string = "Your_Availability_Variable < 98 ? \"Critical\" : \"Success\"";

  constructor(@Inject(MAT_DIALOG_DATA) data: markdownDialogParams, public dialogRef: MatDialogRef<MarkdownQueryDialogComponent>,
    private _diagnosticService: ApplensDiagnosticService, private _detectorControlService: DetectorControlService,
    private _workflowService: WorkflowService, private _markdownService: MarkdownService) {
    this.inputParams = data;
    this.uniqueId = Date.now().toString(36);
    this.evaluateStatus = data.evaluateStatus;
    this.input = data.input;
  }

  ngOnInit(): void {
    this.editorOptions = {
      autofocus: false,
      iconlibrary: 'fa',
      savable: false,
      onShow: (e) => this.bsEditorInstance = e,
      parser: (val) => this.parse(val)
    };

    if (this.input.length === 0) {
      if (this.evaluateStatus) {
        this.chooseStatusType = 'fixed';
      } else {
        this.input = this.defaultMarkdownText;
      }
    } else {
      if (this.evaluateStatus) {
        if (this.input.startsWith('{(') && this.input.endsWith(')}')) {
          this.chooseStatusType = 'dynamic';
          this.statusExpression = this.input.substring(2, this.input.length - 2);
        } else {
          this.chooseStatusType = 'fixed';
          this.statusValue = this.input;
        }
      }
    }
  }

  evaluateExpression() {
    let status = this.evaluateStatus && this.chooseStatusType === 'dynamic' ? "{(" + this.statusExpression + ")}" : '';

    let dynamicExpression: dynamicExpressionBody = {
      WorkflowId: 'Workflow1',
      OperationName: '',
      Text: this.evaluateStatus ? status : this.input,
      Variables: this.inputParams.completionOptions.concat(this.inputParams.variables),
      IsKustoQuery: false
    };

    this.error = '';
    this.isExecuting = true;
    this._diagnosticService.evaluateDynamicExpression(dynamicExpression, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe(dynamicResponse => {
      this.isExecuting = false;
      let resp = dynamicResponse.response ? dynamicResponse.response : dynamicResponse;
      this.output = this.evaluateStatus ? resp : this.parse(resp);
    }, error => {
      this.isExecuting = false;
      if (error.error) {
        this.error = error.error;
      } else {
        this.error = JSON.stringify(error);
      }
    });
  }

  parse(inputValue: string) {
    const markedOutput = this._markdownService.compile(inputValue.trim());
    return markedOutput;
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.evaluateStatus) {
      let status = this.chooseStatusType === 'fixed' ? this.statusValue : "{(" + this.statusExpression + ")}";
      this.dialogRef.close(status);
    } else {
      this.dialogRef.close(this.input);
    }
  }

  changeStatus(event: any) {
    this.output = event.target.value;
    this.statusValue = event.target.value;
  }

  changeStatusKind(event: any) {
    this.output = event.target.value === 'fixed' ? this.statusValue : "";
  }

  getExpression(variable: stepVariable): string {
    return this._workflowService.getStatusUsage(variable);
  }
}
