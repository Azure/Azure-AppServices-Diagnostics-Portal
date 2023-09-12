import { newNodeProperties } from "./node-actions/node-actions.component";
import { WorkflowService } from "./services/workflow.service";
import { NgFlowchart, NgFlowchartStepComponent } from "projects/ng-flowchart/dist";
import { nodeType, stepVariable, workflowNodeData } from "projects/diagnostic-data/src/lib/models/workflow";
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";

@Component({
    template: ''
})
export default class WorkflowNodeBaseClass extends NgFlowchartStepComponent<workflowNodeData> implements AfterViewInit, OnDestroy {
    constructor(private _workflowService: WorkflowService) {
        super();
        this.setupResizeObserver();
    }

    variables: stepVariable[] = [];
    nodeType = nodeType;
    collapsed: boolean = true;
    resizeObserver: ResizeObserver;

    @ViewChild('nodeBodyDiv') nodeBodyDiv: ElementRef;

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

        if (conditionType === 'foreach' && this._workflowService.getVariableCompletionOptions(this).filter(x => x.type === 'Array').length === 0) {
            this._workflowService.showMessageBox("Error", "You cannot add Foreach node because you have not added any variable of type array. Please first add a variable of type Array and then add a foreach node.");
            return;
        }

        switch (conditionType) {
            case 'switch':
                this._workflowService.addSwitchCondition(this);
                break;
            case 'ifelse':
                this._workflowService.addCondition(this);
                break;
            case 'foreach':
                this._workflowService.addForEach(this);
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
        let currentNodeType = this.type;
        let destinationNodeType = dropEvent.step.type;

        if (this._workflowService.nodeTypesAllowedForDragDrop.indexOf(currentNodeType) === -1
            && (this._workflowService.nodeTypesAllowedForDrag.indexOf(this.type) === -1
                || dropEvent.position !== 'BELOW')) {
            return false;
        }

        if (this._workflowService.nodeTypesAllowedForDragDrop.indexOf(destinationNodeType) > -1
            || (dropEvent.position === 'BELOW' && this._workflowService.nodeTypesAllowedForDropBelow.indexOf(destinationNodeType) > -1)) {
            return true;
        }

        return false;
    }


    ngOnDestroy(): void {
        if (this.resizeObserver != null) {
            this.resizeObserver.disconnect();
        }
    }

    ngAfterViewInit(): void {
        super.ngAfterViewInit();

        if (this.nodeBodyDiv != null && this.nodeBodyDiv.nativeElement != null) {
            this.resizeObserver.observe(this.nodeBodyDiv.nativeElement);
        }
    }

    onCollapseChange(event: boolean) {
        this.collapsed = event;
    }

    setupResizeObserver() {
        this.resizeObserver = new ResizeObserver(entries => {
            this.canvas.reRender(true);
            this.induceCanvasScroll();
        });
    }

    //
    // No clue why this is needed, but without it, the canvas re-rendering doesn't reposition the
    // draw arrows quickly and there is a huge delay. If we just induce a change in scorll, the
    // arrows reposition immediately.
    //

    induceCanvasScroll() {
        let nativeElement = this.canvas.viewContainer.element.nativeElement;
        nativeElement.scrollWidth = nativeElement.scrollWidth + 1;
    }
}