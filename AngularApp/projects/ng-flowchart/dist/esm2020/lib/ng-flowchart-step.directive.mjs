import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { NgFlowchart } from './model/flow.model';
import { DropDataService } from './services/dropdata.service';
import * as i0 from "@angular/core";
import * as i1 from "./services/dropdata.service";
export class NgFlowchartStepDirective {
    constructor(element, data) {
        this.element = element;
        this.data = data;
        this.element.nativeElement.setAttribute('draggable', 'true');
    }
    onDragStart(event) {
        this.data.setDragStep(this.flowStep);
        event.dataTransfer.setData('type', 'FROM_PALETTE');
    }
    onDragEnd(event) {
        this.data.setDragStep(null);
    }
    ngAfterViewInit() {
    }
}
NgFlowchartStepDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepDirective, deps: [{ token: i0.ElementRef }, { token: i1.DropDataService }], target: i0.ɵɵFactoryTarget.Directive });
NgFlowchartStepDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartStepDirective, selector: "[ngFlowchartStep]", inputs: { flowStep: ["ngFlowchartStep", "flowStep"] }, host: { listeners: { "dragstart": "onDragStart($event)", "dragend": "onDragEnd($event)" } }, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartStepDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngFlowchartStep]'
                }]
        }], ctorParameters: function () { return [{ type: i0.ElementRef }, { type: i1.DropDataService }]; }, propDecorators: { onDragStart: [{
                type: HostListener,
                args: ['dragstart', ['$event']]
            }], onDragEnd: [{
                type: HostListener,
                args: ['dragend', ['$event']]
            }], flowStep: [{
                type: Input,
                args: ['ngFlowchartStep']
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LXN0ZXAuZGlyZWN0aXZlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9uZy1mbG93Y2hhcnQtc3RlcC5kaXJlY3RpdmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFpQixTQUFTLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDMUYsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQzs7O0FBSzlELE1BQU0sT0FBTyx3QkFBd0I7SUFrQmpDLFlBQ2MsT0FBZ0MsRUFDbEMsSUFBcUI7UUFEbkIsWUFBTyxHQUFQLE9BQU8sQ0FBeUI7UUFDbEMsU0FBSSxHQUFKLElBQUksQ0FBaUI7UUFFN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBcEJELFdBQVcsQ0FBQyxLQUFnQjtRQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDckMsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFHRCxTQUFTLENBQUMsS0FBZ0I7UUFFdEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFaEMsQ0FBQztJQVlELGVBQWU7SUFDZixDQUFDOztzSEExQlEsd0JBQXdCOzBHQUF4Qix3QkFBd0I7NEZBQXhCLHdCQUF3QjtrQkFIcEMsU0FBUzttQkFBQztvQkFDUCxRQUFRLEVBQUUsbUJBQW1CO2lCQUNoQzsrSEFJRyxXQUFXO3NCQURWLFlBQVk7dUJBQUMsV0FBVyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQU9yQyxTQUFTO3NCQURSLFlBQVk7dUJBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQVFuQyxRQUFRO3NCQURQLEtBQUs7dUJBQUMsaUJBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWZ0ZXJWaWV3SW5pdCwgRGlyZWN0aXZlLCBFbGVtZW50UmVmLCBIb3N0TGlzdGVuZXIsIElucHV0IH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IE5nRmxvd2NoYXJ0IH0gZnJvbSAnLi9tb2RlbC9mbG93Lm1vZGVsJztcclxuaW1wb3J0IHsgRHJvcERhdGFTZXJ2aWNlIH0gZnJvbSAnLi9zZXJ2aWNlcy9kcm9wZGF0YS5zZXJ2aWNlJztcclxuXHJcbkBEaXJlY3RpdmUoe1xyXG4gICAgc2VsZWN0b3I6ICdbbmdGbG93Y2hhcnRTdGVwXSdcclxufSlcclxuZXhwb3J0IGNsYXNzIE5nRmxvd2NoYXJ0U3RlcERpcmVjdGl2ZSBpbXBsZW1lbnRzIEFmdGVyVmlld0luaXQge1xyXG5cclxuICAgIEBIb3N0TGlzdGVuZXIoJ2RyYWdzdGFydCcsIFsnJGV2ZW50J10pXHJcbiAgICBvbkRyYWdTdGFydChldmVudDogRHJhZ0V2ZW50KSB7XHJcbiAgICAgICAgdGhpcy5kYXRhLnNldERyYWdTdGVwKHRoaXMuZmxvd1N0ZXApO1xyXG4gICAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCd0eXBlJywgJ0ZST01fUEFMRVRURScpO1xyXG4gICAgfVxyXG5cclxuICAgIEBIb3N0TGlzdGVuZXIoJ2RyYWdlbmQnLCBbJyRldmVudCddKVxyXG4gICAgb25EcmFnRW5kKGV2ZW50OiBEcmFnRXZlbnQpIHtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmRhdGEuc2V0RHJhZ1N0ZXAobnVsbCk7XHJcbiAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBASW5wdXQoJ25nRmxvd2NoYXJ0U3RlcCcpXHJcbiAgICBmbG93U3RlcDogTmdGbG93Y2hhcnQuUGVuZGluZ1N0ZXA7XHJcblxyXG4gICAgY29uc3RydWN0b3IoXHJcbiAgICAgICAgcHJvdGVjdGVkIGVsZW1lbnQ6IEVsZW1lbnRSZWY8SFRNTEVsZW1lbnQ+LFxyXG4gICAgICAgIHByaXZhdGUgZGF0YTogRHJvcERhdGFTZXJ2aWNlXHJcbiAgICApIHtcclxuICAgICAgICB0aGlzLmVsZW1lbnQubmF0aXZlRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2RyYWdnYWJsZScsICd0cnVlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgbmdBZnRlclZpZXdJbml0KCkge1xyXG4gICAgfVxyXG59Il19