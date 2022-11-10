import { Directive, ElementRef, HostBinding, HostListener, Input, ViewContainerRef } from '@angular/core';
import { NgFlowchart } from './model/flow.model';
import { CONSTANTS } from './model/flowchart.constants';
import { NgFlowchartCanvasService } from './ng-flowchart-canvas.service';
import { CanvasRendererService } from './services/canvas-renderer.service';
import { OptionsService } from './services/options.service';
import { StepManagerService } from './services/step-manager.service';
import * as i0 from "@angular/core";
import * as i1 from "./ng-flowchart-canvas.service";
import * as i2 from "./services/options.service";
export class NgFlowchartCanvasDirective {
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
        if (this._disabled) {
            return;
        }
        // its possible multiple canvases exist so make sure we only move/drop on the closest one
        const closestCanvasId = event.target.closest('.ngflowchart-canvas-content')?.id;
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
NgFlowchartCanvasDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartCanvasDirective, deps: [{ token: i0.ElementRef }, { token: i0.ViewContainerRef }, { token: i1.NgFlowchartCanvasService }, { token: i2.OptionsService }], target: i0.ɵɵFactoryTarget.Directive });
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
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i0.ViewContainerRef }, { type: i1.NgFlowchartCanvasService }, { type: i2.OptionsService }]; }, propDecorators: { onDrop: [{
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LWNhbnZhcy5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL25nLWZsb3djaGFydC1jYW52YXMuZGlyZWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBaUIsU0FBUyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBcUIsZ0JBQWdCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDNUksT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUN6RSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUMzRSxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDNUQsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0saUNBQWlDLENBQUM7Ozs7QUFhckUsTUFBTSxPQUFPLDBCQUEwQjtJQWdGbkMsWUFDYyxTQUFrQyxFQUNwQyxhQUErQixFQUMvQixNQUFnQyxFQUNoQyxhQUE2QjtRQUgzQixjQUFTLEdBQVQsU0FBUyxDQUF5QjtRQUNwQyxrQkFBYSxHQUFiLGFBQWEsQ0FBa0I7UUFDL0IsV0FBTSxHQUFOLE1BQU0sQ0FBMEI7UUFDaEMsa0JBQWEsR0FBYixhQUFhLENBQWdCO1FBUmpDLGNBQVMsR0FBWSxLQUFLLENBQUM7UUFDM0IsUUFBRyxHQUFXLElBQUksQ0FBQTtRQVV0QixJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsYUFB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Q0FBQztnQkFRN0IsU0FBUztzQkFEWixLQUFLO3VCQUFDLHNCQUFzQjtnQkFNekIsT0FBTztzQkFEVixLQUFLO3VCQUFDLG9CQUFvQjtnQkFjdkIsUUFBUTtzQkFGWCxLQUFLO3VCQUFDLFVBQVU7O3NCQUNoQixXQUFXO3VCQUFDLGVBQWUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZnRlclZpZXdJbml0LCBEaXJlY3RpdmUsIEVsZW1lbnRSZWYsIEhvc3RCaW5kaW5nLCBIb3N0TGlzdGVuZXIsIElucHV0LCBPbkRlc3Ryb3ksIE9uSW5pdCwgVmlld0NvbnRhaW5lclJlZiB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBOZ0Zsb3djaGFydCB9IGZyb20gJy4vbW9kZWwvZmxvdy5tb2RlbCc7XHJcbmltcG9ydCB7IENPTlNUQU5UUyB9IGZyb20gJy4vbW9kZWwvZmxvd2NoYXJ0LmNvbnN0YW50cyc7XHJcbmltcG9ydCB7IE5nRmxvd2NoYXJ0Q2FudmFzU2VydmljZSB9IGZyb20gJy4vbmctZmxvd2NoYXJ0LWNhbnZhcy5zZXJ2aWNlJztcclxuaW1wb3J0IHsgQ2FudmFzUmVuZGVyZXJTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9jYW52YXMtcmVuZGVyZXIuc2VydmljZSc7XHJcbmltcG9ydCB7IE9wdGlvbnNTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9vcHRpb25zLnNlcnZpY2UnO1xyXG5pbXBvcnQgeyBTdGVwTWFuYWdlclNlcnZpY2UgfSBmcm9tICcuL3NlcnZpY2VzL3N0ZXAtbWFuYWdlci5zZXJ2aWNlJztcclxuXHJcblxyXG5cclxuQERpcmVjdGl2ZSh7XHJcbiAgICBzZWxlY3RvcjogJ1tuZ0Zsb3djaGFydENhbnZhc10nLFxyXG4gICAgcHJvdmlkZXJzOiBbXHJcbiAgICAgICAgTmdGbG93Y2hhcnRDYW52YXNTZXJ2aWNlLFxyXG4gICAgICAgIFN0ZXBNYW5hZ2VyU2VydmljZSxcclxuICAgICAgICBPcHRpb25zU2VydmljZSxcclxuICAgICAgICBDYW52YXNSZW5kZXJlclNlcnZpY2VcclxuICAgIF1cclxufSlcclxuZXhwb3J0IGNsYXNzIE5nRmxvd2NoYXJ0Q2FudmFzRGlyZWN0aXZlIGltcGxlbWVudHMgT25Jbml0LCBPbkRlc3Ryb3ksIEFmdGVyVmlld0luaXQge1xyXG5cclxuICAgIEBIb3N0TGlzdGVuZXIoJ2Ryb3AnLCBbJyRldmVudCddKVxyXG4gICAgcHJvdGVjdGVkIG9uRHJvcChldmVudDogRHJhZ0V2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX2Rpc2FibGVkKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICAvLyBpdHMgcG9zc2libGUgbXVsdGlwbGUgY2FudmFzZXMgZXhpc3Qgc28gbWFrZSBzdXJlIHdlIG9ubHkgbW92ZS9kcm9wIG9uIHRoZSBjbG9zZXN0IG9uZVxyXG4gICAgICAgIGNvbnN0IGNsb3Nlc3RDYW52YXNJZCA9IChldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmNsb3Nlc3QoJy5uZ2Zsb3djaGFydC1jYW52YXMtY29udGVudCcpPy5pZFxyXG4gICAgICAgIGlmICh0aGlzLl9pZCAhPT0gY2xvc2VzdENhbnZhc0lkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHR5cGUgPSBldmVudC5kYXRhVHJhbnNmZXIuZ2V0RGF0YSgndHlwZScpO1xyXG4gICAgICAgIGlmICgnRlJPTV9DQU5WQVMnID09IHR5cGUpIHtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMubW92ZVN0ZXAoZXZlbnQsIGV2ZW50LmRhdGFUcmFuc2Zlci5nZXREYXRhKCdpZCcpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLm9uRHJvcChldmVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBASG9zdExpc3RlbmVyKCdkcmFnb3ZlcicsIFsnJGV2ZW50J10pXHJcbiAgICBwcm90ZWN0ZWQgb25EcmFnT3ZlcihldmVudDogRHJhZ0V2ZW50KSB7XHJcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAodGhpcy5fZGlzYWJsZWQpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdGhpcy5jYW52YXMub25EcmFnU3RhcnQoZXZlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIF9vcHRpb25zOiBOZ0Zsb3djaGFydC5PcHRpb25zO1xyXG4gICAgX2NhbGxiYWNrczogTmdGbG93Y2hhcnQuQ2FsbGJhY2tzO1xyXG5cclxuICAgIEBIb3N0TGlzdGVuZXIoJ3dpbmRvdzpyZXNpemUnLCBbJyRldmVudCddKVxyXG4gICAgcHJvdGVjdGVkIG9uUmVzaXplKGV2ZW50KSB7XHJcbiAgICAgICAgaWYgKHRoaXMuX29wdGlvbnMuY2VudGVyT25SZXNpemUpIHtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMucmVSZW5kZXIodHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIEBIb3N0TGlzdGVuZXIoJ3doZWVsJywgWyckZXZlbnQnXSlcclxuICAgIHByb3RlY3RlZCBvblpvb20oZXZlbnQpIHtcclxuICAgICAgICBpZiAodGhpcy5fb3B0aW9ucy56b29tLm1vZGUgPT09ICdXSEVFTCcpIHtcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3RXaGVlbFNjYWxlKGV2ZW50KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBASW5wdXQoJ25nRmxvd2NoYXJ0Q2FsbGJhY2tzJylcclxuICAgIHNldCBjYWxsYmFja3MoY2FsbGJhY2tzOiBOZ0Zsb3djaGFydC5DYWxsYmFja3MpIHtcclxuICAgICAgICB0aGlzLm9wdGlvblNlcnZpY2Uuc2V0Q2FsbGJhY2tzKGNhbGxiYWNrcyk7XHJcbiAgICB9XHJcblxyXG4gICAgQElucHV0KCduZ0Zsb3djaGFydE9wdGlvbnMnKVxyXG4gICAgc2V0IG9wdGlvbnMob3B0aW9uczogTmdGbG93Y2hhcnQuT3B0aW9ucykge1xyXG4gICAgICAgIHRoaXMub3B0aW9uU2VydmljZS5zZXRPcHRpb25zKG9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuX29wdGlvbnMgPSB0aGlzLm9wdGlvblNlcnZpY2Uub3B0aW9ucztcclxuICAgICAgICB0aGlzLmNhbnZhcy5yZVJlbmRlcigpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXQgb3B0aW9ucygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb3B0aW9uc1xyXG4gICAgfVxyXG5cclxuICAgIEBJbnB1dCgnZGlzYWJsZWQnKVxyXG4gICAgQEhvc3RCaW5kaW5nKCdhdHRyLmRpc2FibGVkJylcclxuICAgIHNldCBkaXNhYmxlZCh2YWw6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLl9kaXNhYmxlZCA9IHZhbCAhPT0gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLl9kaXNhYmxlZCA9IHRoaXMuX2Rpc2FibGVkO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXQgZGlzYWJsZWQoKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Rpc2FibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgX2Rpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIF9pZDogc3RyaW5nID0gbnVsbFxyXG4gICAgcHJpdmF0ZSBjYW52YXNDb250ZW50OiBIVE1MRWxlbWVudDtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihcclxuICAgICAgICBwcm90ZWN0ZWQgY2FudmFzRWxlOiBFbGVtZW50UmVmPEhUTUxFbGVtZW50PixcclxuICAgICAgICBwcml2YXRlIHZpZXdDb250YWluZXI6IFZpZXdDb250YWluZXJSZWYsXHJcbiAgICAgICAgcHJpdmF0ZSBjYW52YXM6IE5nRmxvd2NoYXJ0Q2FudmFzU2VydmljZSxcclxuICAgICAgICBwcml2YXRlIG9wdGlvblNlcnZpY2U6IE9wdGlvbnNTZXJ2aWNlXHJcbiAgICApIHtcclxuXHJcbiAgICAgICAgdGhpcy5jYW52YXNFbGUubmF0aXZlRWxlbWVudC5jbGFzc0xpc3QuYWRkKENPTlNUQU5UUy5DQU5WQVNfQ0xBU1MpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ29udGVudCA9IHRoaXMuY3JlYXRlQ2FudmFzQ29udGVudCh0aGlzLnZpZXdDb250YWluZXIpO1xyXG4gICAgICAgIHRoaXMuX2lkID0gdGhpcy5jYW52YXNDb250ZW50LmlkXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG5nT25Jbml0KCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmluaXQodGhpcy52aWV3Q29udGFpbmVyKTtcclxuICAgICAgICBpZiAoIXRoaXMuX29wdGlvbnMpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zID0gbmV3IE5nRmxvd2NoYXJ0Lk9wdGlvbnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2FudmFzLl9kaXNhYmxlZCA9IHRoaXMuX2Rpc2FibGVkO1xyXG4gICAgfVxyXG5cclxuICAgIG5nQWZ0ZXJWaWV3SW5pdCgpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbmdPbkRlc3Ryb3koKSB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy52aWV3Q29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlld0NvbnRhaW5lci5yZW1vdmUoaSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNFbGUubmF0aXZlRWxlbWVudC5yZW1vdmUoKVxyXG4gICAgICAgIHRoaXMudmlld0NvbnRhaW5lci5lbGVtZW50Lm5hdGl2ZUVsZW1lbnQucmVtb3ZlKClcclxuICAgICAgICB0aGlzLnZpZXdDb250YWluZXIgPSB1bmRlZmluZWRcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUNhbnZhc0NvbnRlbnQodmlld0NvbnRhaW5lcjogVmlld0NvbnRhaW5lclJlZik6IEhUTUxFbGVtZW50IHtcclxuICAgICAgICBjb25zdCBjYW52YXNJZCA9ICdjJyArIERhdGUubm93KCk7XHJcblxyXG4gICAgICAgIGxldCBjYW52YXNFbGUgPSB2aWV3Q29udGFpbmVyLmVsZW1lbnQubmF0aXZlRWxlbWVudCBhcyBIVE1MRWxlbWVudDtcclxuICAgICAgICBsZXQgY2FudmFzQ29udGVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGNhbnZhc0NvbnRlbnQuaWQgPSBjYW52YXNJZDtcclxuICAgICAgICBjYW52YXNDb250ZW50LmNsYXNzTGlzdC5hZGQoQ09OU1RBTlRTLkNBTlZBU19DT05URU5UX0NMQVNTKTtcclxuICAgICAgICBjYW52YXNFbGUuYXBwZW5kQ2hpbGQoY2FudmFzQ29udGVudCk7XHJcbiAgICAgICAgcmV0dXJuIGNhbnZhc0NvbnRlbnRcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgdGhlIEZsb3cgb2JqZWN0IHJlcHJlc2VudGluZyB0aGlzIGZsb3cgY2hhcnQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBnZXRGbG93KCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgTmdGbG93Y2hhcnQuRmxvdyh0aGlzLmNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHNjYWxlRG93bigpIHtcclxuICAgICAgICB0aGlzLmNhbnZhcy5zY2FsZURvd24oKVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzY2FsZVVwKCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLnNjYWxlVXAoKVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXRTY2FsZShzY2FsZVZhbHVlOiBudW1iZXIpIHtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzY2FsZVZhbCA9IE1hdGgubWF4KDAsIHNjYWxlVmFsdWUpXHJcbiAgICAgICAgdGhpcy5jYW52YXMuc2V0U2NhbGUoc2NhbGVWYWwpXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhZGp1c3RXaGVlbFNjYWxlKGV2ZW50KSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNhbnZhcy5mbG93Lmhhc1Jvb3QoKSkge1xyXG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAvLyBzY2FsZSBkb3duIC8gem9vbSBvdXRcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmRlbHRhWSA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2NhbGVEb3duKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzY2FsZSB1cCAvIHpvb20gaW5cclxuICAgICAgICAgICAgZWxzZSBpZiAoZXZlbnQuZGVsdGFZIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zY2FsZVVwKClcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59Il19