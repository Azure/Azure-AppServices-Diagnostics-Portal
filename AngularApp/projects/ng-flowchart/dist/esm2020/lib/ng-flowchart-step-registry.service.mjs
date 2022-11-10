import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
export class NgFlowchartStepRegistry {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LXN0ZXAtcmVnaXN0cnkuc2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvbmctZmxvd2NoYXJ0LXN0ZXAtcmVnaXN0cnkuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFxQixNQUFNLGVBQWUsQ0FBQzs7QUFNOUQsTUFBTSxPQUFPLHVCQUF1QjtJQUloQztRQUZRLGFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBNkQsQ0FBQztJQUl4RixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksQ0FBQyxJQUFZLEVBQUUsSUFBdUQ7UUFDOUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRCxXQUFXLENBQUMsSUFBWTtRQUNwQixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7O3FIQW5CUSx1QkFBdUI7eUhBQXZCLHVCQUF1QixjQUZwQixNQUFNOzRGQUVULHVCQUF1QjtrQkFIbkMsVUFBVTttQkFBQztvQkFDUixVQUFVLEVBQUUsTUFBTTtpQkFDckIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlLCBUZW1wbGF0ZVJlZiwgVHlwZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQgfSBmcm9tICcuL25nLWZsb3djaGFydC1zdGVwL25nLWZsb3djaGFydC1zdGVwLmNvbXBvbmVudCc7XHJcblxyXG5ASW5qZWN0YWJsZSh7XHJcbiAgICBwcm92aWRlZEluOiAncm9vdCdcclxufSlcclxuZXhwb3J0IGNsYXNzIE5nRmxvd2NoYXJ0U3RlcFJlZ2lzdHJ5IHtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSByZWdpc3RyeSA9IG5ldyBNYXA8c3RyaW5nLCBUeXBlPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4gfCBUZW1wbGF0ZVJlZjxhbnk+PigpO1xyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZWdpc3RlciBhIHN0ZXAgaW1wbGVtZW50YXRpb24uIE9ubHkgbmVlZGVkIGlmIHlvdSBhcmUgdXBsb2FkaW5nIGEgZmxvdyBmcm9tIGpzb25cclxuICAgICAqIEBwYXJhbSB0eXBlIFRoZSB1bmlxdWUgdHlwZSBvZiB0aGUgc3RlcFxyXG4gICAgICogQHBhcmFtIHN0ZXAgVGhlIHN0ZXAgdGVtcGxhdGVSZWYgb3IgY29tcG9uZW50IHR5cGUgdG8gY3JlYXRlIGZvciB0aGlzIGtleVxyXG4gICAgICovXHJcbiAgICByZWdpc3RlclN0ZXAodHlwZTogc3RyaW5nLCBzdGVwOiBUeXBlPE5nRmxvd2NoYXJ0U3RlcENvbXBvbmVudD4gfCBUZW1wbGF0ZVJlZjxhbnk+KSB7XHJcbiAgICAgICAgdGhpcy5yZWdpc3RyeS5zZXQodHlwZSwgc3RlcCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U3RlcEltcGwodHlwZTogc3RyaW5nKTogVHlwZTxOZ0Zsb3djaGFydFN0ZXBDb21wb25lbnQ+IHwgVGVtcGxhdGVSZWY8YW55PiB8IG51bGwge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJlZ2lzdHJ5LmdldCh0eXBlKTtcclxuICAgIH1cclxuXHJcblxyXG59Il19