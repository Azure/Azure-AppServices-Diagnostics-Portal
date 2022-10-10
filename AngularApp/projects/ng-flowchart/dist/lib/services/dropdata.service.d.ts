import { NgFlowchart } from '../model/flow.model';
import * as i0 from "@angular/core";
export declare class DropDataService {
    dragStep: NgFlowchart.PendingStep | NgFlowchart.MoveStep;
    constructor();
    setDragStep(ref: NgFlowchart.PendingStep): void;
    getDragStep(): NgFlowchart.PendingStep | NgFlowchart.MoveStep;
    static ɵfac: i0.ɵɵFactoryDeclaration<DropDataService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DropDataService>;
}
