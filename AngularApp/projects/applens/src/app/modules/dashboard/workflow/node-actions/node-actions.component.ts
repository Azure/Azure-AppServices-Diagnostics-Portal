import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { nodeType } from "projects/diagnostic-data/src/lib/models/workflow";
import { WorkflowService } from '../services/workflow.service';

export class newNodeProperties {
  nodeType: nodeType;
  isParallel: boolean;
}

@Component({
  selector: 'node-actions',
  templateUrl: './node-actions.component.html',
  styleUrls: ['./node-actions.component.scss']
})
export class NodeActionsComponent implements OnInit {

  @Input() isConditionNode: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() isRootNode: boolean = false;
  @Input() isSwitchCase: boolean = false;

  @Output() onNodeAdded = new EventEmitter<newNodeProperties>();
  @Output() onConditionAdded = new EventEmitter<string>();
  @Output() onSwitchCaseAdded = new EventEmitter<boolean>();
  @Output() onDeleted = new EventEmitter<boolean>();

  nodeType = nodeType;
  constructor(private _workflowService: WorkflowService) {
  }

  ngOnInit(): void {
  }

  addNode(inputNodeType: nodeType, isParallel: boolean) {
    let newNode = new newNodeProperties();
    newNode.isParallel = isParallel;
    newNode.nodeType = inputNodeType;
    this.onNodeAdded.emit(newNode);
  }

  addCondition(conditionType: string) {
    this.onConditionAdded.emit(conditionType);
  }

  addSwitchCase() {
    this.onSwitchCaseAdded.emit(true);
  }

  deleteNode() {
    this.onDeleted.emit(true);
  }

}
