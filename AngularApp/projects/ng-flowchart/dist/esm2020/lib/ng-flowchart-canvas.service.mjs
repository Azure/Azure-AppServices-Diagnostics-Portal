import { Injectable } from '@angular/core';
import { NgFlowchartStepComponent } from './ng-flowchart-step/ng-flowchart-step.component';
import { CanvasRendererService } from './services/canvas-renderer.service';
import { DropDataService as DragService } from './services/dropdata.service';
import { OptionsService } from './services/options.service';
import { StepManagerService } from './services/step-manager.service';
import * as i0 from "@angular/core";
import * as i1 from "./services/dropdata.service";
import * as i2 from "./services/options.service";
import * as i3 from "./services/canvas-renderer.service";
import * as i4 from "./services/step-manager.service";
export class CanvasFlow {
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
export class NgFlowchartCanvasService {
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
            if (this.options.callbacks?.onDropStep && (this.currentDropTarget || step.isRootElement())) {
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
    async onDrop(drag) {
        this.renderer.clearAllSnapIndicators(this.flow.steps);
        if (this.flow.hasRoot() && !this.currentDropTarget) {
            this.dropError(this.noParentError);
            return;
        }
        //TODO just pass dragStep here, but come up with a better name and move the type to flow.model
        let componentRef = await this.createStep(this.drag.dragStep);
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
            if (this.options.callbacks?.onDropStep) {
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
    }
    onDragStart(drag) {
        this.isDragging = true;
        this.currentDropTarget = this.renderer.findAndShowClosestDrop(this.drag.dragStep, drag, this.flow.steps);
    }
    createStepFromType(id, type, data) {
        let compRef = this.stepmanager.createFromRegistry(id, type, data, this);
        return new Promise((resolve) => {
            let sub = compRef.instance.viewInit.subscribe(async () => {
                sub.unsubscribe();
                setTimeout(() => {
                    compRef.instance.onUpload(data);
                });
                resolve(compRef);
            });
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
    async upload(root) {
        await this.uploadNode(root);
        this.reRender(true);
    }
    async uploadNode(node, parentNode) {
        if (!node) {
            // no node to upload when uploading empty nested flow
            return;
        }
        let comp = await this.createStepFromType(node.id, node.type, node.data);
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
            let childComp = await this.uploadNode(child, comp.instance);
            comp.instance.children.push(childComp);
            childComp.setParent(comp.instance, true);
        }
        return comp.instance;
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
        let prettyRender = false;
        let newParent = childStep.parent;
        if (newParent) {
            //we want to remove child and insert our newStep at the same index
            let index = newParent.removeChild(childStep);
            newStep.zaddChild0(childStep);
            newParent.zaddChild0(newStep);
        }
        else { // new root node
            newStep.parent?.removeChild(newStep);
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
        if (this.options.callbacks?.onDropError) {
            let parent = this.currentDropTarget?.position !== 'BELOW' ? this.currentDropTarget?.step.parent : this.currentDropTarget?.step;
            this.options.callbacks.onDropError({
                step: this.drag.dragStep,
                parent: parent || null,
                error: error
            });
        }
    }
    moveError(step, error) {
        if (this.options.callbacks?.onMoveError) {
            let parent = this.currentDropTarget?.position !== 'BELOW' ? this.currentDropTarget?.step.parent : this.currentDropTarget?.step;
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
NgFlowchartCanvasService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService, deps: [{ token: i1.DropDataService }, { token: i2.OptionsService }, { token: i3.CanvasRendererService }, { token: i4.StepManagerService }], target: i0.ɵɵFactoryTarget.Injectable });
NgFlowchartCanvasService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.DropDataService }, { type: i2.OptionsService }, { type: i3.CanvasRendererService }, { type: i4.StepManagerService }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LWNhbnZhcy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9uZy1mbG93Y2hhcnQtY2FudmFzLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFnQixVQUFVLEVBQW9CLE1BQU0sZUFBZSxDQUFDO0FBRTNFLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLGlEQUFpRCxDQUFDO0FBQzNGLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBQzNFLE9BQU8sRUFBRSxlQUFlLElBQUksV0FBVyxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDN0UsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQzVELE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGlDQUFpQyxDQUFDOzs7Ozs7QUFPckUsTUFBTSxPQUFPLFVBQVU7SUEwQnJCO1FBdkJBLDhCQUE4QjtRQUN0QixXQUFNLEdBQStCLEVBQUUsQ0FBQztJQXdCaEQsQ0FBQztJQXRCRCxPQUFPO1FBQ0wsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN6QixDQUFDO0lBRUQsT0FBTyxDQUFDLElBQThCO1FBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3hCLENBQUM7SUFFRCxVQUFVLENBQUMsSUFBOEI7UUFFdkMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM1RCxJQUFJLEtBQUssSUFBSSxDQUFDLEVBQUU7WUFDZCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDOUI7SUFDSCxDQUFD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LENBQUMsSUFBSTtpQkFDaEI7Z0JBQ0QsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsS0FBSyxFQUFFLEtBQUs7YUFDYixDQUFDLENBQUE7U0FDSDtJQUNILENBQUM7O3NIQXhXVSx3QkFBd0I7MEhBQXhCLHdCQUF3Qjs0RkFBeEIsd0JBQXdCO2tCQURwQyxVQUFVIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9uZW50UmVmLCBJbmplY3RhYmxlLCBWaWV3Q29udGFpbmVyUmVmIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IE5nRmxvd2NoYXJ0IH0gZnJvbSAnLi9tb2RlbC9mbG93Lm1vZGVsJztcclxuaW1wb3J0IHsgTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50IH0gZnJvbSAnLi9uZy1mbG93Y2hhcnQtc3RlcC9uZy1mbG93Y2hhcnQtc3RlcC5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBDYW52YXNSZW5kZXJlclNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL2NhbnZhcy1yZW5kZXJlci5zZXJ2aWNlJztcclxuaW1wb3J0IHsgRHJvcERhdGFTZXJ2aWNlIGFzIERyYWdTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9kcm9wZGF0YS5zZXJ2aWNlJztcclxuaW1wb3J0IHsgT3B0aW9uc1NlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL29wdGlvbnMuc2VydmljZSc7XHJcbmltcG9ydCB7IFN0ZXBNYW5hZ2VyU2VydmljZSB9IGZyb20gJy4vc2VydmljZXMvc3RlcC1tYW5hZ2VyLnNlcnZpY2UnO1xyXG5cclxudHlwZSBEcm9wUmVzcG9uc2UgPSB7XHJcbiAgYWRkZWQ6IGJvb2xlYW4sXHJcbiAgcHJldHR5UmVuZGVyOiBib29sZWFuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDYW52YXNGbG93IHtcclxuICByb290U3RlcDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50O1xyXG5cclxuICAvLyBzdGVwcyBmcm9tIHRoaXMgY2FudmFzIG9ubHlcclxuICBwcml2YXRlIF9zdGVwczogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50W10gPSBbXTtcclxuXHJcbiAgaGFzUm9vdCgpIHtcclxuICAgIHJldHVybiAhIXRoaXMucm9vdFN0ZXA7XHJcbiAgfVxyXG5cclxuICBhZGRTdGVwKHN0ZXA6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCkge1xyXG4gICAgdGhpcy5fc3RlcHMucHVzaChzdGVwKVxyXG4gIH1cclxuXHJcbiAgcmVtb3ZlU3RlcChzdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQpIHtcclxuXHJcbiAgICBsZXQgaW5kZXggPSB0aGlzLl9zdGVwcy5maW5kSW5kZXgoZWxlID0+IGVsZS5pZCA9PSBzdGVwLmlkKTtcclxuICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgIHRoaXMuX3N0ZXBzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBnZXQgc3RlcHMoKTogUmVhZG9ubHlBcnJheTxOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ+IHtcclxuICAgIHJldHVybiB0aGlzLl9zdGVwcztcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICB9XHJcbn1cclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIE5nRmxvd2NoYXJ0Q2FudmFzU2VydmljZSB7XHJcblxyXG4gIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XHJcbiAgaXNEcmFnZ2luZzogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICBjdXJyZW50RHJvcFRhcmdldDogTmdGbG93Y2hhcnQuRHJvcFRhcmdldDtcclxuXHJcbiAgZmxvdzogQ2FudmFzRmxvdyA9IG5ldyBDYW52YXNGbG93KCk7XHJcblxyXG4gIF9kaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICBnZXQgZGlzYWJsZWQoKSB7XHJcbiAgICByZXR1cm4gdGhpcy5fZGlzYWJsZWQ7XHJcbiAgfVxyXG5cclxuICBub1BhcmVudEVycm9yID0ge1xyXG4gICAgY29kZTogJ05PX1BBUkVOVCcsXHJcbiAgICBtZXNzYWdlOiAnU3RlcCB3YXMgbm90IGRyb3BwZWQgdW5kZXIgYSBwYXJlbnQgYW5kIGlzIG5vdCB0aGUgcm9vdCBub2RlJ1xyXG4gIH07XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBkcmFnOiBEcmFnU2VydmljZSxcclxuICAgIHB1YmxpYyBvcHRpb25zOiBPcHRpb25zU2VydmljZSxcclxuICAgIHByaXZhdGUgcmVuZGVyZXI6IENhbnZhc1JlbmRlcmVyU2VydmljZSxcclxuICAgIHByaXZhdGUgc3RlcG1hbmFnZXI6IFN0ZXBNYW5hZ2VyU2VydmljZVxyXG4gICkge1xyXG5cclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgaW5pdCh2aWV3OiBWaWV3Q29udGFpbmVyUmVmKSB7XHJcbiAgICB0aGlzLnZpZXdDb250YWluZXIgPSB2aWV3O1xyXG4gICAgdGhpcy5yZW5kZXJlci5pbml0KHZpZXcpO1xyXG4gICAgdGhpcy5zdGVwbWFuYWdlci5pbml0KHZpZXcpO1xyXG5cclxuICAgIC8vaGFjayB0byBsb2FkIHRoZSBjc3NcclxuICAgIGxldCByZWYgPSB0aGlzLnN0ZXBtYW5hZ2VyLmNyZWF0ZSh7XHJcbiAgICAgIHRlbXBsYXRlOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsXHJcbiAgICAgIHR5cGU6ICcnLFxyXG4gICAgICBkYXRhOiBudWxsXHJcbiAgICB9LCB0aGlzKTtcclxuICAgIGNvbnN0IGkgPSB0aGlzLnZpZXdDb250YWluZXIuaW5kZXhPZihyZWYuaG9zdFZpZXcpXHJcbiAgICB0aGlzLnZpZXdDb250YWluZXIucmVtb3ZlKGkpO1xyXG5cclxuICB9XHJcblxyXG4gIHB1YmxpYyBtb3ZlU3RlcChkcmFnOiBEcmFnRXZlbnQsIGlkOiBhbnkpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuY2xlYXJBbGxTbmFwSW5kaWNhdG9ycyh0aGlzLmZsb3cuc3RlcHMpO1xyXG5cclxuICAgIGxldCBzdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQgPSB0aGlzLmZsb3cuc3RlcHMuZmluZChzdGVwID0+IHN0ZXAubmF0aXZlRWxlbWVudC5pZCA9PT0gaWQpO1xyXG4gICAgbGV0IGVycm9yID0ge307XHJcbiAgICBpZighc3RlcCkge1xyXG4gICAgICAvLyBzdGVwIGNhbm5vdCBiZSBtb3ZlZCBpZiBub3QgaW4gdGhpcyBjYW52YXNcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYgKHN0ZXAuY2FuRHJvcCh0aGlzLmN1cnJlbnREcm9wVGFyZ2V0LCBlcnJvcikpIHtcclxuICAgICAgaWYgKHN0ZXAuaXNSb290RWxlbWVudCgpKSB7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJlci51cGRhdGVQb3NpdGlvbihzdGVwLCBkcmFnKTtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLmZsb3cpO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKHRoaXMuY3VycmVudERyb3BUYXJnZXQpIHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IHRoaXMuYWRkU3RlcFRvRmxvdyhzdGVwLCB0aGlzLmN1cnJlbnREcm9wVGFyZ2V0LCB0cnVlKTtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlcih0aGlzLmZsb3csIHJlc3BvbnNlLnByZXR0eVJlbmRlcik7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5tb3ZlRXJyb3Ioc3RlcCwgdGhpcy5ub1BhcmVudEVycm9yKTtcclxuICAgICAgfVxyXG4gICAgICBpZiAodGhpcy5vcHRpb25zLmNhbGxiYWNrcz8ub25Ecm9wU3RlcCAmJiAodGhpcy5jdXJyZW50RHJvcFRhcmdldCB8fCBzdGVwLmlzUm9vdEVsZW1lbnQoKSkpIHtcclxuICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2tzLm9uRHJvcFN0ZXAoe1xyXG4gICAgICAgICAgaXNNb3ZlOiB0cnVlLFxyXG4gICAgICAgICAgc3RlcDogc3RlcCxcclxuICAgICAgICAgIHBhcmVudDogc3RlcC5wYXJlbnRcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5tb3ZlRXJyb3Ioc3RlcCwgZXJyb3IpO1xyXG4gICAgfVxyXG5cclxuICB9XHJcblxyXG5cclxuXHJcbiAgcHVibGljIGFzeW5jIG9uRHJvcChkcmFnOiBEcmFnRXZlbnQpIHtcclxuICAgIHRoaXMucmVuZGVyZXIuY2xlYXJBbGxTbmFwSW5kaWNhdG9ycyh0aGlzLmZsb3cuc3RlcHMpO1xyXG5cclxuICAgIGlmICh0aGlzLmZsb3cuaGFzUm9vdCgpICYmICF0aGlzLmN1cnJlbnREcm9wVGFyZ2V0KSB7XHJcbiAgICAgIHRoaXMuZHJvcEVycm9yKHRoaXMubm9QYXJlbnRFcnJvcik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvL1RPRE8ganVzdCBwYXNzIGRyYWdTdGVwIGhlcmUsIGJ1dCBjb21lIHVwIHdpdGggYSBiZXR0ZXIgbmFtZSBhbmQgbW92ZSB0aGUgdHlwZSB0byBmbG93Lm1vZGVsXHJcbiAgICBsZXQgY29tcG9uZW50UmVmID0gYXdhaXQgdGhpcy5jcmVhdGVTdGVwKHRoaXMuZHJhZy5kcmFnU3RlcCBhcyBOZ0Zsb3djaGFydC5QZW5kaW5nU3RlcCk7XHJcblxyXG4gICAgY29uc3QgZHJvcFRhcmdldCA9IHRoaXMuY3VycmVudERyb3BUYXJnZXQgfHwgbnVsbDtcclxuICAgIGxldCBlcnJvciA9IHt9O1xyXG4gICAgaWYgKGNvbXBvbmVudFJlZi5pbnN0YW5jZS5jYW5Ecm9wKGRyb3BUYXJnZXQsIGVycm9yKSkge1xyXG4gICAgICBpZiAoIXRoaXMuZmxvdy5oYXNSb290KCkpIHtcclxuICAgICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclJvb3QoY29tcG9uZW50UmVmLCBkcmFnKTtcclxuICAgICAgICB0aGlzLnNldFJvb3QoY29tcG9uZW50UmVmLmluc3RhbmNlKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICAgLy8gaWYgcm9vdCBpcyByZXBsYWNlZCBieSBhbm90aGVyIHN0ZXAsIHJlcmVuZGVyIHJvb3QgdG8gcHJvcGVyIHBvc2l0aW9uXHJcbiAgICAgICAgIGlmKGRyb3BUYXJnZXQuc3RlcC5pc1Jvb3RFbGVtZW50KCkgJiYgZHJvcFRhcmdldC5wb3NpdGlvbiA9PT0gJ0FCT1ZFJykge1xyXG4gICAgICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJSb290KGNvbXBvbmVudFJlZiwgZHJhZyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYWRkQ2hpbGRTdGVwKGNvbXBvbmVudFJlZiwgZHJvcFRhcmdldCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2FsbGJhY2tzPy5vbkRyb3BTdGVwKSB7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zLmNhbGxiYWNrcy5vbkRyb3BTdGVwKHtcclxuICAgICAgICAgIHN0ZXA6IGNvbXBvbmVudFJlZi5pbnN0YW5jZSxcclxuICAgICAgICAgIGlzTW92ZTogZmFsc2UsXHJcbiAgICAgICAgICBwYXJlbnQ6IGNvbXBvbmVudFJlZi5pbnN0YW5jZS5wYXJlbnRcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc3QgaSA9IHRoaXMudmlld0NvbnRhaW5lci5pbmRleE9mKGNvbXBvbmVudFJlZi5ob3N0VmlldylcclxuICAgICAgdGhpcy52aWV3Q29udGFpbmVyLnJlbW92ZShpKTtcclxuICAgICAgdGhpcy5kcm9wRXJyb3IoZXJyb3IpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcblxyXG4gIHB1YmxpYyBvbkRyYWdTdGFydChkcmFnOiBEcmFnRXZlbnQpIHtcclxuXHJcbiAgICB0aGlzLmlzRHJhZ2dpbmcgPSB0cnVlO1xyXG5cclxuICAgIHRoaXMuY3VycmVudERyb3BUYXJnZXQgPSB0aGlzLnJlbmRlcmVyLmZpbmRBbmRTaG93Q2xvc2VzdERyb3AodGhpcy5kcmFnLmRyYWdTdGVwLCBkcmFnLCB0aGlzLmZsb3cuc3RlcHMpO1xyXG4gIH1cclxuXHJcbiAgcHVibGljIGNyZWF0ZVN0ZXBGcm9tVHlwZShpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIGRhdGE6IGFueSk6IFByb21pc2U8Q29tcG9uZW50UmVmPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4+IHtcclxuICAgIGxldCBjb21wUmVmID0gdGhpcy5zdGVwbWFuYWdlci5jcmVhdGVGcm9tUmVnaXN0cnkoaWQsIHR5cGUsIGRhdGEsIHRoaXMpO1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGxldCBzdWIgPSBjb21wUmVmLmluc3RhbmNlLnZpZXdJbml0LnN1YnNjcmliZShhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICBjb21wUmVmLmluc3RhbmNlLm9uVXBsb2FkKGRhdGEpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXNvbHZlKGNvbXBSZWYpO1xyXG4gICAgICB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyBjcmVhdGVTdGVwKHBlbmRpbmc6IE5nRmxvd2NoYXJ0LlBlbmRpbmdTdGVwKTogUHJvbWlzZTxDb21wb25lbnRSZWY8TmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50Pj4ge1xyXG4gICAgbGV0IGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD47XHJcblxyXG4gICAgY29tcG9uZW50UmVmID0gdGhpcy5zdGVwbWFuYWdlci5jcmVhdGUocGVuZGluZywgdGhpcyk7XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XHJcbiAgICAgIGxldCBzdWIgPSBjb21wb25lbnRSZWYuaW5zdGFuY2Uudmlld0luaXQuc3Vic2NyaWJlKCgpID0+IHtcclxuICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcclxuICAgICAgICByZXNvbHZlKGNvbXBvbmVudFJlZik7XHJcbiAgICAgIH0sIGVycm9yID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHB1YmxpYyByZXNldFNjYWxlKCkge1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm9wdGlvbnMuem9vbS5tb2RlID09PSAnRElTQUJMRUQnKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXJlci5yZXNldFNjYWxlKHRoaXMuZmxvdylcclxuICB9XHJcblxyXG4gIHB1YmxpYyBzY2FsZVVwKHN0ZXA/OiBudW1iZXIpIHtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5vcHRpb25zLnpvb20ubW9kZSA9PT0gJ0RJU0FCTEVEJykge1xyXG4gICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMucmVuZGVyZXIuc2NhbGVVcCh0aGlzLmZsb3csIHN0ZXApO1xyXG5cclxuICB9XHJcblxyXG4gIHB1YmxpYyBzY2FsZURvd24oc3RlcD86IG51bWJlcikge1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm9wdGlvbnMuem9vbS5tb2RlID09PSAnRElTQUJMRUQnKSB7XHJcbiAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5yZW5kZXJlci5zY2FsZURvd24odGhpcy5mbG93LCBzdGVwKTtcclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgc2V0U2NhbGUoc2NhbGVWYWx1ZTogbnVtYmVyKSB7XHJcbiAgICBpZih0aGlzLm9wdGlvbnMub3B0aW9ucy56b29tLm1vZGUgPT09ICdESVNBQkxFRCcpIHtcclxuICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLnJlbmRlcmVyLnNldFNjYWxlKHRoaXMuZmxvdywgc2NhbGVWYWx1ZSlcclxuICB9XHJcblxyXG5cclxuICBhZGRDaGlsZFN0ZXAoY29tcG9uZW50UmVmOiBDb21wb25lbnRSZWY8TmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50PiwgZHJvcFRhcmdldDogTmdGbG93Y2hhcnQuRHJvcFRhcmdldCkge1xyXG4gICAgdGhpcy5hZGRUb0NhbnZhcyhjb21wb25lbnRSZWYpO1xyXG4gICAgY29uc3QgcmVzcG9uc2UgPSB0aGlzLmFkZFN0ZXBUb0Zsb3coY29tcG9uZW50UmVmLmluc3RhbmNlLCBkcm9wVGFyZ2V0KTtcclxuICAgIHRoaXMucmVuZGVyZXIucmVuZGVyKHRoaXMuZmxvdywgcmVzcG9uc2UucHJldHR5UmVuZGVyKTtcclxuICB9XHJcblxyXG4gIGFkZFRvQ2FudmFzKGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4pIHtcclxuICAgIHRoaXMucmVuZGVyZXIucmVuZGVyTm9uUm9vdChjb21wb25lbnRSZWYpO1xyXG4gIH1cclxuXHJcbiAgcmVSZW5kZXIocHJldHR5PzogYm9vbGVhbikge1xyXG4gICAgdGhpcy5yZW5kZXJlci5yZW5kZXIodGhpcy5mbG93LCBwcmV0dHkpO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgdXBsb2FkKHJvb3Q6IGFueSkge1xyXG4gICAgYXdhaXQgdGhpcy51cGxvYWROb2RlKHJvb3QpO1xyXG4gICAgdGhpcy5yZVJlbmRlcih0cnVlKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYXN5bmMgdXBsb2FkTm9kZShub2RlOiBhbnksIHBhcmVudE5vZGU/OiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQpOiBQcm9taXNlPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4ge1xyXG4gICAgaWYoIW5vZGUpe1xyXG4gICAgICAvLyBubyBub2RlIHRvIHVwbG9hZCB3aGVuIHVwbG9hZGluZyBlbXB0eSBuZXN0ZWQgZmxvd1xyXG4gICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGNvbXAgPSBhd2FpdCB0aGlzLmNyZWF0ZVN0ZXBGcm9tVHlwZShub2RlLmlkLCBub2RlLnR5cGUsIG5vZGUuZGF0YSk7XHJcbiAgICBpZiAoIXBhcmVudE5vZGUpIHtcclxuICAgICAgdGhpcy5zZXRSb290KGNvbXAuaW5zdGFuY2UpO1xyXG4gICAgICB0aGlzLnJlbmRlcmVyLnJlbmRlclJvb3QoY29tcCwgbnVsbCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5yZW5kZXJlci5yZW5kZXJOb25Sb290KGNvbXApO1xyXG4gICAgICB0aGlzLmZsb3cuYWRkU3RlcChjb21wLmluc3RhbmNlKTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgbGV0IGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcclxuICAgICAgbGV0IGNoaWxkQ29tcCA9IGF3YWl0IHRoaXMudXBsb2FkTm9kZShjaGlsZCwgY29tcC5pbnN0YW5jZSk7XHJcbiAgICAgIGNvbXAuaW5zdGFuY2UuY2hpbGRyZW4ucHVzaChjaGlsZENvbXApO1xyXG4gICAgICBjaGlsZENvbXAuc2V0UGFyZW50KGNvbXAuaW5zdGFuY2UsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjb21wLmluc3RhbmNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBzZXRSb290KHN0ZXA6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCwgZm9yY2U6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICBpZiAodGhpcy5mbG93Lmhhc1Jvb3QoKSkge1xyXG4gICAgICBpZiAoIWZvcmNlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdBbHJlYWR5IGhhdmUgYSByb290IGFuZCBmb3JjZSBpcyBmYWxzZScpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9yZXBhcmVudCByb290XHJcbiAgICAgIGxldCBvbGRSb290ID0gdGhpcy5mbG93LnJvb3RTdGVwO1xyXG4gICAgICB0aGlzLmZsb3cucm9vdFN0ZXAgPSBzdGVwO1xyXG4gICAgICBzdGVwLnphZGRDaGlsZDAob2xkUm9vdCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgdGhpcy5mbG93LnJvb3RTdGVwID0gc3RlcDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZsb3cuYWRkU3RlcChzdGVwKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgYWRkU3RlcFRvRmxvdyhzdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIGRyb3BUYXJnZXQ6IE5nRmxvd2NoYXJ0LkRyb3BUYXJnZXQsIGlzTW92ZSA9IGZhbHNlKTogRHJvcFJlc3BvbnNlIHtcclxuXHJcbiAgICBsZXQgcmVzcG9uc2UgPSB7XHJcbiAgICAgICAgYWRkZWQ6IGZhbHNlLFxyXG4gICAgICAgIHByZXR0eVJlbmRlcjogZmFsc2UsXHJcbiAgICB9O1xyXG5cclxuICAgIHN3aXRjaCAoZHJvcFRhcmdldC5wb3NpdGlvbikge1xyXG4gICAgICBjYXNlICdBQk9WRSc6XHJcbiAgICAgICAgcmVzcG9uc2UgPSB0aGlzLnBsYWNlU3RlcEFib3ZlKHN0ZXAsIGRyb3BUYXJnZXQuc3RlcCk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ0JFTE9XJzpcclxuICAgICAgICByZXNwb25zZSA9IHRoaXMucGxhY2VTdGVwQmVsb3coc3RlcCwgZHJvcFRhcmdldC5zdGVwKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSwgWy4uLmRyb3BUYXJnZXQuc3RlcC5jaGlsZHJlbl0pXHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ0xFRlQnOlxyXG4gICAgICAgIHJlc3BvbnNlID0gdGhpcy5wbGFjZVN0ZXBBZGphY2VudChzdGVwLCBkcm9wVGFyZ2V0LnN0ZXAsIHRydWUpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdSSUdIVCc6XHJcbiAgICAgICAgcmVzcG9uc2UgPSB0aGlzLnBsYWNlU3RlcEFkamFjZW50KHN0ZXAsIGRyb3BUYXJnZXQuc3RlcCwgZmFsc2UpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBkZWZhdWx0OlxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghaXNNb3ZlICYmIHJlc3BvbnNlLmFkZGVkKSB7XHJcbiAgICAgIHRoaXMuZmxvdy5hZGRTdGVwKHN0ZXApO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwbGFjZVN0ZXBCZWxvdyhuZXdTdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIHBhcmVudFN0ZXA6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCk6IERyb3BSZXNwb25zZSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBhZGRlZDogcGFyZW50U3RlcC56YWRkQ2hpbGQwKG5ld1N0ZXApLFxyXG4gICAgICBwcmV0dHlSZW5kZXI6IGZhbHNlLFxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBwbGFjZVN0ZXBBZGphY2VudChuZXdTdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIHNpYmxpbmdTdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIGlzTGVmdDogYm9vbGVhbiA9IHRydWUpOiBEcm9wUmVzcG9uc2Uge1xyXG4gICAgaWYgKHNpYmxpbmdTdGVwLnBhcmVudCkge1xyXG4gICAgICAvL2ZpbmQgdGhlIGFkamFjZW50IHN0ZXBzIGluZGV4IGluIHRoZSBwYXJlbnRzIGNoaWxkIGFycmF5XHJcbiAgICAgIGNvbnN0IGFkamFjZW50SW5kZXggPSBzaWJsaW5nU3RlcC5wYXJlbnQuY2hpbGRyZW4uZmluZEluZGV4KGNoaWxkID0+IGNoaWxkLm5hdGl2ZUVsZW1lbnQuaWQgPT0gc2libGluZ1N0ZXAubmF0aXZlRWxlbWVudC5pZCk7XHJcbiAgICAgIHNpYmxpbmdTdGVwLnBhcmVudC56YWRkQ2hpbGRTaWJsaW5nMChuZXdTdGVwLCBhZGphY2VudEluZGV4ICsgKGlzTGVmdCA/IDAgOiAxKSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgY29uc29sZS53YXJuKCdQYXJhbGxlbCBhY3Rpb25zIG11c3QgaGF2ZSBhIGNvbW1vbiBwYXJlbnQnKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBhZGRlZDogZmFsc2UsXHJcbiAgICAgICAgcHJldHR5UmVuZGVyOiBmYWxzZSxcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGFkZGVkOiB0cnVlLFxyXG4gICAgICBwcmV0dHlSZW5kZXI6IGZhbHNlLFxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcGxhY2VTdGVwQWJvdmUobmV3U3RlcDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50LCBjaGlsZFN0ZXA6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCk6IERyb3BSZXNwb25zZSB7XHJcbiAgICBsZXQgcHJldHR5UmVuZGVyID0gZmFsc2VcclxuICAgIGxldCBuZXdQYXJlbnQgPSBjaGlsZFN0ZXAucGFyZW50O1xyXG4gICAgaWYgKG5ld1BhcmVudCkge1xyXG4gICAgICAvL3dlIHdhbnQgdG8gcmVtb3ZlIGNoaWxkIGFuZCBpbnNlcnQgb3VyIG5ld1N0ZXAgYXQgdGhlIHNhbWUgaW5kZXhcclxuICAgICAgbGV0IGluZGV4ID0gbmV3UGFyZW50LnJlbW92ZUNoaWxkKGNoaWxkU3RlcCk7XHJcbiAgICAgIG5ld1N0ZXAuemFkZENoaWxkMChjaGlsZFN0ZXApO1xyXG4gICAgICBuZXdQYXJlbnQuemFkZENoaWxkMChuZXdTdGVwKTtcclxuICAgIH1cclxuICAgIGVsc2UgeyAvLyBuZXcgcm9vdCBub2RlXHJcbiAgICAgIG5ld1N0ZXAucGFyZW50Py5yZW1vdmVDaGlsZChuZXdTdGVwKVxyXG4gICAgICBuZXdTdGVwLnNldFBhcmVudChudWxsLCB0cnVlKVxyXG4gICAgICBcclxuICAgICAgLy9pZiB0aGUgbmV3IHN0ZXAgd2FzIGEgZGlyZWN0IGNoaWxkIG9mIHRoZSByb290IHN0ZXAsIHdlIG5lZWQgdG8gYnJlYWsgdGhhdCBjb25uZWN0aW9uXHJcbiAgICAgIGNoaWxkU3RlcC5yZW1vdmVDaGlsZChuZXdTdGVwKVxyXG4gICAgICB0aGlzLnNldFJvb3QobmV3U3RlcCk7XHJcblxyXG4gICAgICBwcmV0dHlSZW5kZXIgPSB0cnVlXHJcbiAgICAgIFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgYWRkZWQ6IHRydWUsXHJcbiAgICAgIHByZXR0eVJlbmRlclxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgZHJvcEVycm9yKGVycm9yOiBOZ0Zsb3djaGFydC5FcnJvck1lc3NhZ2UpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FsbGJhY2tzPy5vbkRyb3BFcnJvcikge1xyXG4gICAgICBsZXQgcGFyZW50ID0gdGhpcy5jdXJyZW50RHJvcFRhcmdldD8ucG9zaXRpb24gIT09ICdCRUxPVycgPyB0aGlzLmN1cnJlbnREcm9wVGFyZ2V0Py5zdGVwLnBhcmVudCA6IHRoaXMuY3VycmVudERyb3BUYXJnZXQ/LnN0ZXBcclxuICAgICAgdGhpcy5vcHRpb25zLmNhbGxiYWNrcy5vbkRyb3BFcnJvcih7XHJcbiAgICAgICAgc3RlcDogKHRoaXMuZHJhZy5kcmFnU3RlcCBhcyBOZ0Zsb3djaGFydC5QZW5kaW5nU3RlcCksXHJcbiAgICAgICAgcGFyZW50OiBwYXJlbnQgfHwgbnVsbCxcclxuICAgICAgICBlcnJvcjogZXJyb3JcclxuICAgICAgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHByaXZhdGUgbW92ZUVycm9yKHN0ZXA6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCwgZXJyb3IpIHtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY2FsbGJhY2tzPy5vbk1vdmVFcnJvcikge1xyXG4gICAgICBsZXQgcGFyZW50ID0gdGhpcy5jdXJyZW50RHJvcFRhcmdldD8ucG9zaXRpb24gIT09ICdCRUxPVycgPyB0aGlzLmN1cnJlbnREcm9wVGFyZ2V0Py5zdGVwLnBhcmVudCA6IHRoaXMuY3VycmVudERyb3BUYXJnZXQ/LnN0ZXBcclxuICAgICAgdGhpcy5vcHRpb25zLmNhbGxiYWNrcy5vbk1vdmVFcnJvcih7XHJcbiAgICAgICAgc3RlcDoge1xyXG4gICAgICAgICAgaW5zdGFuY2U6IHN0ZXAsXHJcbiAgICAgICAgICB0eXBlOiBzdGVwLnR5cGUsXHJcbiAgICAgICAgICBkYXRhOiBzdGVwLmRhdGFcclxuICAgICAgICB9LFxyXG4gICAgICAgIHBhcmVudDogcGFyZW50LFxyXG4gICAgICAgIGVycm9yOiBlcnJvclxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxufVxyXG4iXX0=