import { Component, OnInit } from '@angular/core';
import WorkflowNodeBaseClass from '../node-base-class';
import { WorkflowService } from '../services/workflow.service';

@Component({
  selector: 'switch-case-default-step',
  templateUrl: './switch-case-default-step.component.html',
  styleUrls: ['./switch-case-default-step.component.scss', '../node-styles.scss']
})
export class SwitchCaseDefaultStepComponent extends WorkflowNodeBaseClass implements OnInit {

  constructor(private _workflowServicePrivate: WorkflowService) {
    super(_workflowServicePrivate);

  }

  ngOnInit(): void {
  }
}
