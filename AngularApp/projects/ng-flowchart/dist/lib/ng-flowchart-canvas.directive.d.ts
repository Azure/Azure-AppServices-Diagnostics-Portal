import { AfterViewInit, ElementRef, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { NgFlowchart } from './model/flow.model';
import { NgFlowchartCanvasService } from './ng-flowchart-canvas.service';
import { OptionsService } from './services/options.service';
import * as i0 from "@angular/core";
export declare class NgFlowchartCanvasDirective implements OnInit, OnDestroy, AfterViewInit {
    protected canvasEle: ElementRef<HTMLElement>;
    private viewContainer;
    private canvas;
    private optionService;
    protected onDrop(event: DragEvent): void;
    protected onDragOver(event: DragEvent): void;
    _options: NgFlowchart.Options;
    _callbacks: NgFlowchart.Callbacks;
    protected onResize(event: any): void;
    protected onZoom(event: any): void;
    set callbacks(callbacks: NgFlowchart.Callbacks);
    set options(options: NgFlowchart.Options);
    get options(): NgFlowchart.Options;
    set disabled(val: boolean);
    get disabled(): boolean;
    private _disabled;
    private _id;
    private canvasContent;
    constructor(canvasEle: ElementRef<HTMLElement>, viewContainer: ViewContainerRef, canvas: NgFlowchartCanvasService, optionService: OptionsService);
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    private createCanvasContent;
    /**
     * Returns the Flow object representing this flow chart.
     */
    getFlow(): NgFlowchart.Flow;
    scaleDown(): void;
    scaleUp(): void;
    setScale(scaleValue: number): void;
    private adjustWheelScale;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgFlowchartCanvasDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgFlowchartCanvasDirective, "[ngFlowchartCanvas]", never, { "callbacks": "ngFlowchartCallbacks"; "options": "ngFlowchartOptions"; "disabled": "disabled"; }, {}, never>;
}
