import { AfterViewInit, ElementRef } from '@angular/core';
import { NgFlowchart } from './model/flow.model';
import { DropDataService } from './services/dropdata.service';
import * as i0 from "@angular/core";
export declare class NgFlowchartStepDirective implements AfterViewInit {
    protected element: ElementRef<HTMLElement>;
    private data;
    onDragStart(event: DragEvent): void;
    onDragEnd(event: DragEvent): void;
    flowStep: NgFlowchart.PendingStep;
    constructor(element: ElementRef<HTMLElement>, data: DropDataService);
    ngAfterViewInit(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgFlowchartStepDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NgFlowchartStepDirective, "[ngFlowchartStep]", never, { "flowStep": "ngFlowchartStep"; }, {}, never>;
}
