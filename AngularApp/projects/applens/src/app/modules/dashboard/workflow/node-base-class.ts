import { newNodeProperties } from "./node-actions/node-actions.component";
import { WorkflowService } from "./services/workflow.service";
import { NgFlowchart, NgFlowchartStepComponent } from "projects/ng-flowchart/dist";
import { nodeType, stepVariable, workflowNodeData } from "projects/diagnostic-data/src/lib/models/workflow";

export class WorkflowNodeBaseClass extends NgFlowchartStepComponent<workflowNodeData> {
    constructor(private _workflowService: WorkflowService) {
        super();
    }

    variables: stepVariable[] = [];
    nodeType = nodeType;

    deleteNode() {
        this._workflowService.onDelete(this);
    }

    isDisabled() {
        return this._workflowService.isDisabled(this);
    }

    isRootNode() {
        return this._workflowService.isRootNode(this);
    }

    addNode(newNodeProperties: newNodeProperties) {
        this._workflowService.addNode(this, newNodeProperties);
    }

    addChildNode(nodeType: nodeType) {
        this._workflowService.addChildNode(this, nodeType);
    }

    addCondition(conditionType: string) {
        if (this._workflowService.getVariableCompletionOptions(this).length === 0) {
            this._workflowService.showMessageBox("Error", "You cannot add any conditions because you have not added any variables yet. Please add some variables first and then add conditions.");
            return;
        }

        switch (conditionType) {
            case 'switch':
                this._workflowService.addSwitchCondition(this);
                break;
            case 'ifelse':
                this._workflowService.addCondition(this);
                break;
            default:
                break;
        }

    }

    addSwitchCase() {
        if (this._workflowService.getVariableCompletionOptions(this).length === 0) {
            this._workflowService.showMessageBox("Error", "You cannot add any conditions because you have not added any variables yet. Please add some variables first and then add conditions.");
            return;
        }

        this._workflowService.addSwitchCase(this);
    }

    canDrop(dropEvent: NgFlowchart.DropTarget): boolean {
        
        //
        // Allow drop only if the current node is in the allowed list
        //

        if (this._workflowService.allowedDropNodeTypes.indexOf(this.type) === -1) {
            return false;
        }

        //
        // Allow drop only if the destination node is in the allowed list
        //

        return this._workflowService.allowedDropNodeTypes.indexOf(dropEvent.step.type) > -1;
    }
}