import { Component, ComponentRef, ElementRef, EventEmitter, HostListener, Input, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { CONSTANTS } from '../model/flowchart.constants';
import { NgFlowchartArrowComponent } from '../ng-flowchart-arrow/ng-flowchart-arrow.component';
import { NgFlowchartCanvasService } from '../ng-flowchart-canvas.service';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
export class NgFlowchartStepComponent {
    constructor() {
        this.viewInit = new EventEmitter();
        this._currentPosition = [0, 0];
        this._isHidden = false;
        this._children = [];
    }
    onMoveStart(event) {
        if (this.canvas.disabled) {
            return;
        }
        this.hideTree();
        event.dataTransfer.setData('type', 'FROM_CANVAS');
        event.dataTransfer.setData('id', this.nativeElement.id);
        this.drop.dragStep = {
            type: this.type,
            data: this.data,
            instance: this
        };
    }
    onMoveEnd(event) {
        this.showTree();
    }
    init(drop, viewContainer, compFactory) {
        this.drop = drop;
        this.viewContainer = viewContainer;
        this.compFactory = compFactory;
    }
    canDeleteStep() {
        return true;
    }
    canDrop(dropEvent, error) {
        return true;
    }
    shouldEvalDropHover(coords, stepToDrop) {
        return true;
    }
    async onUpload(data) { }
    getDropPositionsForStep(step) {
        return ['BELOW', 'LEFT', 'RIGHT', 'ABOVE'];
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        if (!this.nativeElement) {
            throw 'Missing canvasContent ViewChild. Be sure to add #canvasContent to your root html element.';
        }
        this.nativeElement.classList.add('ngflowchart-step-wrapper');
        this.nativeElement.setAttribute('draggable', 'true');
        if (this._initPosition) {
            this.zsetPosition(this._initPosition);
        }
        //force id creation if not already there
        this.nativeElement.id = this.id;
        this.viewInit.emit();
    }
    get id() {
        if (this._id == null) {
            this._id = 's' + Date.now();
        }
        return this._id;
    }
    get currentPosition() {
        return this._currentPosition;
    }
    /**
     * Creates and adds a child to this step
     * @param template The template or component type to create
     * @param options Add options
     */
    async addChild(pending, options) {
        let componentRef = await this.canvas.createStep(pending);
        this.canvas.addToCanvas(componentRef);
        if (options?.sibling) {
            this.zaddChildSibling0(componentRef.instance, options?.index);
        }
        else {
            this.zaddChild0(componentRef.instance);
        }
        this.canvas.flow.addStep(componentRef.instance);
        this.canvas.reRender();
        return componentRef.instance;
    }
    /**
     * Destroys this step component and updates all necessary child and parent relationships
     * @param recursive
     * @param checkCallbacks
     */
    destroy(recursive = true, checkCallbacks = true) {
        if (!checkCallbacks || this.canDeleteStep()) {
            this.canvas.options.callbacks.beforeDeleteStep &&
                this.canvas.options.callbacks.beforeDeleteStep(this);
            let parentIndex;
            if (this._parent) {
                parentIndex = this._parent.removeChild(this);
            }
            this.destroy0(parentIndex, recursive);
            this.canvas.reRender();
            this.canvas.options.callbacks.afterDeleteStep &&
                this.canvas.options.callbacks.afterDeleteStep(this);
            return true;
        }
        return false;
    }
    /**
     * Remove a child from this step. Returns the index at which the child was found or -1 if not found.
     * @param childToRemove Step component to remove
     */
    removeChild(childToRemove) {
        if (!this.children) {
            return -1;
        }
        const i = this.children.findIndex(child => child.id == childToRemove.id);
        if (i > -1) {
            this.children.splice(i, 1);
        }
        return i;
    }
    /**
     * Re-parent this step
     * @param newParent The new parent for this step
     * @param force Force the re-parent if a parent already exists
     */
    setParent(newParent, force = false) {
        if (this.parent && !force) {
            console.warn('This child already has a parent, use force if you know what you are doing');
            return;
        }
        this._parent = newParent;
        if (!this._parent && this.arrow) {
            this.arrow.destroy();
            this.arrow = null;
        }
    }
    /**
     * Called when no longer trying to drop or move a step adjacent to this one
     * @param position Position to render the icon
     */
    clearHoverIcons() {
        this.nativeElement.removeAttribute(CONSTANTS.DROP_HOVER_ATTR);
    }
    /**
     * Called when a step is trying to be dropped or moved adjacent to this step.
     * @param position Position to render the icon
     */
    showHoverIcon(position) {
        this.nativeElement.setAttribute(CONSTANTS.DROP_HOVER_ATTR, position.toLowerCase());
    }
    /**
     * Is this the root element of the tree
     */
    isRootElement() {
        return !this.parent;
    }
    /**
     * Does this step have any children?
     * @param count Optional count of children to check. Defaults to 1. I.E has at least 1 child.
     */
    hasChildren(count = 1) {
        return this.children && this.children.length >= count;
    }
    /** Array of children steps for this step */
    get children() {
        return this._children;
    }
    /** The parent step of this step */
    get parent() {
        return this._parent;
    }
    /**
     * Returns the total width extent (in pixels) of this node tree
     * @param stepGap The current step gap for the flow canvas
     */
    getNodeTreeWidth(stepGap) {
        const currentNodeWidth = this.nativeElement.getBoundingClientRect().width;
        if (!this.hasChildren()) {
            return this.nativeElement.getBoundingClientRect().width;
        }
        let childWidth = this._children.reduce((childTreeWidth, child) => {
            return childTreeWidth += child.getNodeTreeWidth(stepGap);
        }, 0);
        childWidth += stepGap * (this._children.length - 1);
        return Math.max(currentNodeWidth, childWidth);
    }
    /**
     * Is this step currently hidden and unavailable as a drop location
     */
    isHidden() {
        return this._isHidden;
    }
    /**
     * Return current rect of this step. The position can be animated so getBoundingClientRect cannot
     * be reliable for positions
     * @param canvasRect Optional canvasRect to provide to offset the values
     */
    getCurrentRect(canvasRect) {
        let clientRect = this.nativeElement.getBoundingClientRect();
        return {
            bottom: this._currentPosition[1] + clientRect.height + (canvasRect?.top || 0),
            left: this._currentPosition[0] + (canvasRect?.left || 0),
            height: clientRect.height,
            width: clientRect.width,
            right: this._currentPosition[0] + clientRect.width + (canvasRect?.left || 0),
            top: this._currentPosition[1] + (canvasRect?.top || 0)
        };
    }
    /**
     * Returns the JSON representation of this flow step
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            data: this.data,
            children: this.hasChildren() ? this._children.map(child => {
                return child.toJSON();
            }) : []
        };
    }
    /** The native HTMLElement of this step */
    get nativeElement() {
        return this.view?.nativeElement;
    }
    setId(id) {
        this._id = id;
    }
    zsetPosition(pos, offsetCenter = false) {
        if (!this.view) {
            console.warn('Trying to set position before view init');
            //save pos and set in after view init
            this._initPosition = [...pos];
            return;
        }
        let adjustedX = Math.max(pos[0] - (offsetCenter ? this.nativeElement.offsetWidth / 2 : 0), 0);
        let adjustedY = Math.max(pos[1] - (offsetCenter ? this.nativeElement.offsetHeight / 2 : 0), 0);
        this.nativeElement.style.left = `${adjustedX}px`;
        this.nativeElement.style.top = `${adjustedY}px`;
        this._currentPosition = [adjustedX, adjustedY];
    }
    zaddChild0(newChild) {
        let oldChildIndex = null;
        if (newChild._parent) {
            oldChildIndex = newChild._parent.removeChild(newChild);
        }
        if (this.hasChildren()) {
            if (newChild.hasChildren()) {
                //if we have children and the child has children we need to confirm the child doesnt have multiple children at any point
                let newChildLastChild = newChild.findLastSingleChild();
                if (!newChildLastChild) {
                    newChild._parent.zaddChildSibling0(newChild, oldChildIndex);
                    console.error('Invalid move. A node cannot have multiple parents');
                    return false;
                }
                //move the this nodes children to last child of the step arg
                newChildLastChild.setChildren(this._children.slice());
            }
            else {
                //move adjacent's children to newStep
                newChild.setChildren(this._children.slice());
            }
        }
        //finally reset this nodes to children to the single new child
        this.setChildren([newChild]);
        return true;
    }
    zaddChildSibling0(child, index) {
        if (child._parent) {
            child._parent.removeChild(child);
        }
        if (!this.children) {
            this._children = [];
        }
        if (index == null) {
            this.children.push(child);
        }
        else {
            this.children.splice(index, 0, child);
        }
        //since we are adding a new child here, it is safe to force set the parent
        child.setParent(this, true);
    }
    zdrawArrow(start, end) {
        if (!this.arrow) {
            this.createArrow();
        }
        this.arrow.instance.position = {
            start: start,
            end: end
        };
    }
    ////////////////////////
    // PRIVATE IMPL
    destroy0(parentIndex, recursive = true) {
        this.compRef.destroy();
        // remove from master array
        this.canvas.flow.removeStep(this);
        if (this.isRootElement()) {
            this.canvas.flow.rootStep = null;
        }
        if (this.hasChildren()) {
            //this was the root node
            if (this.isRootElement()) {
                if (!recursive) {
                    let newRoot = this._children[0];
                    //set first child as new root
                    this.canvas.flow.rootStep = newRoot;
                    newRoot.setParent(null, true);
                    //make previous siblings children of the new root
                    if (this.hasChildren(2)) {
                        for (let i = 1; i < this._children.length; i++) {
                            let child = this._children[i];
                            child.setParent(newRoot, true);
                            newRoot._children.push(child);
                        }
                    }
                }
            }
            //update children
            let length = this._children.length;
            for (let i = 0; i < length; i++) {
                let child = this._children[i];
                if (recursive) {
                    child.destroy0(null, true);
                }
                //not the original root node
                else if (!!this._parent) {
                    this._parent._children.splice(i + parentIndex, 0, child);
                    child.setParent(this._parent, true);
                }
            }
            this.setChildren([]);
        }
        this._parent = null;
    }
    createArrow() {
        const factory = this.compFactory.resolveComponentFactory(NgFlowchartArrowComponent);
        this.arrow = this.viewContainer.createComponent(factory);
        this.nativeElement.parentElement.appendChild(this.arrow.location.nativeElement);
    }
    hideTree() {
        this._isHidden = true;
        this.nativeElement.style.opacity = '.4';
        if (this.arrow) {
            this.arrow.instance.hideArrow();
        }
        if (this.hasChildren()) {
            this._children.forEach(child => {
                child.hideTree();
            });
        }
    }
    showTree() {
        this._isHidden = false;
        if (this.arrow) {
            this.arrow.instance.showArrow();
        }
        this.nativeElement.style.opacity = '1';
        if (this.hasChildren()) {
            this._children.forEach(child => {
                child.showTree();
            });
        }
    }
    findLastSingleChild() {
        //two or more children means we have no single child
        if (this.hasChildren(2)) {
            return null;
        }
        //if one child.. keep going down the tree until we find no children or 2 or more
        else if (this.hasChildren()) {
            return this._children[0].findLastSingleChild();
        }
        //if no children then this is the last single child
        else
            return this;
    }
    setChildren(children) {
        this._children = children;
        this.children.forEach(child => {
            child.setParent(this, true);
        });
    }
}
NgFlowchartStepComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
NgFlowchartStepComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartStepComponent, selector: "ng-flowchart-step", inputs: { data: "data", type: "type", canvas: "canvas", compRef: "compRef", contentTemplate: "contentTemplate" }, outputs: { viewInit: "viewInit" }, host: { listeners: { "dragstart": "onMoveStart($event)", "dragend": "onMoveEnd($event)" } }, viewQueries: [{ propertyName: "view", first: true, predicate: ["canvasContent"], descendants: true }], ngImport: i0, template: "<div #canvasContent [id]=\"id\">\r\n  <ng-container\r\n    *ngTemplateOutlet=\"\r\n      contentTemplate;\r\n      context: {\r\n        $implicit: {\r\n          data: data,\r\n          id: id\r\n        }\r\n      }\r\n    \"\r\n  >\r\n  </ng-container>\r\n</div>\r\n", styles: [".ngflowchart-canvas{overflow:auto;display:flex}.ngflowchart-canvas-content.scaling .ngflowchart-step-wrapper,.ngflowchart-canvas-content.scaling svg{transition:none!important}.ngflowchart-canvas-content{position:relative;min-height:100%;min-width:100%;flex:1 1 100%}.ngflowchart-step-wrapper{height:auto;width:auto;position:absolute;box-sizing:border-box;transition:all .2s;cursor:grab}.ngflowchart-step-wrapper[ngflowchart-drop-hover]:before{content:\"\";width:12px;height:12px;border-radius:100%;position:absolute;z-index:1;background:darkred}.ngflowchart-step-wrapper[ngflowchart-drop-hover]:after{content:\"\";width:20px;height:20px;border-radius:100%;position:absolute;z-index:0;background:rgb(192,123,123);animation:backgroundOpacity 2s linear infinite}.ngflowchart-step-wrapper[ngflowchart-drop-hover=above]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=above]:after{top:0;right:50%;transform:translate(50%,-50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=below]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=below]:after{bottom:0;right:50%;transform:translate(50%,50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=right]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=right]:after{right:0;top:50%;transform:translate(50%,-50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=left]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=left]:after{left:0;top:50%;transform:translate(-50%,-50%)}@keyframes wiggle{0%{transform:translate(0);border:2px solid red}25%{transform:translate(-10px)}50%{transform:translate(0)}75%{transform:translate(10px)}to{transform:translate(0);border:2px solid red}}@keyframes backgroundOpacity{0%{opacity:.8}50%{opacity:.3}to{opacity:.8}}\n"], directives: [{ type: i1.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], encapsulation: i0.ViewEncapsulation.None });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepComponent, decorators: [{
            type: Component,
            args: [{ selector: 'ng-flowchart-step', encapsulation: ViewEncapsulation.None, template: "<div #canvasContent [id]=\"id\">\r\n  <ng-container\r\n    *ngTemplateOutlet=\"\r\n      contentTemplate;\r\n      context: {\r\n        $implicit: {\r\n          data: data,\r\n          id: id\r\n        }\r\n      }\r\n    \"\r\n  >\r\n  </ng-container>\r\n</div>\r\n", styles: [".ngflowchart-canvas{overflow:auto;display:flex}.ngflowchart-canvas-content.scaling .ngflowchart-step-wrapper,.ngflowchart-canvas-content.scaling svg{transition:none!important}.ngflowchart-canvas-content{position:relative;min-height:100%;min-width:100%;flex:1 1 100%}.ngflowchart-step-wrapper{height:auto;width:auto;position:absolute;box-sizing:border-box;transition:all .2s;cursor:grab}.ngflowchart-step-wrapper[ngflowchart-drop-hover]:before{content:\"\";width:12px;height:12px;border-radius:100%;position:absolute;z-index:1;background:darkred}.ngflowchart-step-wrapper[ngflowchart-drop-hover]:after{content:\"\";width:20px;height:20px;border-radius:100%;position:absolute;z-index:0;background:rgb(192,123,123);animation:backgroundOpacity 2s linear infinite}.ngflowchart-step-wrapper[ngflowchart-drop-hover=above]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=above]:after{top:0;right:50%;transform:translate(50%,-50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=below]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=below]:after{bottom:0;right:50%;transform:translate(50%,50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=right]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=right]:after{right:0;top:50%;transform:translate(50%,-50%)}.ngflowchart-step-wrapper[ngflowchart-drop-hover=left]:before,.ngflowchart-step-wrapper[ngflowchart-drop-hover=left]:after{left:0;top:50%;transform:translate(-50%,-50%)}@keyframes wiggle{0%{transform:translate(0);border:2px solid red}25%{transform:translate(-10px)}50%{transform:translate(0)}75%{transform:translate(10px)}to{transform:translate(0);border:2px solid red}}@keyframes backgroundOpacity{0%{opacity:.8}50%{opacity:.3}to{opacity:.8}}\n"] }]
        }], ctorParameters: function () { return []; }, propDecorators: { onMoveStart: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }], onMoveEnd: [{
                type: HostListener,
                args: ['dragend', ['$event']]
            }], view: [{
                type: ViewChild,
                args: ['canvasContent']
            }], data: [{
                type: Input
            }], type: [{
                type: Input
            }], canvas: [{
                type: Input
            }], compRef: [{
                type: Input
            }], viewInit: [{
                type: Output
            }], contentTemplate: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LXN0ZXAuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9uZy1mbG93Y2hhcnQtc3RlcC9uZy1mbG93Y2hhcnQtc3RlcC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9zcmMvbGliL25nLWZsb3djaGFydC1zdGVwL25nLWZsb3djaGFydC1zdGVwLmNvbXBvbmVudC5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQTRCLFlBQVksRUFBRSxVQUFVLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQW9CLGlCQUFpQixFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRXRNLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RCxPQUFPLEVBQUUseUJBQXlCLEVBQUUsTUFBTSxvREFBb0QsQ0FBQztBQUMvRixPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQzs7O0FBb0IxRSxNQUFNLE9BQU8sd0JBQXdCO0lBMkRuQztRQXBCQSxhQUFRLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQztRQU90QixxQkFBZ0IsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUkxQixjQUFTLEdBQUcsS0FBSyxDQUFDO1FBVXhCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUExREQsV0FBVyxDQUFDLEtBQWdCO1FBQzFCLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFBRSxPQUFPO1NBQUU7UUFDckMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ2hCLEtBQUssQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNsRCxLQUFLLENBQUMsWUFBWSxDQUFD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RDtRQUNwRCxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELGdGQUFnRjthQUMzRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUMzQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztTQUNoRDtRQUNELG1EQUFtRDs7WUFDOUMsT0FBTyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVPLFdBQVcsQ0FBQyxRQUF5QztRQUMzRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQztRQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUM1QixLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5QixDQUFDLENBQUMsQ0FBQTtJQUNKLENBQUM7O3NIQXhmVSx3QkFBd0I7MEdBQXhCLHdCQUF3QixrWkN4QnJDLGdSQWNBOzRGRFVhLHdCQUF3QjtrQkFOcEMsU0FBUzsrQkFDRSxtQkFBbUIsaUJBR2QsaUJBQWlCLENBQUMsSUFBSTswRUFLckMsV0FBVztzQkFEVixZQUFZO3VCQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQztnQkFnQnJDLFNBQVM7c0JBRFIsWUFBWTt1QkFBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBT3pCLElBQUk7c0JBRGIsU0FBUzt1QkFBQyxlQUFlO2dCQUkxQixJQUFJO3NCQURILEtBQUs7Z0JBSU4sSUFBSTtzQkFESCxLQUFLO2dCQUlOLE1BQU07c0JBREwsS0FBSztnQkFJTixPQUFPO3NCQUROLEtBQUs7Z0JBSU4sUUFBUTtzQkFEUCxNQUFNO2dCQUlQLGVBQWU7c0JBRGQsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCwgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLCBDb21wb25lbnRSZWYsIEVsZW1lbnRSZWYsIEV2ZW50RW1pdHRlciwgSG9zdExpc3RlbmVyLCBJbnB1dCwgT3V0cHV0LCBUZW1wbGF0ZVJlZiwgVmlld0NoaWxkLCBWaWV3Q29udGFpbmVyUmVmLCBWaWV3RW5jYXBzdWxhdGlvbiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBOZ0Zsb3djaGFydCB9IGZyb20gJy4uL21vZGVsL2Zsb3cubW9kZWwnO1xyXG5pbXBvcnQgeyBDT05TVEFOVFMgfSBmcm9tICcuLi9tb2RlbC9mbG93Y2hhcnQuY29uc3RhbnRzJztcclxuaW1wb3J0IHsgTmdGbG93Y2hhcnRBcnJvd0NvbXBvbmVudCB9IGZyb20gJy4uL25nLWZsb3djaGFydC1hcnJvdy9uZy1mbG93Y2hhcnQtYXJyb3cuY29tcG9uZW50JztcclxuaW1wb3J0IHsgTmdGbG93Y2hhcnRDYW52YXNTZXJ2aWNlIH0gZnJvbSAnLi4vbmctZmxvd2NoYXJ0LWNhbnZhcy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRHJvcERhdGFTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvZHJvcGRhdGEuc2VydmljZSc7XHJcblxyXG5leHBvcnQgdHlwZSBBZGRDaGlsZE9wdGlvbnMgPSB7XHJcbiAgLyoqIFNob3VsZCB0aGUgY2hpbGQgYmUgYWRkZWQgYXMgYSBzaWJsaW5nIHRvIGV4aXN0aW5nIGNoaWxkcmVuLCBpZiBmYWxzZSB0aGUgZXhpc3RpbmcgY2hpbGRyZW4gd2lsbCBiZSByZXBhcmVudGVkIHRvIHRoaXMgbmV3IGNoaWxkLlxyXG4gICAqIERlZmF1bHQgaXMgdHJ1ZS5cclxuICAgKiAqL1xyXG4gIHNpYmxpbmc/OiBib29sZWFuLFxyXG4gIC8qKiBUaGUgaW5kZXggb2YgdGhlIGNoaWxkLiBPbmx5IHVzZWQgd2hlbiBzaWJsaW5nIGlzIHRydWUuXHJcbiAgICogRGVmYXVsdHMgdG8gdGhlIGVuZCBvZiB0aGUgY2hpbGQgYXJyYXkuIFxyXG4gICAqL1xyXG4gIGluZGV4PzogbnVtYmVyXHJcbn1cclxuXHJcbkBDb21wb25lbnQoe1xyXG4gIHNlbGVjdG9yOiAnbmctZmxvd2NoYXJ0LXN0ZXAnLFxyXG4gIHRlbXBsYXRlVXJsOiAnLi9uZy1mbG93Y2hhcnQtc3RlcC5jb21wb25lbnQuaHRtbCcsXHJcbiAgc3R5bGVVcmxzOiBbJy4vbmctZmxvd2NoYXJ0LXN0ZXAuY29tcG9uZW50LnNjc3MnXSxcclxuICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbi5Ob25lXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ8VCA9IGFueT4ge1xyXG5cclxuICBASG9zdExpc3RlbmVyKCdkcmFnc3RhcnQnLCBbJyRldmVudCddKVxyXG4gIG9uTW92ZVN0YXJ0KGV2ZW50OiBEcmFnRXZlbnQpIHtcclxuICAgIGlmICh0aGlzLmNhbnZhcy5kaXNhYmxlZCkgeyByZXR1cm47IH1cclxuICAgIHRoaXMuaGlkZVRyZWUoKTtcclxuICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0eXBlJywgJ0ZST01fQ0FOVkFTJyk7XHJcbiAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YSgnaWQnLCB0aGlzLm5hdGl2ZUVsZW1lbnQuaWQpO1xyXG5cclxuXHJcbiAgICB0aGlzLmRyb3AuZHJhZ1N0ZXAgPSB7XHJcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcclxuICAgICAgZGF0YTogdGhpcy5kYXRhLFxyXG4gICAgICBpbnN0YW5jZTogdGhpc1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgQEhvc3RMaXN0ZW5lcignZHJhZ2VuZCcsIFsnJGV2ZW50J10pXHJcbiAgb25Nb3ZlRW5kKGV2ZW50OiBEcmFnRXZlbnQpIHtcclxuICAgIHRoaXMuc2hvd1RyZWUoKTtcclxuICB9XHJcblxyXG4gIC8vY291bGQgcG90ZW50aWFsbHkgdHJ5IHRvIG1ha2UgdGhpcyBhYnN0cmFjdFxyXG4gIEBWaWV3Q2hpbGQoJ2NhbnZhc0NvbnRlbnQnKVxyXG4gIHByb3RlY3RlZCB2aWV3OiBFbGVtZW50UmVmO1xyXG5cclxuICBASW5wdXQoKVxyXG4gIGRhdGE6IFQ7XHJcblxyXG4gIEBJbnB1dCgpXHJcbiAgdHlwZTogc3RyaW5nO1xyXG5cclxuICBASW5wdXQoKVxyXG4gIGNhbnZhczogTmdGbG93Y2hhcnRDYW52YXNTZXJ2aWNlO1xyXG5cclxuICBASW5wdXQoKVxyXG4gIGNvbXBSZWY6IENvbXBvbmVudFJlZjxOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ+O1xyXG5cclxuICBAT3V0cHV0KClcclxuICB2aWV3SW5pdCA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcclxuXHJcbiAgQElucHV0KClcclxuICBjb250ZW50VGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XHJcblxyXG5cclxuICBwcml2YXRlIF9pZDogYW55O1xyXG4gIHByaXZhdGUgX2N1cnJlbnRQb3NpdGlvbiA9IFswLCAwXTtcclxuXHJcbiAgLy9vbmx5IHVzZWQgaWYgc29tZXRoaW5nIHRyaWVzIHRvIHNldCB0aGUgcG9zaXRpb24gYmVmb3JlIHZpZXcgaGFzIGJlZW4gaW5pdGlhbGl6ZWRcclxuICBwcml2YXRlIF9pbml0UG9zaXRpb247XHJcbiAgcHJpdmF0ZSBfaXNIaWRkZW4gPSBmYWxzZTtcclxuICBwcml2YXRlIF9wYXJlbnQ6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudDtcclxuICBwcml2YXRlIF9jaGlsZHJlbjogQXJyYXk8TmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50PjtcclxuICBwcml2YXRlIGFycm93OiBDb21wb25lbnRSZWY8TmdGbG93Y2hhcnRBcnJvd0NvbXBvbmVudD47XHJcblxyXG4gIHByaXZhdGUgZHJvcDogRHJvcERhdGFTZXJ2aWNlO1xyXG4gIHByaXZhdGUgdmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZjtcclxuICBwcml2YXRlIGNvbXBGYWN0b3J5OiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXI7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgdGhpcy5fY2hpbGRyZW4gPSBbXTtcclxuICB9XHJcblxyXG4gIGluaXQoZHJvcCwgdmlld0NvbnRhaW5lciwgY29tcEZhY3RvcnkpIHtcclxuICAgIHRoaXMuZHJvcCA9IGRyb3A7XHJcbiAgICB0aGlzLnZpZXdDb250YWluZXIgPSB2aWV3Q29udGFpbmVyO1xyXG4gICAgdGhpcy5jb21wRmFjdG9yeSA9IGNvbXBGYWN0b3J5O1xyXG4gIH1cclxuXHJcbiAgY2FuRGVsZXRlU3RlcCgpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgY2FuRHJvcChkcm9wRXZlbnQ6IE5nRmxvd2NoYXJ0LkRyb3BUYXJnZXQsIGVycm9yOiBOZ0Zsb3djaGFydC5FcnJvck1lc3NhZ2UpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0cnVlO1xyXG4gIH1cclxuXHJcbiAgc2hvdWxkRXZhbERyb3BIb3Zlcihjb29yZHM6IG51bWJlcltdLCBzdGVwVG9Ecm9wOiBOZ0Zsb3djaGFydC5TdGVwKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gdHJ1ZVxyXG4gIH1cclxuXHJcbiAgYXN5bmMgb25VcGxvYWQoZGF0YTogVCkgeyB9XHJcblxyXG4gIGdldERyb3BQb3NpdGlvbnNGb3JTdGVwKHN0ZXA6IE5nRmxvd2NoYXJ0LlN0ZXApOiBOZ0Zsb3djaGFydC5Ecm9wUG9zaXRpb25bXSB7XHJcbiAgICByZXR1cm4gWydCRUxPVycsICdMRUZUJywgJ1JJR0hUJywgJ0FCT1ZFJ107XHJcbiAgfVxyXG5cclxuICBuZ09uSW5pdCgpOiB2b2lkIHtcclxuXHJcbiAgfVxyXG5cclxuICBuZ0FmdGVyVmlld0luaXQoKSB7XHJcbiAgICBpZiAoIXRoaXMubmF0aXZlRWxlbWVudCkge1xyXG4gICAgICB0aHJvdyAnTWlzc2luZyBjYW52YXNDb250ZW50IFZpZXdDaGlsZC4gQmUgc3VyZSB0byBhZGQgI2NhbnZhc0NvbnRlbnQgdG8geW91ciByb290IGh0bWwgZWxlbWVudC4nXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRoaXMubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKCduZ2Zsb3djaGFydC1zdGVwLXdyYXBwZXInKTtcclxuICAgIHRoaXMubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XHJcblxyXG4gICAgaWYgKHRoaXMuX2luaXRQb3NpdGlvbikge1xyXG4gICAgICB0aGlzLnpzZXRQb3NpdGlvbih0aGlzLl9pbml0UG9zaXRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vZm9yY2UgaWQgY3JlYXRpb24gaWYgbm90IGFscmVhZHkgdGhlcmVcclxuICAgIHRoaXMubmF0aXZlRWxlbWVudC5pZCA9IHRoaXMuaWQ7XHJcblxyXG4gICAgdGhpcy52aWV3SW5pdC5lbWl0KCk7XHJcbiAgfVxyXG5cclxuICBnZXQgaWQoKSB7XHJcbiAgICBpZiAodGhpcy5faWQgPT0gbnVsbCkge1xyXG4gICAgICB0aGlzLl9pZCA9ICdzJyArIERhdGUubm93KCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcy5faWQ7XHJcbiAgfVxyXG5cclxuICBnZXQgY3VycmVudFBvc2l0aW9uKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuX2N1cnJlbnRQb3NpdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW5kIGFkZHMgYSBjaGlsZCB0byB0aGlzIHN0ZXBcclxuICAgKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIG9yIGNvbXBvbmVudCB0eXBlIHRvIGNyZWF0ZVxyXG4gICAqIEBwYXJhbSBvcHRpb25zIEFkZCBvcHRpb25zIFxyXG4gICAqL1xyXG4gIGFzeW5jIGFkZENoaWxkKHBlbmRpbmc6IE5nRmxvd2NoYXJ0LlBlbmRpbmdTdGVwLCBvcHRpb25zOiBBZGRDaGlsZE9wdGlvbnMpOiBQcm9taXNlPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCB8IG51bGw+IHtcclxuXHJcbiAgICBsZXQgY29tcG9uZW50UmVmID0gYXdhaXQgdGhpcy5jYW52YXMuY3JlYXRlU3RlcChwZW5kaW5nKTtcclxuICAgIHRoaXMuY2FudmFzLmFkZFRvQ2FudmFzKGNvbXBvbmVudFJlZik7XHJcbiAgICBpZiAob3B0aW9ucz8uc2libGluZykge1xyXG4gICAgICB0aGlzLnphZGRDaGlsZFNpYmxpbmcwKGNvbXBvbmVudFJlZi5pbnN0YW5jZSwgb3B0aW9ucz8uaW5kZXgpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuemFkZENoaWxkMChjb21wb25lbnRSZWYuaW5zdGFuY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2FudmFzLmZsb3cuYWRkU3RlcChjb21wb25lbnRSZWYuaW5zdGFuY2UpO1xyXG5cclxuICAgIHRoaXMuY2FudmFzLnJlUmVuZGVyKCk7XHJcblxyXG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZi5pbnN0YW5jZTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoaXMgc3RlcCBjb21wb25lbnQgYW5kIHVwZGF0ZXMgYWxsIG5lY2Vzc2FyeSBjaGlsZCBhbmQgcGFyZW50IHJlbGF0aW9uc2hpcHNcclxuICAgKiBAcGFyYW0gcmVjdXJzaXZlIFxyXG4gICAqIEBwYXJhbSBjaGVja0NhbGxiYWNrcyBcclxuICAgKi9cclxuICBkZXN0cm95KHJlY3Vyc2l2ZTogYm9vbGVhbiA9IHRydWUsIGNoZWNrQ2FsbGJhY2tzOiBib29sZWFuID0gdHJ1ZSk6IGJvb2xlYW4ge1xyXG5cclxuICAgIGlmICghY2hlY2tDYWxsYmFja3MgfHwgdGhpcy5jYW5EZWxldGVTdGVwKCkpIHtcclxuICAgICAgdGhpcy5jYW52YXMub3B0aW9ucy5jYWxsYmFja3MuYmVmb3JlRGVsZXRlU3RlcCAmJiBcclxuICAgICAgdGhpcy5jYW52YXMub3B0aW9ucy5jYWxsYmFja3MuYmVmb3JlRGVsZXRlU3RlcCh0aGlzKVxyXG4gICAgICBcclxuICAgICAgbGV0IHBhcmVudEluZGV4O1xyXG4gICAgICBpZiAodGhpcy5fcGFyZW50KSB7XHJcbiAgICAgICAgcGFyZW50SW5kZXggPSB0aGlzLl9wYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMuZGVzdHJveTAocGFyZW50SW5kZXgsIHJlY3Vyc2l2ZSk7XHJcblxyXG4gICAgICB0aGlzLmNhbnZhcy5yZVJlbmRlcigpO1xyXG5cclxuICAgICAgdGhpcy5jYW52YXMub3B0aW9ucy5jYWxsYmFja3MuYWZ0ZXJEZWxldGVTdGVwICYmIFxyXG4gICAgICB0aGlzLmNhbnZhcy5vcHRpb25zLmNhbGxiYWNrcy5hZnRlckRlbGV0ZVN0ZXAodGhpcylcclxuXHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcblxyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmUgYSBjaGlsZCBmcm9tIHRoaXMgc3RlcC4gUmV0dXJucyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGNoaWxkIHdhcyBmb3VuZCBvciAtMSBpZiBub3QgZm91bmQuXHJcbiAgICogQHBhcmFtIGNoaWxkVG9SZW1vdmUgU3RlcCBjb21wb25lbnQgdG8gcmVtb3ZlXHJcbiAgICovXHJcbiAgcmVtb3ZlQ2hpbGQoY2hpbGRUb1JlbW92ZTogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50KTogbnVtYmVyIHtcclxuICAgIGlmICghdGhpcy5jaGlsZHJlbikge1xyXG4gICAgICByZXR1cm4gLTE7XHJcbiAgICB9XHJcbiAgICBjb25zdCBpID0gdGhpcy5jaGlsZHJlbi5maW5kSW5kZXgoY2hpbGQgPT4gY2hpbGQuaWQgPT0gY2hpbGRUb1JlbW92ZS5pZCk7XHJcbiAgICBpZiAoaSA+IC0xKSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmUtcGFyZW50IHRoaXMgc3RlcFxyXG4gICAqIEBwYXJhbSBuZXdQYXJlbnQgVGhlIG5ldyBwYXJlbnQgZm9yIHRoaXMgc3RlcFxyXG4gICAqIEBwYXJhbSBmb3JjZSBGb3JjZSB0aGUgcmUtcGFyZW50IGlmIGEgcGFyZW50IGFscmVhZHkgZXhpc3RzXHJcbiAgICovXHJcbiAgc2V0UGFyZW50KG5ld1BhcmVudDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50LCBmb3JjZTogYm9vbGVhbiA9IGZhbHNlKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5wYXJlbnQgJiYgIWZvcmNlKSB7XHJcbiAgICAgIGNvbnNvbGUud2FybignVGhpcyBjaGlsZCBhbHJlYWR5IGhhcyBhIHBhcmVudCwgdXNlIGZvcmNlIGlmIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZycpO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLl9wYXJlbnQgPSBuZXdQYXJlbnQ7XHJcbiAgICBpZiAoIXRoaXMuX3BhcmVudCAmJiB0aGlzLmFycm93KSB7XHJcbiAgICAgIHRoaXMuYXJyb3cuZGVzdHJveSgpO1xyXG4gICAgICB0aGlzLmFycm93ID0gbnVsbDtcclxuICAgIH1cclxuICB9XHJcblxyXG5cclxuICAvKipcclxuICAgKiBDYWxsZWQgd2hlbiBubyBsb25nZXIgdHJ5aW5nIHRvIGRyb3Agb3IgbW92ZSBhIHN0ZXAgYWRqYWNlbnQgdG8gdGhpcyBvbmVcclxuICAgKiBAcGFyYW0gcG9zaXRpb24gUG9zaXRpb24gdG8gcmVuZGVyIHRoZSBpY29uXHJcbiAgICovXHJcbiAgY2xlYXJIb3Zlckljb25zKCkge1xyXG4gICAgdGhpcy5uYXRpdmVFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShDT05TVEFOVFMuRFJPUF9IT1ZFUl9BVFRSKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCB3aGVuIGEgc3RlcCBpcyB0cnlpbmcgdG8gYmUgZHJvcHBlZCBvciBtb3ZlZCBhZGphY2VudCB0byB0aGlzIHN0ZXAuXHJcbiAgICogQHBhcmFtIHBvc2l0aW9uIFBvc2l0aW9uIHRvIHJlbmRlciB0aGUgaWNvblxyXG4gICAqL1xyXG4gIHNob3dIb3Zlckljb24ocG9zaXRpb246IE5nRmxvd2NoYXJ0LkRyb3BQb3NpdGlvbikge1xyXG4gICAgdGhpcy5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZShDT05TVEFOVFMuRFJPUF9IT1ZFUl9BVFRSLCBwb3NpdGlvbi50b0xvd2VyQ2FzZSgpKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElzIHRoaXMgdGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgdHJlZVxyXG4gICAqL1xyXG4gIGlzUm9vdEVsZW1lbnQoKSB7XHJcbiAgICByZXR1cm4gIXRoaXMucGFyZW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRG9lcyB0aGlzIHN0ZXAgaGF2ZSBhbnkgY2hpbGRyZW4/XHJcbiAgICogQHBhcmFtIGNvdW50IE9wdGlvbmFsIGNvdW50IG9mIGNoaWxkcmVuIHRvIGNoZWNrLiBEZWZhdWx0cyB0byAxLiBJLkUgaGFzIGF0IGxlYXN0IDEgY2hpbGQuXHJcbiAgICovXHJcbiAgaGFzQ2hpbGRyZW4oY291bnQ6IG51bWJlciA9IDEpIHtcclxuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuICYmIHRoaXMuY2hpbGRyZW4ubGVuZ3RoID49IGNvdW50O1xyXG4gIH1cclxuXHJcbiAgLyoqIEFycmF5IG9mIGNoaWxkcmVuIHN0ZXBzIGZvciB0aGlzIHN0ZXAgKi9cclxuICBnZXQgY2hpbGRyZW4oKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW47XHJcbiAgfVxyXG5cclxuICAvKiogVGhlIHBhcmVudCBzdGVwIG9mIHRoaXMgc3RlcCAqL1xyXG4gIGdldCBwYXJlbnQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fcGFyZW50O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgdG90YWwgd2lkdGggZXh0ZW50IChpbiBwaXhlbHMpIG9mIHRoaXMgbm9kZSB0cmVlXHJcbiAgICogQHBhcmFtIHN0ZXBHYXAgVGhlIGN1cnJlbnQgc3RlcCBnYXAgZm9yIHRoZSBmbG93IGNhbnZhc1xyXG4gICAqL1xyXG4gIGdldE5vZGVUcmVlV2lkdGgoc3RlcEdhcDogbnVtYmVyKSB7XHJcbiAgICBjb25zdCBjdXJyZW50Tm9kZVdpZHRoID0gdGhpcy5uYXRpdmVFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLndpZHRoO1xyXG5cclxuICAgIGlmICghdGhpcy5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNoaWxkV2lkdGggPSB0aGlzLl9jaGlsZHJlbi5yZWR1Y2UoKGNoaWxkVHJlZVdpZHRoLCBjaGlsZCkgPT4ge1xyXG4gICAgICByZXR1cm4gY2hpbGRUcmVlV2lkdGggKz0gY2hpbGQuZ2V0Tm9kZVRyZWVXaWR0aChzdGVwR2FwKTtcclxuICAgIH0sIDApXHJcblxyXG4gICAgY2hpbGRXaWR0aCArPSBzdGVwR2FwICogKHRoaXMuX2NoaWxkcmVuLmxlbmd0aCAtIDEpO1xyXG5cclxuICAgIHJldHVybiBNYXRoLm1heChjdXJyZW50Tm9kZVdpZHRoLCBjaGlsZFdpZHRoKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElzIHRoaXMgc3RlcCBjdXJyZW50bHkgaGlkZGVuIGFuZCB1bmF2YWlsYWJsZSBhcyBhIGRyb3AgbG9jYXRpb25cclxuICAgKi9cclxuICBpc0hpZGRlbigpIHtcclxuICAgIHJldHVybiB0aGlzLl9pc0hpZGRlbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybiBjdXJyZW50IHJlY3Qgb2YgdGhpcyBzdGVwLiBUaGUgcG9zaXRpb24gY2FuIGJlIGFuaW1hdGVkIHNvIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBjYW5ub3QgXHJcbiAgICogYmUgcmVsaWFibGUgZm9yIHBvc2l0aW9uc1xyXG4gICAqIEBwYXJhbSBjYW52YXNSZWN0IE9wdGlvbmFsIGNhbnZhc1JlY3QgdG8gcHJvdmlkZSB0byBvZmZzZXQgdGhlIHZhbHVlc1xyXG4gICAqL1xyXG4gIGdldEN1cnJlbnRSZWN0KGNhbnZhc1JlY3Q/OiBET01SZWN0KTogUGFydGlhbDxET01SZWN0PiB7XHJcbiAgICBsZXQgY2xpZW50UmVjdCA9IHRoaXMubmF0aXZlRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBib3R0b206IHRoaXMuX2N1cnJlbnRQb3NpdGlvblsxXSArIGNsaWVudFJlY3QuaGVpZ2h0ICsgKGNhbnZhc1JlY3Q/LnRvcCB8fCAwKSxcclxuICAgICAgbGVmdDogdGhpcy5fY3VycmVudFBvc2l0aW9uWzBdICsgKGNhbnZhc1JlY3Q/LmxlZnQgfHwgMCksXHJcbiAgICAgIGhlaWdodDogY2xpZW50UmVjdC5oZWlnaHQsXHJcbiAgICAgIHdpZHRoOiBjbGllbnRSZWN0LndpZHRoLFxyXG4gICAgICByaWdodDogdGhpcy5fY3VycmVudFBvc2l0aW9uWzBdICsgY2xpZW50UmVjdC53aWR0aCArIChjYW52YXNSZWN0Py5sZWZ0IHx8IDApLFxyXG4gICAgICB0b3A6IHRoaXMuX2N1cnJlbnRQb3NpdGlvblsxXSArIChjYW52YXNSZWN0Py50b3AgfHwgMClcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgdGhlIEpTT04gcmVwcmVzZW50YXRpb24gb2YgdGhpcyBmbG93IHN0ZXBcclxuICAgKi9cclxuICB0b0pTT04oKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBpZDogdGhpcy5pZCxcclxuICAgICAgdHlwZTogdGhpcy50eXBlLFxyXG4gICAgICBkYXRhOiB0aGlzLmRhdGEsXHJcbiAgICAgIGNoaWxkcmVuOiB0aGlzLmhhc0NoaWxkcmVuKCkgPyB0aGlzLl9jaGlsZHJlbi5tYXAoY2hpbGQgPT4ge1xyXG4gICAgICAgIHJldHVybiBjaGlsZC50b0pTT04oKVxyXG4gICAgICB9KSA6IFtdXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKiogVGhlIG5hdGl2ZSBIVE1MRWxlbWVudCBvZiB0aGlzIHN0ZXAgKi9cclxuICBnZXQgbmF0aXZlRWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICByZXR1cm4gdGhpcy52aWV3Py5uYXRpdmVFbGVtZW50O1xyXG4gIH1cclxuXHJcbiAgc2V0SWQoaWQpIHtcclxuICAgIHRoaXMuX2lkID0gaWQ7XHJcbiAgfVxyXG5cclxuICB6c2V0UG9zaXRpb24ocG9zOiBudW1iZXJbXSwgb2Zmc2V0Q2VudGVyOiBib29sZWFuID0gZmFsc2UpIHtcclxuXHJcbiAgICBpZiAoIXRoaXMudmlldykge1xyXG4gICAgICBjb25zb2xlLndhcm4oJ1RyeWluZyB0byBzZXQgcG9zaXRpb24gYmVmb3JlIHZpZXcgaW5pdCcpO1xyXG4gICAgICAvL3NhdmUgcG9zIGFuZCBzZXQgaW4gYWZ0ZXIgdmlldyBpbml0XHJcbiAgICAgIHRoaXMuX2luaXRQb3NpdGlvbiA9IFsuLi5wb3NdO1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGFkanVzdGVkWCA9IE1hdGgubWF4KHBvc1swXSAtIChvZmZzZXRDZW50ZXIgPyB0aGlzLm5hdGl2ZUVsZW1lbnQub2Zmc2V0V2lkdGggLyAyIDogMCksIDApO1xyXG4gICAgbGV0IGFkanVzdGVkWSA9IE1hdGgubWF4KHBvc1sxXSAtIChvZmZzZXRDZW50ZXIgPyB0aGlzLm5hdGl2ZUVsZW1lbnQub2Zmc2V0SGVpZ2h0IC8gMiA6IDApLCAwKTtcclxuXHJcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQuc3R5bGUubGVmdCA9IGAke2FkanVzdGVkWH1weGA7XHJcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQuc3R5bGUudG9wID0gYCR7YWRqdXN0ZWRZfXB4YDtcclxuXHJcbiAgICB0aGlzLl9jdXJyZW50UG9zaXRpb24gPSBbYWRqdXN0ZWRYLCBhZGp1c3RlZFldO1xyXG4gIH1cclxuXHJcbiAgemFkZENoaWxkMChuZXdDaGlsZDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50KTogYm9vbGVhbiB7XHJcbiAgICBsZXQgb2xkQ2hpbGRJbmRleCA9IG51bGxcclxuICAgIGlmIChuZXdDaGlsZC5fcGFyZW50KSB7XHJcbiAgICAgIG9sZENoaWxkSW5kZXggPSBuZXdDaGlsZC5fcGFyZW50LnJlbW92ZUNoaWxkKG5ld0NoaWxkKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgIGlmIChuZXdDaGlsZC5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgICAgLy9pZiB3ZSBoYXZlIGNoaWxkcmVuIGFuZCB0aGUgY2hpbGQgaGFzIGNoaWxkcmVuIHdlIG5lZWQgdG8gY29uZmlybSB0aGUgY2hpbGQgZG9lc250IGhhdmUgbXVsdGlwbGUgY2hpbGRyZW4gYXQgYW55IHBvaW50XHJcbiAgICAgICAgbGV0IG5ld0NoaWxkTGFzdENoaWxkID0gbmV3Q2hpbGQuZmluZExhc3RTaW5nbGVDaGlsZCgpO1xyXG4gICAgICAgIGlmICghbmV3Q2hpbGRMYXN0Q2hpbGQpIHtcclxuICAgICAgICAgIG5ld0NoaWxkLl9wYXJlbnQuemFkZENoaWxkU2libGluZzAobmV3Q2hpbGQsIG9sZENoaWxkSW5kZXgpXHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnZhbGlkIG1vdmUuIEEgbm9kZSBjYW5ub3QgaGF2ZSBtdWx0aXBsZSBwYXJlbnRzJyk7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vbW92ZSB0aGUgdGhpcyBub2RlcyBjaGlsZHJlbiB0byBsYXN0IGNoaWxkIG9mIHRoZSBzdGVwIGFyZ1xyXG4gICAgICAgIG5ld0NoaWxkTGFzdENoaWxkLnNldENoaWxkcmVuKHRoaXMuX2NoaWxkcmVuLnNsaWNlKCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgIC8vbW92ZSBhZGphY2VudCdzIGNoaWxkcmVuIHRvIG5ld1N0ZXBcclxuICAgICAgICBuZXdDaGlsZC5zZXRDaGlsZHJlbih0aGlzLl9jaGlsZHJlbi5zbGljZSgpKTtcclxuICAgICAgfVxyXG5cclxuICAgIH1cclxuICAgIC8vZmluYWxseSByZXNldCB0aGlzIG5vZGVzIHRvIGNoaWxkcmVuIHRvIHRoZSBzaW5nbGUgbmV3IGNoaWxkXHJcbiAgICB0aGlzLnNldENoaWxkcmVuKFtuZXdDaGlsZF0pO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICB6YWRkQ2hpbGRTaWJsaW5nMChjaGlsZDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50LCBpbmRleD86IG51bWJlcik6IHZvaWQge1xyXG4gICAgaWYgKGNoaWxkLl9wYXJlbnQpIHtcclxuICAgICAgY2hpbGQuX3BhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLmNoaWxkcmVuKSB7XHJcbiAgICAgIHRoaXMuX2NoaWxkcmVuID0gW107XHJcbiAgICB9XHJcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xyXG4gICAgICB0aGlzLmNoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHRoaXMuY2hpbGRyZW4uc3BsaWNlKGluZGV4LCAwLCBjaGlsZCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9zaW5jZSB3ZSBhcmUgYWRkaW5nIGEgbmV3IGNoaWxkIGhlcmUsIGl0IGlzIHNhZmUgdG8gZm9yY2Ugc2V0IHRoZSBwYXJlbnRcclxuICAgIGNoaWxkLnNldFBhcmVudCh0aGlzLCB0cnVlKTtcclxuICB9XHJcblxyXG4gIHpkcmF3QXJyb3coc3RhcnQ6IG51bWJlcltdLCBlbmQ6IG51bWJlcltdKSB7XHJcbiAgICBpZiAoIXRoaXMuYXJyb3cpIHtcclxuICAgICAgdGhpcy5jcmVhdGVBcnJvdygpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5hcnJvdy5pbnN0YW5jZS5wb3NpdGlvbiA9IHtcclxuICAgICAgc3RhcnQ6IHN0YXJ0LFxyXG4gICAgICBlbmQ6IGVuZFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIFBSSVZBVEUgSU1QTFxyXG5cclxuICBwcml2YXRlIGRlc3Ryb3kwKHBhcmVudEluZGV4LCByZWN1cnNpdmU6IGJvb2xlYW4gPSB0cnVlKSB7XHJcblxyXG4gICAgdGhpcy5jb21wUmVmLmRlc3Ryb3koKTtcclxuICAgIFxyXG4gICAgLy8gcmVtb3ZlIGZyb20gbWFzdGVyIGFycmF5XHJcbiAgICB0aGlzLmNhbnZhcy5mbG93LnJlbW92ZVN0ZXAodGhpcylcclxuXHJcbiAgICBpZiAodGhpcy5pc1Jvb3RFbGVtZW50KCkpIHtcclxuICAgICAgdGhpcy5jYW52YXMuZmxvdy5yb290U3RlcCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRoaXMuaGFzQ2hpbGRyZW4oKSkge1xyXG5cclxuICAgICAgLy90aGlzIHdhcyB0aGUgcm9vdCBub2RlXHJcbiAgICAgIGlmICh0aGlzLmlzUm9vdEVsZW1lbnQoKSkge1xyXG5cclxuICAgICAgICBpZiAoIXJlY3Vyc2l2ZSkge1xyXG5cclxuICAgICAgICAgIGxldCBuZXdSb290ID0gdGhpcy5fY2hpbGRyZW5bMF07XHJcbiAgICAgICAgICAvL3NldCBmaXJzdCBjaGlsZCBhcyBuZXcgcm9vdFxyXG4gICAgICAgICAgdGhpcy5jYW52YXMuZmxvdy5yb290U3RlcCA9IG5ld1Jvb3Q7XHJcbiAgICAgICAgICBuZXdSb290LnNldFBhcmVudChudWxsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAvL21ha2UgcHJldmlvdXMgc2libGluZ3MgY2hpbGRyZW4gb2YgdGhlIG5ldyByb290XHJcbiAgICAgICAgICBpZiAodGhpcy5oYXNDaGlsZHJlbigyKSkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5fY2hpbGRyZW5baV07XHJcbiAgICAgICAgICAgICAgY2hpbGQuc2V0UGFyZW50KG5ld1Jvb3QsIHRydWUpO1xyXG4gICAgICAgICAgICAgIG5ld1Jvb3QuX2NoaWxkcmVuLnB1c2goY2hpbGQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgfVxyXG5cclxuICAgICAgLy91cGRhdGUgY2hpbGRyZW5cclxuICAgICAgbGV0IGxlbmd0aCA9IHRoaXMuX2NoaWxkcmVuLmxlbmd0aDtcclxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGxldCBjaGlsZCA9IHRoaXMuX2NoaWxkcmVuW2ldO1xyXG4gICAgICAgIGlmIChyZWN1cnNpdmUpIHtcclxuICAgICAgICAgIChjaGlsZCBhcyBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQpLmRlc3Ryb3kwKG51bGwsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9ub3QgdGhlIG9yaWdpbmFsIHJvb3Qgbm9kZVxyXG4gICAgICAgIGVsc2UgaWYgKCEhdGhpcy5fcGFyZW50KSB7XHJcbiAgICAgICAgICB0aGlzLl9wYXJlbnQuX2NoaWxkcmVuLnNwbGljZShpICsgcGFyZW50SW5kZXgsIDAsIGNoaWxkKTtcclxuICAgICAgICAgIGNoaWxkLnNldFBhcmVudCh0aGlzLl9wYXJlbnQsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICB0aGlzLnNldENoaWxkcmVuKFtdKTtcclxuICAgIH1cclxuICAgIHRoaXMuX3BhcmVudCA9IG51bGw7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGNyZWF0ZUFycm93KCkge1xyXG4gICAgY29uc3QgZmFjdG9yeSA9IHRoaXMuY29tcEZhY3RvcnkucmVzb2x2ZUNvbXBvbmVudEZhY3RvcnkoTmdGbG93Y2hhcnRBcnJvd0NvbXBvbmVudClcclxuICAgIHRoaXMuYXJyb3cgPSB0aGlzLnZpZXdDb250YWluZXIuY3JlYXRlQ29tcG9uZW50KGZhY3RvcnkpO1xyXG4gICAgdGhpcy5uYXRpdmVFbGVtZW50LnBhcmVudEVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5hcnJvdy5sb2NhdGlvbi5uYXRpdmVFbGVtZW50KTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgaGlkZVRyZWUoKSB7XHJcbiAgICB0aGlzLl9pc0hpZGRlbiA9IHRydWU7XHJcbiAgICB0aGlzLm5hdGl2ZUVsZW1lbnQuc3R5bGUub3BhY2l0eSA9ICcuNCc7XHJcblxyXG4gICAgaWYgKHRoaXMuYXJyb3cpIHtcclxuICAgICAgdGhpcy5hcnJvdy5pbnN0YW5jZS5oaWRlQXJyb3coKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgIHRoaXMuX2NoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICAgIGNoaWxkLmhpZGVUcmVlKCk7XHJcbiAgICAgIH0pXHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNob3dUcmVlKCkge1xyXG4gICAgdGhpcy5faXNIaWRkZW4gPSBmYWxzZTtcclxuXHJcbiAgICBpZiAodGhpcy5hcnJvdykge1xyXG4gICAgICB0aGlzLmFycm93Lmluc3RhbmNlLnNob3dBcnJvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMubmF0aXZlRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xyXG4gICAgaWYgKHRoaXMuaGFzQ2hpbGRyZW4oKSkge1xyXG4gICAgICB0aGlzLl9jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgICBjaGlsZC5zaG93VHJlZSgpO1xyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBmaW5kTGFzdFNpbmdsZUNoaWxkKCkge1xyXG4gICAgLy90d28gb3IgbW9yZSBjaGlsZHJlbiBtZWFucyB3ZSBoYXZlIG5vIHNpbmdsZSBjaGlsZFxyXG4gICAgaWYgKHRoaXMuaGFzQ2hpbGRyZW4oMikpIHtcclxuICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICAvL2lmIG9uZSBjaGlsZC4uIGtlZXAgZ29pbmcgZG93biB0aGUgdHJlZSB1bnRpbCB3ZSBmaW5kIG5vIGNoaWxkcmVuIG9yIDIgb3IgbW9yZVxyXG4gICAgZWxzZSBpZiAodGhpcy5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9jaGlsZHJlblswXS5maW5kTGFzdFNpbmdsZUNoaWxkKCk7XHJcbiAgICB9XHJcbiAgICAvL2lmIG5vIGNoaWxkcmVuIHRoZW4gdGhpcyBpcyB0aGUgbGFzdCBzaW5nbGUgY2hpbGRcclxuICAgIGVsc2UgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHNldENoaWxkcmVuKGNoaWxkcmVuOiBBcnJheTxOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ+KTogdm9pZCB7XHJcbiAgICB0aGlzLl9jaGlsZHJlbiA9IGNoaWxkcmVuO1xyXG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgY2hpbGQuc2V0UGFyZW50KHRoaXMsIHRydWUpO1xyXG4gICAgfSlcclxuICB9XHJcblxyXG59XHJcbiIsIjxkaXYgI2NhbnZhc0NvbnRlbnQgW2lkXT1cImlkXCI+XHJcbiAgPG5nLWNvbnRhaW5lclxyXG4gICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJcclxuICAgICAgY29udGVudFRlbXBsYXRlO1xyXG4gICAgICBjb250ZXh0OiB7XHJcbiAgICAgICAgJGltcGxpY2l0OiB7XHJcbiAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgaWQ6IGlkXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICBcIlxyXG4gID5cclxuICA8L25nLWNvbnRhaW5lcj5cclxuPC9kaXY+XHJcbiJdfQ==