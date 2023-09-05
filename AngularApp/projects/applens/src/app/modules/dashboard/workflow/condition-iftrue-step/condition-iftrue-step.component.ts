import { Component, OnInit } from '@angular/core';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'condition-iftrue-step',
  templateUrl: './condition-iftrue-step.component.html',
  styleUrls: ['./condition-iftrue-step.component.scss', '../node-styles.scss']
})
export class ConditionIftrueStepComponent extends WorkflowNodeBaseClass implements OnInit {

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
    this.data.title = "If true";
  }

}
