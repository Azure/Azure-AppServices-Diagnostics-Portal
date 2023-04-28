import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { workflowPublishBody } from 'diagnostic-data';


@Component({
  selector: 'workflow-run-dialog',
  templateUrl: './workflow-run-dialog.component.html',
  styleUrls: ['./workflow-run-dialog.component.scss']
})
export class WorkflowRunDialogComponent implements OnInit {

  workflowId: string;
  workflowPublishBody: workflowPublishBody;
  error: any = null;
  pkg: any = null;

  constructor(@Inject(MAT_DIALOG_DATA) data: any, public dialogRef: MatDialogRef<WorkflowRunDialogComponent>) {
    this.workflowId = data.workflowId;
    this.workflowPublishBody = data.workflowPublishBody
  }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close(null);
  }

  save() {
    this.dialogRef.close({ workflowSucceeded: true, workflowPackage: this.pkg });
  }

  onError(error: any) {
    this.error = error;
  }

  onPackageUpdated(pkg: any) {
    this.pkg = pkg;
  }

}
