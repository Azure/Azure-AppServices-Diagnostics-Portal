import { NgFlowchart } from '../model/flow.model';
import * as i0 from "@angular/core";
export declare class OptionsService {
    private _options;
    private _callbacks;
    constructor();
    setOptions(options: any): void;
    setCallbacks(callbacks: any): void;
    get options(): NgFlowchart.Options;
    get callbacks(): NgFlowchart.Callbacks;
    private sanitizeOptions;
    static ɵfac: i0.ɵɵFactoryDeclaration<OptionsService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<OptionsService>;
}
