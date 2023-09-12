import { Component, OnInit } from '@angular/core';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'condition-iffalse-step',
  templateUrl: './condition-iffalse-step.component.html',
  styleUrls: ['./condition-iffalse-step.component.scss', '../node-styles.scss']
})
export class ConditionIffalseStepComponent extends WorkflowNodeBaseClass implements OnInit {

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
    this.data.title = "If false";
  }
}
