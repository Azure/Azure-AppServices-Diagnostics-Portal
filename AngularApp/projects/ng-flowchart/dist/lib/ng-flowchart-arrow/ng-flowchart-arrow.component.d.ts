import { AfterViewInit, ElementRef, OnInit } from '@angular/core';
import * as i0 from "@angular/core";
export declare class NgFlowchartArrowComponent implements OnInit, AfterViewInit {
    arrow: ElementRef;
    set position(pos: {
        start: number[];
        end: number[];
    });
    opacity: number;
    containerWidth: number;
    containerHeight: number;
    containerLeft: number;
    containerTop: number;
    _position: {
        start: number[];
        end: number[];
    };
    private padding;
    private isLeftFlowing;
    constructor();
    ngOnInit(): void;
    ngAfterViewInit(): void;
    hideArrow(): void;
    showArrow(): void;
    private updatePath;
    static ɵfac: i0.ɵɵFactoryDeclaration<NgFlowchartArrowComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<NgFlowchartArrowComponent, "lib-ng-flowchart-arrow", never, { "position": "position"; }, {}, never, never>;
}
