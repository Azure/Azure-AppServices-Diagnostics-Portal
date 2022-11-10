import { ComponentRef, ViewContainerRef } from '@angular/core';
import { NgFlowchart } from './model/flow.model';
import { NgFlowchartStepComponent } from './ng-flowchart-step/ng-flowchart-step.component';
import { CanvasRendererService } from './services/canvas-renderer.service';
import { DropDataService as DragService } from './services/dropdata.service';
import { OptionsService } from './services/options.service';
import { StepManagerService } from './services/step-manager.service';
import * as i0 from "@angular/core";
export declare class CanvasFlow {
    rootStep: NgFlowchartStepComponent;
    private _steps;
    hasRoot(): boolean;
    addStep(step: NgFlowchartStepComponent): void;
    removeStep(step: NgFlowchartStepComponent): void;
    get steps(): ReadonlyArray<NgFlowchartStepComponent>;
    constructor();
}
export declare class NgFlowchartCanvasService {
    private drag;
    options: OptionsService;
    private renderer;
    private stepmanager;
    viewContainer: ViewContainerRef;
    isDragging: boolean;
    currentDropTarget: NgFlowchart.DropTarget;
    flow: CanvasFlow;
    _disabled: boolean;
    get disabled(): boolean;
    noParentError: {
        code: string;
        message: string;
    };
    constructor(drag: DragService, options: OptionsService, renderer: CanvasRendererService, stepmanager: StepManagerService);
    init(view: ViewContainerRef): void;
    moveStep(drag: DragEvent, id: any): void;
    onDrop(drag: DragEvent): Promise<void>;
    onDragStart(drag: DragEvent): void;
    createStepFromType(id: string, type: string, data: any): Promise<ComponentRef<NgFlowchartStepComponent>>;
    createStep(pending: NgFlowchart.PendingStep): Promise<ComponentRef<NgFlowchartStepComponent>>;
    resetScale(): void;
    scaleUp(step?: number): void;
    scaleDown(step?: number): void;
    setScale(scaleValue: number): void;
    addChildStep(componentRef: ComponentRef<NgFlowchartStepComponent>, dropTarget: NgFlowchart.DropTarget): void;
    addToCanvas(componentRef: ComponentRef<NgFlowchartStepComponent>): void;
    reRender(pretty?: boolean): void;
    upload(root: any): Promise<void>;
    private uploadNode;
    private setRoot;
    private addStepToFlow;
    private placeStepBelow;
    private placeStepAdjacent;
    private placeStepAbove;
    private dropError;
    private moveError;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgFlowchartCanvasService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<NgFlowchartCanvasService>;
}
