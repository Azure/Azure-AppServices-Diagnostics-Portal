import { __awaiter } from 'tslib';
import * as i0 from '@angular/core';
import { Component, ViewChild, Input, EventEmitter, ViewEncapsulation, HostListener, Output, Injectable, TemplateRef, Type, ViewContainerRef, ComponentFactoryResolver, Directive, HostBinding, NgModule } from '@angular/core';
import * as i1 from '@angular/common';
import { CommonModule } from '@angular/common';

var NgFlowchart;
(function (NgFlowchart) {
    class Flow {
        constructor(canvas) {
            this.canvas = canvas;
        }
        /**
         * Returns the json representation of this flow
         * @param indent Optional indent to specify for formatting
         */
        toJSON(indent) {
            return JSON.stringify(this.toObject(), null, indent);
        }
        toObject() {
            var _a;
            return {
                root: (_a = this.canvas.flow.rootStep) === null || _a === void 0 ? void 0 : _a.toJSON()
            };
        }
        /**
         * Create a flow and render it on the canvas from a json string
         * @param json The json string of the flow to render
         */
        upload(json) {
            return __awaiter(this, void 0, void 0, function* () {
                let jsonObj = typeof json === 'string' ? JSON.parse(json) : json;
                let root = jsonObj.root;
                this.clear();
                yield this.canvas.upload(root);
            });
        }
        /**
         * Returns the root step of the flow chart
         */
        getRoot() {
            return this.canvas.flow.rootStep;
        }
        /**
         * Finds a step in the flow chart by a given id
         * @param id Id of the step to find. By default, the html id of the step
         */
        getStep(id) {
            return this.canvas.flow.steps.find(child => child.id == id);
        }
        /**
         * Re-renders the canvas. Generally this should only be used in rare circumstances
         * @param pretty Attempt to recenter the flow in the canvas
         */
        render(pretty) {
            this.canvas.reRender(pretty);
        }
        /**
         * Clears all flow chart, reseting the current canvas
         */
        clear() {
            var _a;
            if ((_a = this.canvas.flow) === null || _a === void 0 ? void 0 : _a.rootStep) {
                this.canvas.flow.rootStep.destroy(true, false);
                this.canvas.reRender();
            }
        }
    }
    NgFlowchart.Flow = Flow;
    class Options {
        constructor() {
            /** The gap (in pixels) between flow steps*/
            this.stepGap = 40;
            /** An inner deadzone radius (in pixels) that will not register the hover icon  */
            this.hoverDeadzoneRadius = 20;
            /** Is the flow sequential? If true, then you will not be able to drag parallel steps */
            this.isSequential = false;
            /** The default root position when dropped. Default is TOP_CENTER */
            this.rootPosition = 'TOP_CENTER';
            /** Should the canvas be centered when a resize is detected? */
            this.centerOnResize = true;
            /** Canvas zoom options. Defaults to mouse wheel zoom */
            this.zoom = {
                mode: 'WHEEL',
                defaultStep: .1
            };
        }
    }
    NgFlowchart.Options = Options;
})(NgFlowchart || (NgFlowchart = {}));

const CONSTANTS = {
    DROP_HOVER_ATTR: 'ngflowchart-drop-hover',
    CANVAS_CONTENT_CLASS: 'ngflowchart-canvas-content',
    CANVAS_CONTENT_ID: 'ngflowchart-canvas-content',
    CANVAS_CLASS: 'ngflowchart-canvas',
    CANVAS_STEP_CLASS: 'ngflowchart-canvas-step',
};

class NgFlowchartArrowComponent {
    constructor() {
        this.opacity = 1;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.containerLeft = 0;
        this.containerTop = 0;
        //to be applied on left and right edges
        this.padding = 10;
        this.isLeftFlowing = false;
    }
    set position(pos) {
        this._position = pos;
        this.isLeftFlowing = pos.start[0] > pos.end[0];
        //in the case where steps are directly underneath we need some minimum width
        this.containerWidth = Math.abs(pos.start[0] - pos.end[0]) + (this.padding * 2);
        this.containerLeft = Math.min(pos.start[0], pos.end[0]) - this.padding;
        this.containerHeight = Math.abs(pos.start[1] - pos.end[1]);
        this.containerTop = pos.start[1];
        this.updatePath();
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        this.updatePath();
    }
    hideArrow() {
        this.opacity = .2;
    }
    showArrow() {
        this.opacity = 1;
    }
    updatePath() {
        var _a;
        if (!((_a = this.arrow) === null || _a === void 0 ? void 0 : _a.nativeElement)) {
            return;
        }
        if (this.isLeftFlowing) {
            this.arrow.nativeElement.setAttribute("d", `
        M${this.containerWidth - this.padding},0 
        L${this.containerWidth - this.padding},${this.containerHeight / 2}
        L${this.padding},${this.containerHeight / 2}
        L${this.padding},${this.containerHeight - 4}
      `);
        }
        else {
            this.arrow.nativeElement.setAttribute("d", `
        M${this.padding},0 
        L${this.padding},${this.containerHeight / 2}
        L${this.containerWidth - this.padding},${this.containerHeight / 2}
        L${this.containerWidth - this.padding},${this.containerHeight - 4}
      `);
        }
    }
}
NgFlowchartArrowComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartArrowComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
NgFlowchartArrowComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartArrowComponent, selector: "lib-ng-flowchart-arrow", inputs: { position: "position" }, viewQueries: [{ propertyName: "arrow", first: true, predicate: ["arrow"], descendants: true }], ngImport: i0, template: "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  [ngStyle]=\"{\r\n      height: containerHeight+'px',\r\n      width: containerWidth+'px',\r\n      left: containerLeft+'px',\r\n      top: containerTop+'px',\r\n      opacity: opacity\r\n  }\"\r\n  class=\"ngflowchart-arrow\"\r\n>\r\n  <defs>\r\n    <marker\r\n      id=\"arrowhead\"\r\n      viewBox=\"0 0 10 10\"\r\n      refX=\"3\"\r\n      refY=\"5\"\r\n      markerWidth=\"5\"\r\n      markerHeight=\"5\"\r\n      orient=\"auto\"\r\n      fill=\"grey\"\r\n    >\r\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\r\n    </marker>\r\n  </defs>\r\n  <g id=\"arrowpath\" fill=\"none\" stroke=\"grey\" stroke-width=\"2\" marker-end=\"url(#arrowhead)\">\r\n    <path id=\"arrow\" #arrow />\r\n  </g>\r\n</svg>\r\n", styles: ["svg{position:absolute;z-index:0;transition:all .2s}\n"], directives: [{ type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartArrowComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-ng-flowchart-arrow', template: "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  [ngStyle]=\"{\r\n      height: containerHeight+'px',\r\n      width: containerWidth+'px',\r\n      left: containerLeft+'px',\r\n      top: containerTop+'px',\r\n      opacity: opacity\r\n  }\"\r\n  class=\"ngflowchart-arrow\"\r\n>\r\n  <defs>\r\n    <marker\r\n      id=\"arrowhead\"\r\n      viewBox=\"0 0 10 10\"\r\n      refX=\"3\"\r\n      refY=\"5\"\r\n      markerWidth=\"5\"\r\n      markerHeight=\"5\"\r\n      orient=\"auto\"\r\n      fill=\"grey\"\r\n    >\r\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\r\n    </marker>\r\n  </defs>\r\n  <g id=\"arrowpath\" fill=\"none\" stroke=\"grey\" stroke-width=\"2\" marker-end=\"url(#arrowhead)\">\r\n    <path id=\"arrow\" #arrow />\r\n  </g>\r\n</svg>\r\n", styles: ["svg{position:absolute;z-index:0;transition:all .2s}\n"] }]
        }], ctorParameters: function () { return []; }, propDecorators: { arrow: [{
                type: ViewChild,
                args: ['arrow']
            }], position: [{
                type: Input
            }] } });

class NgFlowchartStepComponent {
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
    onUpload(data) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
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
    addChild(pending, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let componentRef = yield this.canvas.createStep(pending);
            this.canvas.addToCanvas(componentRef);
            if (options === null || options === void 0 ? void 0 : options.sibling) {
                this.zaddChildSibling0(componentRef.instance, options === null || options === void 0 ? void 0 : options.index);
            }
            else {
                this.zaddChild0(componentRef.instance);
            }
            this.canvas.flow.addStep(componentRef.instance);
            this.canvas.reRender();
            return componentRef.instance;
        });
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
            bottom: this._currentPosition[1] + clientRect.height + ((canvasRect === null || canvasRect === void 0 ? void 0 : canvasRect.top) || 0),
            left: this._currentPosition[0] + ((canvasRect === null || canvasRect === void 0 ? void 0 : canvasRect.left) || 0),
            height: clientRect.height,
            width: clientRect.width,
            right: this._currentPosition[0] + clientRect.width + ((canvasRect === null || canvasRect === void 0 ? void 0 : canvasRect.left) || 0),
            top: this._currentPosition[1] + ((canvasRect === null || canvasRect === void 0 ? void 0 : canvasRect.top) || 0)
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
        var _a;
        return (_a = this.view) === null || _a === void 0 ? void 0 : _a.nativeElement;
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

class DropDataService {
    constructor() {
    }
    setDragStep(ref) {
        this.dragStep = ref;
    }
    getDragStep() {
        return this.dragStep;
    }
}
DropDataService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: DropDataService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
DropDataService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: DropDataService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: DropDataService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

class OptionsService {
    constructor() {
        this._callbacks = {};
        this._options = new NgFlowchart.Options();
    }
    setOptions(options) {
        this._options = this.sanitizeOptions(options);
    }
    setCallbacks(callbacks) {
        this._callbacks = callbacks;
    }
    get options() {
        return this._options;
    }
    get callbacks() {
        return this._callbacks;
    }
    sanitizeOptions(options) {
        const defaultOpts = new NgFlowchart.Options();
        options = Object.assign(Object.assign({}, defaultOpts), options);
        options.stepGap = Math.max(options.stepGap, 20) || 40;
        options.hoverDeadzoneRadius = Math.max(options.hoverDeadzoneRadius, 0) || 20;
        return options;
    }
}
OptionsService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
OptionsService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });

class CanvasRendererService {
    constructor(options) {
        this.options = options;
        this.scale = 1;
        this.scaleDebounceTimer = null;
    }
    init(viewContainer) {
        this.viewContainer = viewContainer;
    }
    renderRoot(step, dragEvent) {
        this.getCanvasContentElement().appendChild((step.location.nativeElement));
        this.setRootPosition(step.instance, dragEvent);
    }
    renderNonRoot(step, dragEvent) {
        this.getCanvasContentElement().appendChild((step.location.nativeElement));
    }
    updatePosition(step, dragEvent) {
        let relativeXY = this.getRelativeXY(dragEvent);
        relativeXY = relativeXY.map(coord => coord / this.scale);
        step.zsetPosition(relativeXY, true);
    }
    getStepGap() {
        return this.options.options.stepGap;
    }
    renderChildTree(rootNode, rootRect, canvasRect) {
        //the rootNode passed in is already rendered. just need to render its children /subtree
        if (!rootNode.hasChildren()) {
            return;
        }
        //top of the child row is simply the relative bottom of the root + stepGap
        const childYTop = (rootRect.bottom - canvasRect.top * this.scale) + this.getStepGap();
        const rootWidth = rootRect.width / this.scale;
        const rootXCenter = (rootRect.left - canvasRect.left) + (rootWidth / 2);
        //get the width of the child trees
        let childTreeWidths = {};
        let totalTreeWidth = 0;
        rootNode.children.forEach(child => {
            let totalChildWidth = child.getNodeTreeWidth(this.getStepGap());
            totalChildWidth = totalChildWidth / this.scale;
            childTreeWidths[child.nativeElement.id] = totalChildWidth;
            totalTreeWidth += totalChildWidth;
        });
        //add length for stepGaps between child trees
        totalTreeWidth += (rootNode.children.length - 1) * this.getStepGap();
        //if we have more than 1 child, we want half the extent on the left and half on the right
        let leftXTree = rootXCenter - (totalTreeWidth / 2);
        // dont allow it to go negative since you cant scroll that way
        leftXTree = Math.max(0, leftXTree);
        rootNode.children.forEach(child => {
            let childExtent = childTreeWidths[child.nativeElement.id];
            let childLeft = leftXTree + (childExtent / 2) - (child.nativeElement.offsetWidth / 2);
            child.zsetPosition([childLeft, childYTop]);
            const currentChildRect = child.getCurrentRect(canvasRect);
            const childWidth = currentChildRect.width / this.scale;
            child.zdrawArrow([rootXCenter, (rootRect.bottom - canvasRect.top * this.scale)], [currentChildRect.left + childWidth / 2 - canvasRect.left, currentChildRect.top - canvasRect.top]);
            this.renderChildTree(child, currentChildRect, canvasRect);
            leftXTree += childExtent + this.getStepGap();
        });
    }
    render(flow, pretty, skipAdjustDimensions = false) {
        var _a, _b, _c;
        if (!flow.hasRoot()) {
            if (this.options.options.zoom.mode === 'DISABLED') {
                this.resetAdjustDimensions();
                // Trigger afterRender to allow nested canvas to redraw parent canvas.
                // Not sure if this scenario should also trigger beforeRender.
                if ((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.afterRender) {
                    this.options.callbacks.afterRender();
                }
            }
            return;
        }
        if ((_b = this.options.callbacks) === null || _b === void 0 ? void 0 : _b.beforeRender) {
            this.options.callbacks.beforeRender();
        }
        const canvasRect = this.getCanvasContentElement().getBoundingClientRect();
        if (pretty) {
            //this will place the root at the top center of the canvas and render from there
            this.setRootPosition(flow.rootStep, null);
        }
        this.renderChildTree(flow.rootStep, flow.rootStep.getCurrentRect(canvasRect), canvasRect);
        if (!skipAdjustDimensions && this.options.options.zoom.mode === 'DISABLED') {
            this.adjustDimensions(flow, canvasRect);
        }
        if ((_c = this.options.callbacks) === null || _c === void 0 ? void 0 : _c.afterRender) {
            this.options.callbacks.afterRender();
        }
    }
    resetAdjustDimensions() {
        // reset canvas auto sizing to original size if empty
        if (this.viewContainer) {
            const canvasWrapper = this.getCanvasContentElement();
            canvasWrapper.style.minWidth = null;
            canvasWrapper.style.minHeight = null;
        }
    }
    findDropLocationForHover(absMouseXY, targetStep, stepToDrop) {
        if (!targetStep.shouldEvalDropHover(absMouseXY, stepToDrop)) {
            return 'deadzone';
        }
        const stepRect = targetStep.nativeElement.getBoundingClientRect();
        const yStepCenter = stepRect.bottom - stepRect.height / 2;
        const xStepCenter = stepRect.left + stepRect.width / 2;
        const yDiff = absMouseXY[1] - yStepCenter;
        const xDiff = absMouseXY[0] - xStepCenter;
        const absYDistance = Math.abs(yDiff);
        const absXDistance = Math.abs(xDiff);
        //#math class #Pythagoras
        const distance = Math.sqrt(absYDistance * absYDistance + absXDistance * absXDistance);
        const accuracyRadius = (stepRect.height + stepRect.width) / 2;
        let result = null;
        if (distance < accuracyRadius) {
            if (distance < this.options.options.hoverDeadzoneRadius) {
                //basically we are too close to the middle to accurately predict what position they want
                result = 'deadzone';
            }
            if (absYDistance > absXDistance) {
                result = {
                    step: targetStep,
                    position: yDiff > 0 ? 'BELOW' : 'ABOVE',
                    proximity: absYDistance
                };
            }
            else if (!this.options.options.isSequential && !targetStep.isRootElement()) {
                result = {
                    step: targetStep,
                    position: xDiff > 0 ? 'RIGHT' : 'LEFT',
                    proximity: absXDistance
                };
            }
        }
        if (result && result !== 'deadzone') {
            if (!targetStep.getDropPositionsForStep(stepToDrop).includes(result.position)) {
                //we had a valid drop but the target step doesnt allow this location
                result = null;
            }
        }
        return result;
    }
    adjustDimensions(flow, canvasRect) {
        let maxRight = 0;
        let maxBottom = 0;
        //TODO this can be better
        flow.steps.forEach(ele => {
            let rect = ele.getCurrentRect(canvasRect);
            maxRight = Math.max(rect.right, maxRight);
            maxBottom = Math.max(rect.bottom, maxBottom);
        });
        const widthBorderGap = 100;
        const widthDiff = canvasRect.width - (maxRight - canvasRect.left);
        if (widthDiff < widthBorderGap) {
            let growWidth = widthBorderGap;
            if (widthDiff < 0) {
                growWidth += Math.abs(widthDiff);
            }
            this.getCanvasContentElement().style.minWidth = `${canvasRect.width + growWidth}px`;
            if (this.options.options.centerOnResize) {
                this.render(flow, true, true);
            }
        }
        else if (widthDiff > widthBorderGap) {
            var totalTreeWidth = this.getTotalTreeWidth(flow);
            if (this.isNestedCanvas()) {
                this.getCanvasContentElement().style.minWidth = `${totalTreeWidth + widthBorderGap}px`;
                if (this.options.options.centerOnResize) {
                    this.render(flow, true, true);
                }
            }
            else if (this.getCanvasContentElement().style.minWidth) {
                // reset normal canvas width if auto width set
                this.getCanvasContentElement().style.minWidth = null;
                if (this.options.options.centerOnResize) {
                    this.render(flow, true, true);
                }
            }
        }
        const heightBorderGap = 50;
        const heightDiff = canvasRect.height - (maxBottom - canvasRect.top);
        if (heightDiff < heightBorderGap) {
            let growHeight = heightBorderGap;
            if (heightDiff < 0) {
                growHeight += Math.abs(heightDiff);
            }
            this.getCanvasContentElement().style.minHeight = `${canvasRect.height + growHeight}px`;
        }
        else if (heightDiff > heightBorderGap) {
            if (this.isNestedCanvas()) {
                let shrinkHeight = heightDiff - heightBorderGap;
                this.getCanvasContentElement().style.minHeight = `${canvasRect.height - shrinkHeight}px`;
            }
            else if (this.getCanvasContentElement().style.minHeight) {
                // reset normal canvas height if auto height set
                this.getCanvasContentElement().style.minHeight = null;
            }
        }
    }
    getTotalTreeWidth(flow) {
        let totalTreeWidth = 0;
        const rootWidth = flow.rootStep.getCurrentRect().width / this.scale;
        flow.rootStep.children.forEach(child => {
            let totalChildWidth = child.getNodeTreeWidth(this.getStepGap());
            totalTreeWidth += totalChildWidth / this.scale;
        });
        totalTreeWidth += (flow.rootStep.children.length - 1) * this.getStepGap();
        // total tree width doesn't give root width
        return Math.max(totalTreeWidth, rootWidth);
    }
    findBestMatchForSteps(dragStep, event, steps) {
        const absXY = [event.clientX, event.clientY];
        let bestMatch = null;
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            if (step.isHidden()) {
                continue;
            }
            const position = this.findDropLocationForHover(absXY, step, dragStep);
            if (position) {
                if (position == 'deadzone') {
                    bestMatch = null;
                    break;
                }
                //if this step is closer than previous best match then we have a new best
                else if (bestMatch == null || bestMatch.proximity > position.proximity) {
                    bestMatch = position;
                }
            }
        }
        return bestMatch;
    }
    findAndShowClosestDrop(dragStep, event, steps) {
        if (!steps || steps.length == 0) {
            return;
        }
        let bestMatch = this.findBestMatchForSteps(dragStep, event, steps);
        // TODO make this more efficient. two loops
        steps.forEach(step => {
            if (bestMatch == null || step.nativeElement.id !== bestMatch.step.nativeElement.id) {
                step.clearHoverIcons();
            }
        });
        if (!bestMatch) {
            return;
        }
        bestMatch.step.showHoverIcon(bestMatch.position);
        return {
            step: bestMatch.step,
            position: bestMatch.position
        };
    }
    showSnaps(dragStep) {
    }
    clearAllSnapIndicators(steps) {
        steps.forEach(step => step.clearHoverIcons());
    }
    setRootPosition(step, dragEvent) {
        if (!dragEvent) {
            const canvasTop = this.getCanvasTopCenterPosition(step.nativeElement);
            step.zsetPosition(canvasTop, true);
            return;
        }
        switch (this.options.options.rootPosition) {
            case 'CENTER':
                const canvasCenter = this.getCanvasCenterPosition();
                step.zsetPosition(canvasCenter, true);
                return;
            case 'TOP_CENTER':
                const canvasTop = this.getCanvasTopCenterPosition(step.nativeElement);
                step.zsetPosition(canvasTop, true);
                return;
            default:
                const relativeXY = this.getRelativeXY(dragEvent);
                step.zsetPosition(relativeXY, true);
                return;
        }
    }
    getRelativeXY(dragEvent) {
        const canvasRect = this.getCanvasContentElement().getBoundingClientRect();
        return [
            dragEvent.clientX - canvasRect.left,
            dragEvent.clientY - canvasRect.top
        ];
    }
    getCanvasTopCenterPosition(htmlRootElement) {
        const canvasRect = this.getCanvasContentElement().getBoundingClientRect();
        const rootElementHeight = htmlRootElement.getBoundingClientRect().height;
        const yCoord = rootElementHeight / 2 + this.options.options.stepGap;
        const scaleYOffset = (1 - this.scale) * 100;
        return [
            canvasRect.width / (this.scale * 2),
            yCoord + scaleYOffset
        ];
    }
    getCanvasCenterPosition() {
        const canvasRect = this.getCanvasContentElement().getBoundingClientRect();
        return [
            canvasRect.width / 2,
            canvasRect.height / 2
        ];
    }
    getCanvasContentElement() {
        const canvas = this.viewContainer.element.nativeElement;
        let canvasContent = canvas.getElementsByClassName(CONSTANTS.CANVAS_CONTENT_CLASS).item(0);
        return canvasContent;
    }
    isNestedCanvas() {
        if (this.viewContainer) {
            const canvasWrapper = this.viewContainer.element.nativeElement.parentElement;
            if (canvasWrapper) {
                return canvasWrapper.classList.contains('ngflowchart-step-wrapper');
            }
        }
        return false;
    }
    resetScale(flow) {
        this.setScale(flow, 1);
    }
    scaleUp(flow, step) {
        const newScale = this.scale + (this.scale * step || this.options.options.zoom.defaultStep);
        this.setScale(flow, newScale);
    }
    scaleDown(flow, step) {
        const newScale = this.scale - (this.scale * step || this.options.options.zoom.defaultStep);
        this.setScale(flow, newScale);
    }
    setScale(flow, scaleValue) {
        var _a;
        const minDimAdjust = `${1 / scaleValue * 100}%`;
        const canvasContent = this.getCanvasContentElement();
        canvasContent.style.transform = `scale(${scaleValue})`;
        canvasContent.style.minHeight = minDimAdjust;
        canvasContent.style.minWidth = minDimAdjust;
        canvasContent.style.transformOrigin = 'top left';
        canvasContent.classList.add('scaling');
        this.scale = scaleValue;
        this.render(flow, true);
        if ((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.afterScale) {
            this.options.callbacks.afterScale(this.scale);
        }
        this.scaleDebounceTimer && clearTimeout(this.scaleDebounceTimer);
        this.scaleDebounceTimer = setTimeout(() => {
            canvasContent.classList.remove('scaling');
        }, 300);
    }
}
CanvasRendererService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService, deps: [{ token: OptionsService }], target: i0.ɵɵFactoryTarget.Injectable });
CanvasRendererService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: OptionsService }]; } });

class NgFlowchartStepRegistry {
    constructor() {
        this.registry = new Map();
    }
    /**
     * Register a step implementation. Only needed if you are uploading a flow from json
     * @param type The unique type of the step
     * @param step The step templateRef or component type to create for this key
     */
    registerStep(type, step) {
        this.registry.set(type, step);
    }
    getStepImpl(type) {
        return this.registry.get(type);
    }
}
NgFlowchartStepRegistry.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepRegistry, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
NgFlowchartStepRegistry.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepRegistry, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepRegistry, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: function () { return []; } });

/**
 * This service handles adding new steps to the canvas
 */
class StepManagerService {
    constructor(componentFactoryResolver, registry) {
        this.componentFactoryResolver = componentFactoryResolver;
        this.registry = registry;
    }
    init(viewContainer) {
        this.viewContainer = viewContainer;
    }
    createFromRegistry(id, type, data, canvas) {
        let templateComp = this.registry.getStepImpl(type);
        let compRef;
        if (templateComp instanceof TemplateRef || templateComp instanceof Type) {
            compRef = this.create({
                template: templateComp,
                type: type,
                data: data
            }, canvas);
        }
        else {
            throw 'Invalid registry implementation found for type ' + type;
        }
        compRef.instance.setId(id);
        return compRef;
    }
    create(pendingStep, canvas) {
        let componentRef;
        if (pendingStep.template instanceof TemplateRef) {
            const factory = this.componentFactoryResolver.resolveComponentFactory(NgFlowchartStepComponent);
            componentRef = this.viewContainer.createComponent(factory);
            componentRef.instance.contentTemplate = pendingStep.template;
        }
        else {
            const factory = this.componentFactoryResolver.resolveComponentFactory(pendingStep.template);
            componentRef = this.viewContainer.createComponent(factory);
        }
        componentRef.instance.data = JSON.parse(JSON.stringify(pendingStep.data));
        componentRef.instance.type = pendingStep.type;
        componentRef.instance.canvas = canvas;
        componentRef.instance.compRef = componentRef;
        componentRef.instance.init(componentRef.injector.get(DropDataService), componentRef.injector.get(ViewContainerRef), componentRef.injector.get(ComponentFactoryResolver));
        return componentRef;
    }
}
StepManagerService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: StepManagerService, deps: [{ token: i0.ComponentFactoryResolver }, { token: NgFlowchartStepRegistry }], target: i0.ɵɵFactoryTarget.Injectable });
StepManagerService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: StepManagerService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: StepManagerService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i0.ComponentFactoryResolver }, { type: NgFlowchartStepRegistry }]; } });

class CanvasFlow {
    constructor() {
        // steps from this canvas only
        this._steps = [];
    }
    hasRoot() {
        return !!this.rootStep;
    }
    addStep(step) {
        this._steps.push(step);
    }
    removeStep(step) {
        let index = this._steps.findIndex(ele => ele.id == step.id);
        if (index >= 0) {
            this._steps.splice(index, 1);
        }
    }
    get steps() {
        return this._steps;
    }
}
class NgFlowchartCanvasService {
    constructor(drag, options, renderer, stepmanager) {
        this.drag = drag;
        this.options = options;
        this.renderer = renderer;
        this.stepmanager = stepmanager;
        this.isDragging = false;
        this.flow = new CanvasFlow();
        this._disabled = false;
        this.noParentError = {
            code: 'NO_PARENT',
            message: 'Step was not dropped under a parent and is not the root node'
        };
    }
    get disabled() {
        return this._disabled;
    }
    init(view) {
        this.viewContainer = view;
        this.renderer.init(view);
        this.stepmanager.init(view);
        //hack to load the css
        let ref = this.stepmanager.create({
            template: NgFlowchartStepComponent,
            type: '',
            data: null
        }, this);
        const i = this.viewContainer.indexOf(ref.hostView);
        this.viewContainer.remove(i);
    }
    moveStep(drag, id) {
        var _a;
        this.renderer.clearAllSnapIndicators(this.flow.steps);
        let step = this.flow.steps.find(step => step.nativeElement.id === id);
        let error = {};
        if (!step) {
            // step cannot be moved if not in this canvas
            return;
        }
        if (step.canDrop(this.currentDropTarget, error)) {
            if (step.isRootElement()) {
                this.renderer.updatePosition(step, drag);
                this.renderer.render(this.flow);
            }
            else if (this.currentDropTarget) {
                const response = this.addStepToFlow(step, this.currentDropTarget, true);
                this.renderer.render(this.flow, response.prettyRender);
            }
            else {
                this.moveError(step, this.noParentError);
            }
            if (((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.onDropStep) && (this.currentDropTarget || step.isRootElement())) {
                this.options.callbacks.onDropStep({
                    isMove: true,
                    step: step,
                    parent: step.parent
                });
            }
        }
        else {
            this.moveError(step, error);
        }
    }
    onDrop(drag) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.renderer.clearAllSnapIndicators(this.flow.steps);
            if (this.flow.hasRoot() && !this.currentDropTarget) {
                this.dropError(this.noParentError);
                return;
            }
            //TODO just pass dragStep here, but come up with a better name and move the type to flow.model
            let componentRef = yield this.createStep(this.drag.dragStep);
            const dropTarget = this.currentDropTarget || null;
            let error = {};
            if (componentRef.instance.canDrop(dropTarget, error)) {
                if (!this.flow.hasRoot()) {
                    this.renderer.renderRoot(componentRef, drag);
                    this.setRoot(componentRef.instance);
                }
                else {
                    // if root is replaced by another step, rerender root to proper position
                    if (dropTarget.step.isRootElement() && dropTarget.position === 'ABOVE') {
                        this.renderer.renderRoot(componentRef, drag);
                    }
                    this.addChildStep(componentRef, dropTarget);
                }
                if ((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.onDropStep) {
                    this.options.callbacks.onDropStep({
                        step: componentRef.instance,
                        isMove: false,
                        parent: componentRef.instance.parent
                    });
                }
            }
            else {
                const i = this.viewContainer.indexOf(componentRef.hostView);
                this.viewContainer.remove(i);
                this.dropError(error);
            }
        });
    }
    onDragStart(drag) {
        this.isDragging = true;
        this.currentDropTarget = this.renderer.findAndShowClosestDrop(this.drag.dragStep, drag, this.flow.steps);
    }
    createStepFromType(id, type, data) {
        let compRef = this.stepmanager.createFromRegistry(id, type, data, this);
        return new Promise((resolve) => {
            let sub = compRef.instance.viewInit.subscribe(() => __awaiter(this, void 0, void 0, function* () {
                sub.unsubscribe();
                setTimeout(() => {
                    compRef.instance.onUpload(data);
                });
                resolve(compRef);
            }));
        });
    }
    createStep(pending) {
        let componentRef;
        componentRef = this.stepmanager.create(pending, this);
        return new Promise((resolve) => {
            let sub = componentRef.instance.viewInit.subscribe(() => {
                sub.unsubscribe();
                resolve(componentRef);
            }, error => console.error(error));
        });
    }
    resetScale() {
        if (this.options.options.zoom.mode === 'DISABLED') {
            return;
        }
        this.renderer.resetScale(this.flow);
    }
    scaleUp(step) {
        if (this.options.options.zoom.mode === 'DISABLED') {
            return;
        }
        this.renderer.scaleUp(this.flow, step);
    }
    scaleDown(step) {
        if (this.options.options.zoom.mode === 'DISABLED') {
            return;
        }
        this.renderer.scaleDown(this.flow, step);
    }
    setScale(scaleValue) {
        if (this.options.options.zoom.mode === 'DISABLED') {
            return;
        }
        this.renderer.setScale(this.flow, scaleValue);
    }
    addChildStep(componentRef, dropTarget) {
        this.addToCanvas(componentRef);
        const response = this.addStepToFlow(componentRef.instance, dropTarget);
        this.renderer.render(this.flow, response.prettyRender);
    }
    addToCanvas(componentRef) {
        this.renderer.renderNonRoot(componentRef);
    }
    reRender(pretty) {
        this.renderer.render(this.flow, pretty);
    }
    upload(root) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.uploadNode(root);
            this.reRender(true);
        });
    }
    uploadNode(node, parentNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!node) {
                // no node to upload when uploading empty nested flow
                return;
            }
            let comp = yield this.createStepFromType(node.id, node.type, node.data);
            if (!parentNode) {
                this.setRoot(comp.instance);
                this.renderer.renderRoot(comp, null);
            }
            else {
                this.renderer.renderNonRoot(comp);
                this.flow.addStep(comp.instance);
            }
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                let childComp = yield this.uploadNode(child, comp.instance);
                comp.instance.children.push(childComp);
                childComp.setParent(comp.instance, true);
            }
            return comp.instance;
        });
    }
    setRoot(step, force = true) {
        if (this.flow.hasRoot()) {
            if (!force) {
                console.warn('Already have a root and force is false');
                return;
            }
            //reparent root
            let oldRoot = this.flow.rootStep;
            this.flow.rootStep = step;
            step.zaddChild0(oldRoot);
        }
        else {
            this.flow.rootStep = step;
        }
        this.flow.addStep(step);
    }
    addStepToFlow(step, dropTarget, isMove = false) {
        let response = {
            added: false,
            prettyRender: false,
        };
        switch (dropTarget.position) {
            case 'ABOVE':
                response = this.placeStepAbove(step, dropTarget.step);
                break;
            case 'BELOW':
                response = this.placeStepBelow(step, dropTarget.step);
                console.log(response, [...dropTarget.step.children]);
                break;
            case 'LEFT':
                response = this.placeStepAdjacent(step, dropTarget.step, true);
                break;
            case 'RIGHT':
                response = this.placeStepAdjacent(step, dropTarget.step, false);
                break;
            default:
                break;
        }
        if (!isMove && response.added) {
            this.flow.addStep(step);
        }
        return response;
    }
    placeStepBelow(newStep, parentStep) {
        return {
            added: parentStep.zaddChild0(newStep),
            prettyRender: false,
        };
    }
    placeStepAdjacent(newStep, siblingStep, isLeft = true) {
        if (siblingStep.parent) {
            //find the adjacent steps index in the parents child array
            const adjacentIndex = siblingStep.parent.children.findIndex(child => child.nativeElement.id == siblingStep.nativeElement.id);
            siblingStep.parent.zaddChildSibling0(newStep, adjacentIndex + (isLeft ? 0 : 1));
        }
        else {
            console.warn('Parallel actions must have a common parent');
            return {
                added: false,
                prettyRender: false,
            };
        }
        return {
            added: true,
            prettyRender: false,
        };
    }
    placeStepAbove(newStep, childStep) {
        var _a;
        let prettyRender = false;
        let newParent = childStep.parent;
        if (newParent) {
            //we want to remove child and insert our newStep at the same index
            let index = newParent.removeChild(childStep);
            newStep.zaddChild0(childStep);
            newParent.zaddChild0(newStep);
        }
        else { // new root node
            (_a = newStep.parent) === null || _a === void 0 ? void 0 : _a.removeChild(newStep);
            newStep.setParent(null, true);
            //if the new step was a direct child of the root step, we need to break that connection
            childStep.removeChild(newStep);
            this.setRoot(newStep);
            prettyRender = true;
        }
        return {
            added: true,
            prettyRender
        };
    }
    dropError(error) {
        var _a, _b, _c, _d;
        if ((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.onDropError) {
            let parent = ((_b = this.currentDropTarget) === null || _b === void 0 ? void 0 : _b.position) !== 'BELOW' ? (_c = this.currentDropTarget) === null || _c === void 0 ? void 0 : _c.step.parent : (_d = this.currentDropTarget) === null || _d === void 0 ? void 0 : _d.step;
            this.options.callbacks.onDropError({
                step: this.drag.dragStep,
                parent: parent || null,
                error: error
            });
        }
    }
    moveError(step, error) {
        var _a, _b, _c, _d;
        if ((_a = this.options.callbacks) === null || _a === void 0 ? void 0 : _a.onMoveError) {
            let parent = ((_b = this.currentDropTarget) === null || _b === void 0 ? void 0 : _b.position) !== 'BELOW' ? (_c = this.currentDropTarget) === null || _c === void 0 ? void 0 : _c.step.parent : (_d = this.currentDropTarget) === null || _d === void 0 ? void 0 : _d.step;
            this.options.callbacks.onMoveError({
                step: {
                    instance: step,
                    type: step.type,
                    data: step.data
                },
                parent: parent,
                error: error
            });
        }
    }
}
NgFlowchartCanvasService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService, deps: [{ token: DropDataService }, { token: OptionsService }, { token: CanvasRendererService }, { token: StepManagerService }], target: i0.ɵɵFactoryTarget.Injectable });
NgFlowchartCanvasService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: DropDataService }, { type: OptionsService }, { type: CanvasRendererService }, { type: StepManagerService }]; } });

class NgFlowchartCanvasDirective {
    constructor(canvasEle, viewContainer, canvas, optionService) {
        this.canvasEle = canvasEle;
        this.viewContainer = viewContainer;
        this.canvas = canvas;
        this.optionService = optionService;
        this._disabled = false;
        this._id = null;
        this.canvasEle.nativeElement.classList.add(CONSTANTS.CANVAS_CLASS);
        this.canvasContent = this.createCanvasContent(this.viewContainer);
        this._id = this.canvasContent.id;
    }
    onDrop(event) {
        var _a;
        if (this._disabled) {
            return;
        }
        // its possible multiple canvases exist so make sure we only move/drop on the closest one
        const closestCanvasId = (_a = event.target.closest('.ngflowchart-canvas-content')) === null || _a === void 0 ? void 0 : _a.id;
        if (this._id !== closestCanvasId) {
            return;
        }
        const type = event.dataTransfer.getData('type');
        if ('FROM_CANVAS' == type) {
            this.canvas.moveStep(event, event.dataTransfer.getData('id'));
        }
        else {
            this.canvas.onDrop(event);
        }
    }
    onDragOver(event) {
        event.preventDefault();
        if (this._disabled) {
            return;
        }
        this.canvas.onDragStart(event);
    }
    onResize(event) {
        if (this._options.centerOnResize) {
            this.canvas.reRender(true);
        }
    }
    onZoom(event) {
        if (this._options.zoom.mode === 'WHEEL') {
            this.adjustWheelScale(event);
        }
    }
    set callbacks(callbacks) {
        this.optionService.setCallbacks(callbacks);
    }
    set options(options) {
        this.optionService.setOptions(options);
        this._options = this.optionService.options;
        this.canvas.reRender();
    }
    get options() {
        return this._options;
    }
    set disabled(val) {
        this._disabled = val !== false;
        if (this.canvas) {
            this.canvas._disabled = this._disabled;
        }
    }
    get disabled() {
        return this._disabled;
    }
    ngOnInit() {
        this.canvas.init(this.viewContainer);
        if (!this._options) {
            this.options = new NgFlowchart.Options();
        }
        this.canvas._disabled = this._disabled;
    }
    ngAfterViewInit() {
    }
    ngOnDestroy() {
        for (let i = 0; i < this.viewContainer.length; i++) {
            this.viewContainer.remove(i);
        }
        this.canvasEle.nativeElement.remove();
        this.viewContainer.element.nativeElement.remove();
        this.viewContainer = undefined;
    }
    createCanvasContent(viewContainer) {
        const canvasId = 'c' + Date.now();
        let canvasEle = viewContainer.element.nativeElement;
        let canvasContent = document.createElement('div');
        canvasContent.id = canvasId;
        canvasContent.classList.add(CONSTANTS.CANVAS_CONTENT_CLASS);
        canvasEle.appendChild(canvasContent);
        return canvasContent;
    }
    /**
     * Returns the Flow object representing this flow chart.
     */
    getFlow() {
        return new NgFlowchart.Flow(this.canvas);
    }
    scaleDown() {
        this.canvas.scaleDown();
    }
    scaleUp() {
        this.canvas.scaleUp();
    }
    setScale(scaleValue) {
        const scaleVal = Math.max(0, scaleValue);
        this.canvas.setScale(scaleVal);
    }
    adjustWheelScale(event) {
        if (this.canvas.flow.hasRoot()) {
            event.preventDefault();
            // scale down / zoom out
            if (event.deltaY > 0) {
                this.scaleDown();
            }
            // scale up / zoom in
            else if (event.deltaY < 0) {
                this.scaleUp();
            }
        }
    }
    ;
}
NgFlowchartCanvasDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasDirective, deps: [{ token: i0.ElementRef }, { token: i0.ViewContainerRef }, { token: NgFlowchartCanvasService }, { token: OptionsService }], target: i0.ɵɵFactoryTarget.Directive });
NgFlowchartCanvasDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartCanvasDirective, selector: "[ngFlowchartCanvas]", inputs: { callbacks: ["ngFlowchartCallbacks", "callbacks"], options: ["ngFlowchartOptions", "options"], disabled: "disabled" }, host: { listeners: { "drop": "onDrop($event)", "dragover": "onDragOver($event)", "window:resize": "onResize($event)", "wheel": "onZoom($event)" }, properties: { "attr.disabled": "this.disabled" } }, providers: [
        NgFlowchartCanvasService,
        StepManagerService,
        OptionsService,
        CanvasRendererService
    ], ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngFlowchartCanvas]',
                    providers: [
                        NgFlowchartCanvasService,
                        StepManagerService,
                        OptionsService,
                        CanvasRendererService
                    ]
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ViewContainerRef }, { type: NgFlowchartCanvasService }, { type: OptionsService }]; }, propDecorators: { onDrop: [{
                type: HostListener,
                args: ['drop', ['$event']]
            }], onDragOver: [{
                type: HostListener,
                args: ['dragover', ['$event']]
            }], onResize: [{
                type: HostListener,
                args: ['window:resize', ['$event']]
            }], onZoom: [{
                type: HostListener,
                args: ['wheel', ['$event']]
            }], callbacks: [{
                type: Input,
                args: ['ngFlowchartCallbacks']
            }], options: [{
                type: Input,
                args: ['ngFlowchartOptions']
            }], disabled: [{
                type: Input,
                args: ['disabled']
            }, {
                type: HostBinding,
                args: ['attr.disabled']
            }] } });

class NgFlowchartStepDirective {
    constructor(element, data) {
        this.element = element;
        this.data = data;
        this.element.nativeElement.setAttribute('draggable', 'true');
    }
    onDragStart(event) {
        this.data.setDragStep(this.flowStep);
        event.dataTransfer.setData('type', 'FROM_PALETTE');
    }
    onDragEnd(event) {
        this.data.setDragStep(null);
    }
    ngAfterViewInit() {
    }
}
NgFlowchartStepDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepDirective, deps: [{ token: i0.ElementRef }, { token: DropDataService }], target: i0.ɵɵFactoryTarget.Directive });
NgFlowchartStepDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartStepDirective, selector: "[ngFlowchartStep]", inputs: { flowStep: ["ngFlowchartStep", "flowStep"] }, host: { listeners: { "dragstart": "onDragStart($event)", "dragend": "onDragEnd($event)" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngFlowchartStep]'
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: DropDataService }]; }, propDecorators: { onDragStart: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }], onDragEnd: [{
                type: HostListener,
                args: ['dragend', ['$event']]
            }], flowStep: [{
                type: Input,
                args: ['ngFlowchartStep']
            }] } });

class NgFlowchartModule {
}
NgFlowchartModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
NgFlowchartModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartModule, declarations: [NgFlowchartCanvasDirective, NgFlowchartStepDirective, NgFlowchartStepComponent, NgFlowchartArrowComponent], imports: [CommonModule], exports: [NgFlowchartCanvasDirective, NgFlowchartStepDirective, NgFlowchartStepComponent, NgFlowchartArrowComponent] });
NgFlowchartModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartModule, imports: [[
            CommonModule
        ]] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [NgFlowchartCanvasDirective, NgFlowchartStepDirective, NgFlowchartStepComponent, NgFlowchartArrowComponent],
                    imports: [
                        CommonModule
                    ],
                    exports: [NgFlowchartCanvasDirective, NgFlowchartStepDirective, NgFlowchartStepComponent, NgFlowchartArrowComponent]
                }]
        }] });

/*
 * Public API Surface of ng-flowchart
 */

/**
 * Generated bundle index. Do not edit.
 */

export { NgFlowchart, NgFlowchartArrowComponent, NgFlowchartCanvasDirective, NgFlowchartModule, NgFlowchartStepComponent, NgFlowchartStepDirective, NgFlowchartStepRegistry, OptionsService };
//# sourceMappingURL=joelwenzel-ng-flowchart.mjs.map
