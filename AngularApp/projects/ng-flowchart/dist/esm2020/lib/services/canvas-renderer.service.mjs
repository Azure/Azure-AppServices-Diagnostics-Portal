import { Injectable } from '@angular/core';
import { CONSTANTS } from '../model/flowchart.constants';
import { OptionsService } from './options.service';
import * as i0 from "@angular/core";
import * as i1 from "./options.service";
export class CanvasRendererService {
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
        if (!flow.hasRoot()) {
            if (this.options.options.zoom.mode === 'DISABLED') {
                this.resetAdjustDimensions();
                // Trigger afterRender to allow nested canvas to redraw parent canvas.
                // Not sure if this scenario should also trigger beforeRender.
                if (this.options.callbacks?.afterRender) {
                    this.options.callbacks.afterRender();
                }
            }
            return;
        }
        if (this.options.callbacks?.beforeRender) {
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
        if (this.options.callbacks?.afterRender) {
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
        const minDimAdjust = `${1 / scaleValue * 100}%`;
        const canvasContent = this.getCanvasContentElement();
        canvasContent.style.transform = `scale(${scaleValue})`;
        canvasContent.style.minHeight = minDimAdjust;
        canvasContent.style.minWidth = minDimAdjust;
        canvasContent.style.transformOrigin = 'top left';
        canvasContent.classList.add('scaling');
        this.scale = scaleValue;
        this.render(flow, true);
        if (this.options.callbacks?.afterScale) {
            this.options.callbacks.afterScale(this.scale);
        }
        this.scaleDebounceTimer && clearTimeout(this.scaleDebounceTimer);
        this.scaleDebounceTimer = setTimeout(() => {
            canvasContent.classList.remove('scaling');
        }, 300);
    }
}
CanvasRendererService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService, deps: [{ token: i1.OptionsService }], target: i0.ɵɵFactoryTarget.Injectable });
CanvasRendererService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CanvasRendererService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: i1.OptionsService }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FudmFzLXJlbmRlcmVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3NlcnZpY2VzL2NhbnZhcy1yZW5kZXJlci5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBZ0IsVUFBVSxFQUFvQixNQUFNLGVBQWUsQ0FBQztBQUUzRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFHekQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG1CQUFtQixDQUFDOzs7QUFTbkQsTUFBTSxPQUFPLHFCQUFxQjtJQU05QixZQUNZLE9BQXVCO1FBQXZCLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBSjNCLFVBQUssR0FBVyxDQUFDLENBQUM7UUFDbEIsdUJBQWtCLEdBQUcsSUFBSSxDQUFBO0lBTWpDLENBQUM7SUFFTSxJQUFJLENBQUMsYUFBK0I7UUFDdkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7SUFDdkMsQ0FBQztJQUVNLFVBQVUsQ0FBQyxJQUE0QyxFQUFFLFNBQXFCO1FBQ2pGLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVNLGFBQWEsQ0FBQyxJQUE0QyxFQUFFLFNBQXFCO1FBQ3BGLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRU0sY0FBYyxDQUFDLElBQThCLEVBQUUsU0FBb0I7UUFDdEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztR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QUFVLENBQUE7UUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFFdkIsSUFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUU7WUFDbkMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtTQUNoRDtRQUVELElBQUksQ0FBQyxrQkFBa0IsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUE7UUFDaEUsSUFBSSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDdEMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUE7UUFDN0MsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFBO0lBRVgsQ0FBQzs7bUhBeGJRLHFCQUFxQjt1SEFBckIscUJBQXFCOzRGQUFyQixxQkFBcUI7a0JBRGpDLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb25lbnRSZWYsIEluamVjdGFibGUsIFZpZXdDb250YWluZXJSZWYgfSBmcm9tICdAYW5ndWxhci9jb3JlJztcclxuaW1wb3J0IHsgTmdGbG93Y2hhcnQgfSBmcm9tICcuLi9tb2RlbC9mbG93Lm1vZGVsJztcclxuaW1wb3J0IHsgQ09OU1RBTlRTIH0gZnJvbSAnLi4vbW9kZWwvZmxvd2NoYXJ0LmNvbnN0YW50cyc7XHJcbmltcG9ydCB7IENhbnZhc0Zsb3cgfSBmcm9tICcuLi9uZy1mbG93Y2hhcnQtY2FudmFzLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQgfSBmcm9tICcuLi9uZy1mbG93Y2hhcnQtc3RlcC9uZy1mbG93Y2hhcnQtc3RlcC5jb21wb25lbnQnO1xyXG5pbXBvcnQgeyBPcHRpb25zU2VydmljZSB9IGZyb20gJy4vb3B0aW9ucy5zZXJ2aWNlJztcclxuXHJcbmV4cG9ydCB0eXBlIERyb3BQcm94aW1pdHkgPSB7XHJcbiAgICBzdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsXHJcbiAgICBwb3NpdGlvbjogTmdGbG93Y2hhcnQuRHJvcFBvc2l0aW9uLFxyXG4gICAgcHJveGltaXR5OiBudW1iZXJcclxufTtcclxuXHJcbkBJbmplY3RhYmxlKClcclxuZXhwb3J0IGNsYXNzIENhbnZhc1JlbmRlcmVyU2VydmljZSB7XHJcbiAgICBwcml2YXRlIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWY7XHJcblxyXG4gICAgcHJpdmF0ZSBzY2FsZTogbnVtYmVyID0gMTtcclxuICAgIHByaXZhdGUgc2NhbGVEZWJvdW5jZVRpbWVyID0gbnVsbFxyXG5cclxuICAgIGNvbnN0cnVjdG9yKFxyXG4gICAgICAgIHByaXZhdGUgb3B0aW9uczogT3B0aW9uc1NlcnZpY2VcclxuICAgICkge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdCh2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyUmVmKSB7XHJcbiAgICAgICAgdGhpcy52aWV3Q29udGFpbmVyID0gdmlld0NvbnRhaW5lcjtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVuZGVyUm9vdChzdGVwOiBDb21wb25lbnRSZWY8TmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50PiwgZHJhZ0V2ZW50PzogRHJhZ0V2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLmFwcGVuZENoaWxkKChzdGVwLmxvY2F0aW9uLm5hdGl2ZUVsZW1lbnQpKTtcclxuICAgICAgICB0aGlzLnNldFJvb3RQb3NpdGlvbihzdGVwLmluc3RhbmNlLCBkcmFnRXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW5kZXJOb25Sb290KHN0ZXA6IENvbXBvbmVudFJlZjxOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ+LCBkcmFnRXZlbnQ/OiBEcmFnRXZlbnQpIHtcclxuICAgICAgICB0aGlzLmdldENhbnZhc0NvbnRlbnRFbGVtZW50KCkuYXBwZW5kQ2hpbGQoKHN0ZXAubG9jYXRpb24ubmF0aXZlRWxlbWVudCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB1cGRhdGVQb3NpdGlvbihzdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIGRyYWdFdmVudDogRHJhZ0V2ZW50KSB7XHJcbiAgICAgICAgbGV0IHJlbGF0aXZlWFkgPSB0aGlzLmdldFJlbGF0aXZlWFkoZHJhZ0V2ZW50KTtcclxuXHJcbiAgICAgICAgcmVsYXRpdmVYWSA9IHJlbGF0aXZlWFkubWFwKGNvb3JkID0+IGNvb3JkIC8gdGhpcy5zY2FsZSlcclxuICAgICAgICBzdGVwLnpzZXRQb3NpdGlvbihyZWxhdGl2ZVhZLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFN0ZXBHYXAoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5vcHRpb25zLnN0ZXBHYXA7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZW5kZXJDaGlsZFRyZWUocm9vdE5vZGU6IE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudCwgcm9vdFJlY3Q6IFBhcnRpYWw8RE9NUmVjdD4sIGNhbnZhc1JlY3Q6IERPTVJlY3QpIHtcclxuICAgICAgICAvL3RoZSByb290Tm9kZSBwYXNzZWQgaW4gaXMgYWxyZWFkeSByZW5kZXJlZC4ganVzdCBuZWVkIHRvIHJlbmRlciBpdHMgY2hpbGRyZW4gL3N1YnRyZWVcclxuXHJcbiAgICAgICAgaWYgKCFyb290Tm9kZS5oYXNDaGlsZHJlbigpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vdG9wIG9mIHRoZSBjaGlsZCByb3cgaXMgc2ltcGx5IHRoZSByZWxhdGl2ZSBib3R0b20gb2YgdGhlIHJvb3QgKyBzdGVwR2FwXHJcbiAgICAgICAgY29uc3QgY2hpbGRZVG9wID0gKHJvb3RSZWN0LmJvdHRvbSAtIGNhbnZhc1JlY3QudG9wICogdGhpcy5zY2FsZSkgKyB0aGlzLmdldFN0ZXBHYXAoKTtcclxuICBcclxuICAgICAgICBjb25zdCByb290V2lkdGggPSByb290UmVjdC53aWR0aCAvIHRoaXMuc2NhbGVcclxuXHJcbiAgICAgICAgY29uc3Qgcm9vdFhDZW50ZXIgPSAocm9vdFJlY3QubGVmdCAtIGNhbnZhc1JlY3QubGVmdCkgKyAocm9vdFdpZHRoIC8gMik7XHJcblxyXG5cclxuICAgICAgICAvL2dldCB0aGUgd2lkdGggb2YgdGhlIGNoaWxkIHRyZWVzXHJcbiAgICAgICAgbGV0IGNoaWxkVHJlZVdpZHRocyA9IHt9O1xyXG4gICAgICAgIGxldCB0b3RhbFRyZWVXaWR0aCA9IDA7XHJcblxyXG4gICAgICAgIHJvb3ROb2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdG90YWxDaGlsZFdpZHRoID0gY2hpbGQuZ2V0Tm9kZVRyZWVXaWR0aCh0aGlzLmdldFN0ZXBHYXAoKSk7XHJcbiAgICAgICAgICAgIHRvdGFsQ2hpbGRXaWR0aCA9IHRvdGFsQ2hpbGRXaWR0aCAvIHRoaXMuc2NhbGVcclxuICAgICAgICAgICAgY2hpbGRUcmVlV2lkdGhzW2NoaWxkLm5hdGl2ZUVsZW1lbnQuaWRdID0gdG90YWxDaGlsZFdpZHRoO1xyXG5cclxuICAgICAgICAgICAgdG90YWxUcmVlV2lkdGggKz0gdG90YWxDaGlsZFdpZHRoO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvL2FkZCBsZW5ndGggZm9yIHN0ZXBHYXBzIGJldHdlZW4gY2hpbGQgdHJlZXNcclxuICAgICAgICB0b3RhbFRyZWVXaWR0aCArPSAocm9vdE5vZGUuY2hpbGRyZW4ubGVuZ3RoIC0gMSkgKiB0aGlzLmdldFN0ZXBHYXAoKTtcclxuXHJcbiAgICAgICAgLy9pZiB3ZSBoYXZlIG1vcmUgdGhhbiAxIGNoaWxkLCB3ZSB3YW50IGhhbGYgdGhlIGV4dGVudCBvbiB0aGUgbGVmdCBhbmQgaGFsZiBvbiB0aGUgcmlnaHRcclxuICAgICAgICBsZXQgbGVmdFhUcmVlID0gcm9vdFhDZW50ZXIgLSAodG90YWxUcmVlV2lkdGggLyAyKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBkb250IGFsbG93IGl0IHRvIGdvIG5lZ2F0aXZlIHNpbmNlIHlvdSBjYW50IHNjcm9sbCB0aGF0IHdheVxyXG4gICAgICAgIGxlZnRYVHJlZSA9IE1hdGgubWF4KDAsIGxlZnRYVHJlZSlcclxuXHJcbiAgICAgICAgcm9vdE5vZGUuY2hpbGRyZW4uZm9yRWFjaChjaGlsZCA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgY2hpbGRFeHRlbnQgPSBjaGlsZFRyZWVXaWR0aHNbY2hpbGQubmF0aXZlRWxlbWVudC5pZF07XHJcblxyXG4gICAgICAgICAgICBsZXQgY2hpbGRMZWZ0ID0gbGVmdFhUcmVlICsgKGNoaWxkRXh0ZW50IC8gMikgLSAoY2hpbGQubmF0aXZlRWxlbWVudC5vZmZzZXRXaWR0aCAvIDIpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGNoaWxkLnpzZXRQb3NpdGlvbihbY2hpbGRMZWZ0LCBjaGlsZFlUb3BdKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRDaGlsZFJlY3QgPSBjaGlsZC5nZXRDdXJyZW50UmVjdChjYW52YXNSZWN0KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGNoaWxkV2lkdGggPSBjdXJyZW50Q2hpbGRSZWN0LndpZHRoIC8gdGhpcy5zY2FsZVxyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgICBjaGlsZC56ZHJhd0Fycm93KFxyXG4gICAgICAgICAgICAgICAgW3Jvb3RYQ2VudGVyLCAocm9vdFJlY3QuYm90dG9tIC0gY2FudmFzUmVjdC50b3AgKiB0aGlzLnNjYWxlKV0sXHJcbiAgICAgICAgICAgICAgICBbY3VycmVudENoaWxkUmVjdC5sZWZ0ICsgY2hpbGRXaWR0aCAvIDIgLSBjYW52YXNSZWN0LmxlZnQsIGN1cnJlbnRDaGlsZFJlY3QudG9wIC0gY2FudmFzUmVjdC50b3BdXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckNoaWxkVHJlZShjaGlsZCwgY3VycmVudENoaWxkUmVjdCwgY2FudmFzUmVjdCk7XHJcbiAgICAgICAgICAgIGxlZnRYVHJlZSArPSBjaGlsZEV4dGVudCArIHRoaXMuZ2V0U3RlcEdhcCgpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVuZGVyKGZsb3c6IENhbnZhc0Zsb3csIHByZXR0eT86IGJvb2xlYW4sIHNraXBBZGp1c3REaW1lbnNpb25zID0gZmFsc2UpIHtcclxuICAgICAgICBpZiAoIWZsb3cuaGFzUm9vdCgpKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub3B0aW9ucy56b29tLm1vZGUgPT09ICdESVNBQkxFRCcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzZXRBZGp1c3REaW1lbnNpb25zKCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUcmlnZ2VyIGFmdGVyUmVuZGVyIHRvIGFsbG93IG5lc3RlZCBjYW52YXMgdG8gcmVkcmF3IHBhcmVudCBjYW52YXMuXHJcbiAgICAgICAgICAgICAgICAvLyBOb3Qgc3VyZSBpZiB0aGlzIHNjZW5hcmlvIHNob3VsZCBhbHNvIHRyaWdnZXIgYmVmb3JlUmVuZGVyLlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jYWxsYmFja3M/LmFmdGVyUmVuZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNhbGxiYWNrcy5hZnRlclJlbmRlcigpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jYWxsYmFja3M/LmJlZm9yZVJlbmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2tzLmJlZm9yZVJlbmRlcigpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjYW52YXNSZWN0ID0gdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGlmIChwcmV0dHkpIHtcclxuICAgICAgICAgICAgLy90aGlzIHdpbGwgcGxhY2UgdGhlIHJvb3QgYXQgdGhlIHRvcCBjZW50ZXIgb2YgdGhlIGNhbnZhcyBhbmQgcmVuZGVyIGZyb20gdGhlcmVcclxuICAgICAgICAgICAgdGhpcy5zZXRSb290UG9zaXRpb24oZmxvdy5yb290U3RlcCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVuZGVyQ2hpbGRUcmVlKGZsb3cucm9vdFN0ZXAsIGZsb3cucm9vdFN0ZXAuZ2V0Q3VycmVudFJlY3QoY2FudmFzUmVjdCksIGNhbnZhc1JlY3QpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghc2tpcEFkanVzdERpbWVuc2lvbnMgJiYgdGhpcy5vcHRpb25zLm9wdGlvbnMuem9vbS5tb2RlID09PSAnRElTQUJMRUQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RGltZW5zaW9ucyhmbG93LCBjYW52YXNSZWN0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2FsbGJhY2tzPy5hZnRlclJlbmRlcikge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2tzLmFmdGVyUmVuZGVyKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZXNldEFkanVzdERpbWVuc2lvbnMoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gcmVzZXQgY2FudmFzIGF1dG8gc2l6aW5nIHRvIG9yaWdpbmFsIHNpemUgaWYgZW1wdHlcclxuICAgICAgICBpZiAodGhpcy52aWV3Q29udGFpbmVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNhbnZhc1dyYXBwZXIgPSB0aGlzLmdldENhbnZhc0NvbnRlbnRFbGVtZW50KCk7XHJcbiAgICAgICAgICAgIGNhbnZhc1dyYXBwZXIuc3R5bGUubWluV2lkdGggPSBudWxsO1xyXG4gICAgICAgICAgICBjYW52YXNXcmFwcGVyLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgICAgICAgIFxyXG5cclxuICAgIHByaXZhdGUgZmluZERyb3BMb2NhdGlvbkZvckhvdmVyKGFic01vdXNlWFk6IG51bWJlcltdLCB0YXJnZXRTdGVwOiBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQsIHN0ZXBUb0Ryb3A6IE5nRmxvd2NoYXJ0LlN0ZXApOiBEcm9wUHJveGltaXR5IHwgJ2RlYWR6b25lJyB8IG51bGwge1xyXG5cclxuICAgICAgICBpZiAoIXRhcmdldFN0ZXAuc2hvdWxkRXZhbERyb3BIb3ZlcihhYnNNb3VzZVhZLCBzdGVwVG9Ecm9wKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gJ2RlYWR6b25lJ1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc3RlcFJlY3QgPSB0YXJnZXRTdGVwLm5hdGl2ZUVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHlTdGVwQ2VudGVyID0gc3RlcFJlY3QuYm90dG9tIC0gc3RlcFJlY3QuaGVpZ2h0IC8gMjtcclxuICAgICAgICBjb25zdCB4U3RlcENlbnRlciA9IHN0ZXBSZWN0LmxlZnQgKyBzdGVwUmVjdC53aWR0aCAvIDI7XHJcblxyXG4gICAgICAgIGNvbnN0IHlEaWZmID0gYWJzTW91c2VYWVsxXSAtIHlTdGVwQ2VudGVyO1xyXG4gICAgICAgIGNvbnN0IHhEaWZmID0gYWJzTW91c2VYWVswXSAtIHhTdGVwQ2VudGVyO1xyXG5cclxuICAgICAgICBjb25zdCBhYnNZRGlzdGFuY2UgPSBNYXRoLmFicyh5RGlmZik7XHJcbiAgICAgICAgY29uc3QgYWJzWERpc3RhbmNlID0gTWF0aC5hYnMoeERpZmYpO1xyXG5cclxuICAgICAgICAvLyNtYXRoIGNsYXNzICNQeXRoYWdvcmFzXHJcbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBNYXRoLnNxcnQoYWJzWURpc3RhbmNlICogYWJzWURpc3RhbmNlICsgYWJzWERpc3RhbmNlICogYWJzWERpc3RhbmNlKTtcclxuICAgICAgICBjb25zdCBhY2N1cmFjeVJhZGl1cyA9IChzdGVwUmVjdC5oZWlnaHQgKyBzdGVwUmVjdC53aWR0aCkgLyAyO1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0OiBEcm9wUHJveGltaXR5IHwgJ2RlYWR6b25lJyB8IG51bGwgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAoZGlzdGFuY2UgPCBhY2N1cmFjeVJhZGl1cykge1xyXG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPCB0aGlzLm9wdGlvbnMub3B0aW9ucy5ob3ZlckRlYWR6b25lUmFkaXVzKSB7XHJcbiAgICAgICAgICAgICAgICAvL2Jhc2ljYWxseSB3ZSBhcmUgdG9vIGNsb3NlIHRvIHRoZSBtaWRkbGUgdG8gYWNjdXJhdGVseSBwcmVkaWN0IHdoYXQgcG9zaXRpb24gdGhleSB3YW50XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAnZGVhZHpvbmUnO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoYWJzWURpc3RhbmNlID4gYWJzWERpc3RhbmNlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcDogdGFyZ2V0U3RlcCxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeURpZmYgPiAwID8gJ0JFTE9XJyA6ICdBQk9WRScsXHJcbiAgICAgICAgICAgICAgICAgICAgcHJveGltaXR5OiBhYnNZRGlzdGFuY2VcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoIXRoaXMub3B0aW9ucy5vcHRpb25zLmlzU2VxdWVudGlhbCAmJiAhdGFyZ2V0U3RlcC5pc1Jvb3RFbGVtZW50KCkpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBzdGVwOiB0YXJnZXRTdGVwLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB4RGlmZiA+IDAgPyAnUklHSFQnIDogJ0xFRlQnLFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3hpbWl0eTogYWJzWERpc3RhbmNlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdCAhPT0gJ2RlYWR6b25lJykge1xyXG4gICAgICAgICAgICBpZiAoIXRhcmdldFN0ZXAuZ2V0RHJvcFBvc2l0aW9uc0ZvclN0ZXAoc3RlcFRvRHJvcCkuaW5jbHVkZXMocmVzdWx0LnBvc2l0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgLy93ZSBoYWQgYSB2YWxpZCBkcm9wIGJ1dCB0aGUgdGFyZ2V0IHN0ZXAgZG9lc250IGFsbG93IHRoaXMgbG9jYXRpb25cclxuICAgICAgICAgICAgICAgIHJlc3VsdCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGp1c3REaW1lbnNpb25zKGZsb3c6IENhbnZhc0Zsb3csIGNhbnZhc1JlY3Q6IERPTVJlY3QpOiB2b2lkIHtcclxuICAgICAgICBsZXQgbWF4UmlnaHQgPSAwO1xyXG4gICAgICAgIGxldCBtYXhCb3R0b20gPSAwO1xyXG5cclxuICAgICAgICAvL1RPRE8gdGhpcyBjYW4gYmUgYmV0dGVyXHJcbiAgICAgICAgZmxvdy5zdGVwcy5mb3JFYWNoKFxyXG4gICAgICAgICAgICBlbGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlY3QgPSBlbGUuZ2V0Q3VycmVudFJlY3QoY2FudmFzUmVjdCk7XHJcbiAgICAgICAgICAgICAgICBtYXhSaWdodCA9IE1hdGgubWF4KHJlY3QucmlnaHQsIG1heFJpZ2h0KTtcclxuICAgICAgICAgICAgICAgIG1heEJvdHRvbSA9IE1hdGgubWF4KHJlY3QuYm90dG9tLCBtYXhCb3R0b20pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgY29uc3Qgd2lkdGhCb3JkZXJHYXAgPSAxMDA7XHJcbiAgICAgICAgY29uc3Qgd2lkdGhEaWZmID0gY2FudmFzUmVjdC53aWR0aCAtIChtYXhSaWdodCAtIGNhbnZhc1JlY3QubGVmdCk7XHJcbiAgICAgICAgaWYgKHdpZHRoRGlmZiA8IHdpZHRoQm9yZGVyR2FwKSB7XHJcbiAgICAgICAgICAgIGxldCBncm93V2lkdGggPSB3aWR0aEJvcmRlckdhcDtcclxuICAgICAgICAgICAgaWYod2lkdGhEaWZmIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgZ3Jvd1dpZHRoICs9IE1hdGguYWJzKHdpZHRoRGlmZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLnN0eWxlLm1pbldpZHRoID0gYCR7Y2FudmFzUmVjdC53aWR0aCArIGdyb3dXaWR0aH1weGA7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub3B0aW9ucy5jZW50ZXJPblJlc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoZmxvdywgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYod2lkdGhEaWZmID4gd2lkdGhCb3JkZXJHYXApIHtcclxuICAgICAgICAgICAgdmFyIHRvdGFsVHJlZVdpZHRoID0gdGhpcy5nZXRUb3RhbFRyZWVXaWR0aChmbG93KTtcclxuICAgICAgICAgICAgaWYodGhpcy5pc05lc3RlZENhbnZhcygpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldENhbnZhc0NvbnRlbnRFbGVtZW50KCkuc3R5bGUubWluV2lkdGggPSBgJHt0b3RhbFRyZWVXaWR0aCArIHdpZHRoQm9yZGVyR2FwfXB4YDtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMub3B0aW9ucy5jZW50ZXJPblJlc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKGZsb3csIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLnN0eWxlLm1pbldpZHRoKSB7XHJcbiAgICAgICAgICAgICAgICAvLyByZXNldCBub3JtYWwgY2FudmFzIHdpZHRoIGlmIGF1dG8gd2lkdGggc2V0XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldENhbnZhc0NvbnRlbnRFbGVtZW50KCkuc3R5bGUubWluV2lkdGggPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vcHRpb25zLmNlbnRlck9uUmVzaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoZmxvdywgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgaGVpZ2h0Qm9yZGVyR2FwID0gNTA7XHJcbiAgICAgICAgY29uc3QgaGVpZ2h0RGlmZiA9IGNhbnZhc1JlY3QuaGVpZ2h0IC0gKG1heEJvdHRvbSAtIGNhbnZhc1JlY3QudG9wKTtcclxuICAgICAgICBpZiAoaGVpZ2h0RGlmZiA8IGhlaWdodEJvcmRlckdhcCkge1xyXG4gICAgICAgICAgICBsZXQgZ3Jvd0hlaWdodCA9IGhlaWdodEJvcmRlckdhcDtcclxuICAgICAgICAgICAgaWYoaGVpZ2h0RGlmZiA8IDApIHtcclxuICAgICAgICAgICAgICAgIGdyb3dIZWlnaHQgKz0gTWF0aC5hYnMoaGVpZ2h0RGlmZik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLnN0eWxlLm1pbkhlaWdodCA9IGAke2NhbnZhc1JlY3QuaGVpZ2h0ICsgZ3Jvd0hlaWdodH1weGA7XHJcbiAgICAgICAgfSBlbHNlIGlmKGhlaWdodERpZmYgPiBoZWlnaHRCb3JkZXJHYXApe1xyXG4gICAgICAgICAgICBpZih0aGlzLmlzTmVzdGVkQ2FudmFzKCkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzaHJpbmtIZWlnaHQgPSBoZWlnaHREaWZmIC0gaGVpZ2h0Qm9yZGVyR2FwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLnN0eWxlLm1pbkhlaWdodCA9IGAke2NhbnZhc1JlY3QuaGVpZ2h0IC0gc2hyaW5rSGVpZ2h0fXB4YDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKHRoaXMuZ2V0Q2FudmFzQ29udGVudEVsZW1lbnQoKS5zdHlsZS5taW5IZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgIC8vIHJlc2V0IG5vcm1hbCBjYW52YXMgaGVpZ2h0IGlmIGF1dG8gaGVpZ2h0IHNldFxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLnN0eWxlLm1pbkhlaWdodCA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRUb3RhbFRyZWVXaWR0aChmbG93OiBDYW52YXNGbG93KTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgdG90YWxUcmVlV2lkdGggPSAwO1xyXG4gICAgICAgIGNvbnN0IHJvb3RXaWR0aCA9IGZsb3cucm9vdFN0ZXAuZ2V0Q3VycmVudFJlY3QoKS53aWR0aCAvIHRoaXMuc2NhbGU7XHJcbiAgICAgICAgZmxvdy5yb290U3RlcC5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcclxuICAgICAgICAgICAgbGV0IHRvdGFsQ2hpbGRXaWR0aCA9IGNoaWxkLmdldE5vZGVUcmVlV2lkdGgodGhpcy5nZXRTdGVwR2FwKCkpO1xyXG4gICAgICAgICAgICB0b3RhbFRyZWVXaWR0aCArPSB0b3RhbENoaWxkV2lkdGggLyB0aGlzLnNjYWxlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRvdGFsVHJlZVdpZHRoICs9IChmbG93LnJvb3RTdGVwLmNoaWxkcmVuLmxlbmd0aCAtIDEpICogdGhpcy5nZXRTdGVwR2FwKCk7XHJcbiAgICAgICAgLy8gdG90YWwgdHJlZSB3aWR0aCBkb2Vzbid0IGdpdmUgcm9vdCB3aWR0aFxyXG4gICAgICAgIHJldHVybiBNYXRoLm1heCh0b3RhbFRyZWVXaWR0aCwgcm9vdFdpZHRoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRCZXN0TWF0Y2hGb3JTdGVwcyhkcmFnU3RlcDogTmdGbG93Y2hhcnQuU3RlcCwgZXZlbnQ6IERyYWdFdmVudCwgc3RlcHM6IFJlYWRvbmx5QXJyYXk8TmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50Pik6IERyb3BQcm94aW1pdHkgfCBudWxsIHtcclxuICAgICAgICBjb25zdCBhYnNYWSA9IFtldmVudC5jbGllbnRYLCBldmVudC5jbGllbnRZXTtcclxuXHJcbiAgICAgICAgbGV0IGJlc3RNYXRjaDogRHJvcFByb3hpbWl0eSA9IG51bGw7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RlcHMubGVuZ3RoOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHN0ZXAgPSBzdGVwc1tpXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGVwLmlzSGlkZGVuKCkpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9IHRoaXMuZmluZERyb3BMb2NhdGlvbkZvckhvdmVyKGFic1hZLCBzdGVwLCBkcmFnU3RlcCk7XHJcbiAgICAgICAgICAgIGlmIChwb3NpdGlvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09ICdkZWFkem9uZScpIHtcclxuICAgICAgICAgICAgICAgICAgICBiZXN0TWF0Y2ggPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9pZiB0aGlzIHN0ZXAgaXMgY2xvc2VyIHRoYW4gcHJldmlvdXMgYmVzdCBtYXRjaCB0aGVuIHdlIGhhdmUgYSBuZXcgYmVzdFxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoYmVzdE1hdGNoID09IG51bGwgfHwgYmVzdE1hdGNoLnByb3hpbWl0eSA+IHBvc2l0aW9uLnByb3hpbWl0eSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJlc3RNYXRjaCA9IHBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYmVzdE1hdGNoXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGZpbmRBbmRTaG93Q2xvc2VzdERyb3AoZHJhZ1N0ZXA6IE5nRmxvd2NoYXJ0LlN0ZXAsIGV2ZW50OiBEcmFnRXZlbnQsIHN0ZXBzOiBSZWFkb25seUFycmF5PE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4pOiBOZ0Zsb3djaGFydC5Ecm9wVGFyZ2V0IHtcclxuICAgICAgICBpZiAoIXN0ZXBzIHx8IHN0ZXBzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBiZXN0TWF0Y2g6IERyb3BQcm94aW1pdHkgPSB0aGlzLmZpbmRCZXN0TWF0Y2hGb3JTdGVwcyhkcmFnU3RlcCwgZXZlbnQsIHN0ZXBzKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETyBtYWtlIHRoaXMgbW9yZSBlZmZpY2llbnQuIHR3byBsb29wc1xyXG4gICAgICAgIHN0ZXBzLmZvckVhY2goc3RlcCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChiZXN0TWF0Y2ggPT0gbnVsbCB8fCBzdGVwLm5hdGl2ZUVsZW1lbnQuaWQgIT09IGJlc3RNYXRjaC5zdGVwLm5hdGl2ZUVsZW1lbnQuaWQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBzdGVwLmNsZWFySG92ZXJJY29ucygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKCFiZXN0TWF0Y2gpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYmVzdE1hdGNoLnN0ZXAuc2hvd0hvdmVySWNvbihiZXN0TWF0Y2gucG9zaXRpb24pO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBzdGVwOiBiZXN0TWF0Y2guc3RlcCxcclxuICAgICAgICAgICAgcG9zaXRpb246IGJlc3RNYXRjaC5wb3NpdGlvblxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNob3dTbmFwcyhkcmFnU3RlcDogTmdGbG93Y2hhcnQuUGVuZGluZ1N0ZXApIHtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjbGVhckFsbFNuYXBJbmRpY2F0b3JzKHN0ZXBzOiBSZWFkb25seUFycmF5PE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4pIHtcclxuICAgICAgICBzdGVwcy5mb3JFYWNoKFxyXG4gICAgICAgICAgICBzdGVwID0+IHN0ZXAuY2xlYXJIb3Zlckljb25zKClcclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRSb290UG9zaXRpb24oc3RlcDogTmdGbG93Y2hhcnRTdGVwQ29tcG9uZW50LCBkcmFnRXZlbnQ/OiBEcmFnRXZlbnQpIHtcclxuXHJcbiAgICAgICAgaWYgKCFkcmFnRXZlbnQpIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzVG9wID0gdGhpcy5nZXRDYW52YXNUb3BDZW50ZXJQb3NpdGlvbihzdGVwLm5hdGl2ZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICBzdGVwLnpzZXRQb3NpdGlvbihjYW52YXNUb3AsIHRydWUpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN3aXRjaCAodGhpcy5vcHRpb25zLm9wdGlvbnMucm9vdFBvc2l0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgJ0NFTlRFUic6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjYW52YXNDZW50ZXIgPSB0aGlzLmdldENhbnZhc0NlbnRlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBzdGVwLnpzZXRQb3NpdGlvbihjYW52YXNDZW50ZXIsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICBjYXNlICdUT1BfQ0VOVEVSJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNhbnZhc1RvcCA9IHRoaXMuZ2V0Q2FudmFzVG9wQ2VudGVyUG9zaXRpb24oc3RlcC5uYXRpdmVFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIHN0ZXAuenNldFBvc2l0aW9uKGNhbnZhc1RvcCwgdHJ1ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJlbGF0aXZlWFkgPSB0aGlzLmdldFJlbGF0aXZlWFkoZHJhZ0V2ZW50KTtcclxuICAgICAgICAgICAgICAgIHN0ZXAuenNldFBvc2l0aW9uKHJlbGF0aXZlWFksIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldFJlbGF0aXZlWFkoZHJhZ0V2ZW50OiBEcmFnRXZlbnQpIHtcclxuICAgICAgICBjb25zdCBjYW52YXNSZWN0ID0gdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG5cclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICBkcmFnRXZlbnQuY2xpZW50WCAtIGNhbnZhc1JlY3QubGVmdCxcclxuICAgICAgICAgICAgZHJhZ0V2ZW50LmNsaWVudFkgLSBjYW52YXNSZWN0LnRvcFxyXG4gICAgICAgIF1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldENhbnZhc1RvcENlbnRlclBvc2l0aW9uKGh0bWxSb290RWxlbWVudDogSFRNTEVsZW1lbnQpIHtcclxuICAgICAgICBjb25zdCBjYW52YXNSZWN0ID0gdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIGNvbnN0IHJvb3RFbGVtZW50SGVpZ2h0ID0gaHRtbFJvb3RFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodFxyXG4gICAgICAgIGNvbnN0IHlDb29yZCA9IHJvb3RFbGVtZW50SGVpZ2h0IC8gMiArIHRoaXMub3B0aW9ucy5vcHRpb25zLnN0ZXBHYXBcclxuICAgICAgICBjb25zdCBzY2FsZVlPZmZzZXQgPSAoMSAtIHRoaXMuc2NhbGUpICogMTAwXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIGNhbnZhc1JlY3Qud2lkdGggLyAodGhpcy5zY2FsZSAqIDIpLFxyXG4gICAgICAgICAgICB5Q29vcmQgKyBzY2FsZVlPZmZzZXRcclxuICAgICAgICBdXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDYW52YXNDZW50ZXJQb3NpdGlvbigpIHtcclxuICAgICAgICBjb25zdCBjYW52YXNSZWN0ID0gdGhpcy5nZXRDYW52YXNDb250ZW50RWxlbWVudCgpLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xyXG4gICAgICAgIHJldHVybiBbXHJcbiAgICAgICAgICAgIGNhbnZhc1JlY3Qud2lkdGggLyAyLFxyXG4gICAgICAgICAgICBjYW52YXNSZWN0LmhlaWdodCAvIDJcclxuICAgICAgICBdXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRDYW52YXNDb250ZW50RWxlbWVudCgpOiBIVE1MRWxlbWVudCB7XHJcbiAgICAgICAgY29uc3QgY2FudmFzID0gdGhpcy52aWV3Q29udGFpbmVyLmVsZW1lbnQubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcclxuICAgICAgICBsZXQgY2FudmFzQ29udGVudCA9IGNhbnZhcy5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKENPTlNUQU5UUy5DQU5WQVNfQ09OVEVOVF9DTEFTUykuaXRlbSgwKTtcclxuICAgICAgICByZXR1cm4gY2FudmFzQ29udGVudCBhcyBIVE1MRWxlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGlzTmVzdGVkQ2FudmFzKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICh0aGlzLnZpZXdDb250YWluZXIpIHtcclxuICAgICAgICAgICAgY29uc3QgY2FudmFzV3JhcHBlciA9ICh0aGlzLnZpZXdDb250YWluZXIuZWxlbWVudC5uYXRpdmVFbGVtZW50IGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50O1xyXG4gICAgICAgICAgICBpZiAoY2FudmFzV3JhcHBlcikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbnZhc1dyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCduZ2Zsb3djaGFydC1zdGVwLXdyYXBwZXInKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHJlc2V0U2NhbGUoZmxvdzogQ2FudmFzRmxvdykge1xyXG4gICAgICAgIHRoaXMuc2V0U2NhbGUoZmxvdywgMSlcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2NhbGVVcChmbG93OiBDYW52YXNGbG93LCBzdGVwPyA6IG51bWJlcikge1xyXG4gICAgICAgIGNvbnN0IG5ld1NjYWxlID0gdGhpcy5zY2FsZSArICh0aGlzLnNjYWxlICogc3RlcCB8fCB0aGlzLm9wdGlvbnMub3B0aW9ucy56b29tLmRlZmF1bHRTdGVwKVxyXG4gICAgICAgIHRoaXMuc2V0U2NhbGUoZmxvdywgbmV3U2NhbGUpXHJcbiAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2NhbGVEb3duKGZsb3c6IENhbnZhc0Zsb3csIHN0ZXA/IDogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgbmV3U2NhbGUgPSB0aGlzLnNjYWxlIC0gKHRoaXMuc2NhbGUgKiBzdGVwIHx8IHRoaXMub3B0aW9ucy5vcHRpb25zLnpvb20uZGVmYXVsdFN0ZXApXHJcbiAgICAgICAgdGhpcy5zZXRTY2FsZShmbG93LCBuZXdTY2FsZSlcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0U2NhbGUoZmxvdzogQ2FudmFzRmxvdywgc2NhbGVWYWx1ZTogbnVtYmVyKSB7XHJcbiAgICAgICAgY29uc3QgbWluRGltQWRqdXN0ID0gYCR7MS9zY2FsZVZhbHVlICogMTAwfSVgXHJcblxyXG4gICAgICAgIGNvbnN0IGNhbnZhc0NvbnRlbnQgPSB0aGlzLmdldENhbnZhc0NvbnRlbnRFbGVtZW50KClcclxuXHJcbiAgICAgICAgY2FudmFzQ29udGVudC5zdHlsZS50cmFuc2Zvcm0gPSBgc2NhbGUoJHtzY2FsZVZhbHVlfSlgO1xyXG4gICAgICAgIGNhbnZhc0NvbnRlbnQuc3R5bGUubWluSGVpZ2h0ID0gbWluRGltQWRqdXN0XHJcbiAgICAgICAgY2FudmFzQ29udGVudC5zdHlsZS5taW5XaWR0aCA9IG1pbkRpbUFkanVzdFxyXG4gICAgICAgIGNhbnZhc0NvbnRlbnQuc3R5bGUudHJhbnNmb3JtT3JpZ2luID0gJ3RvcCBsZWZ0J1xyXG4gICAgICAgIGNhbnZhc0NvbnRlbnQuY2xhc3NMaXN0LmFkZCgnc2NhbGluZycpXHJcblxyXG4gICAgICAgIHRoaXMuc2NhbGUgPSBzY2FsZVZhbHVlXHJcbiAgICAgICAgdGhpcy5yZW5kZXIoZmxvdywgdHJ1ZSlcclxuXHJcbiAgICAgICAgaWYodGhpcy5vcHRpb25zLmNhbGxiYWNrcz8uYWZ0ZXJTY2FsZSkge1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbnMuY2FsbGJhY2tzLmFmdGVyU2NhbGUodGhpcy5zY2FsZSlcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5zY2FsZURlYm91bmNlVGltZXIgJiYgY2xlYXJUaW1lb3V0KHRoaXMuc2NhbGVEZWJvdW5jZVRpbWVyKVxyXG4gICAgICAgIHRoaXMuc2NhbGVEZWJvdW5jZVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGNhbnZhc0NvbnRlbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2NhbGluZycpXHJcbiAgICAgICAgfSwgMzAwKVxyXG5cclxuICAgIH1cclxuXHJcblxyXG59Il19