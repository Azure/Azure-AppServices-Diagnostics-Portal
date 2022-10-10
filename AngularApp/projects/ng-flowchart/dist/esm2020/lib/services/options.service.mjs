import { Injectable } from '@angular/core';
import { NgFlowchart } from '../model/flow.model';
import * as i0 from "@angular/core";
export class OptionsService {
    constructor() {
        this._callbacks = {};
        this._options = new NgFlowchart.Options();
    }
    setOptions(options) {
        this._options = this.sanitizeOptions(options);
    }
    setCallbacks(callbacks) {
        this._callbacks = callbacks;
    }
    get options() {
        return this._options;
    }
    get callbacks() {
        return this._callbacks;
    }
    sanitizeOptions(options) {
        const defaultOpts = new NgFlowchart.Options();
        options = {
            ...defaultOpts,
            ...options
        };
        options.stepGap = Math.max(options.stepGap, 20) || 40;
        options.hoverDeadzoneRadius = Math.max(options.hoverDeadzoneRadius, 0) || 20;
        return options;
    }
}
OptionsService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
OptionsService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: OptionsService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return []; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2xpYi9zZXJ2aWNlcy9vcHRpb25zLnNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUMzQyxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0scUJBQXFCLENBQUM7O0FBR2xELE1BQU0sT0FBTyxjQUFjO0lBS3ZCO1FBRlEsZUFBVSxHQUEwQixFQUFFLENBQUM7UUFHM0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM5QyxDQUFDO0lBRUQsVUFBVSxDQUFDLE9BQU87UUFDZCxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELFlBQVksQ0FBQyxTQUFTO1FBQ2xCLElBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDO0lBQ2hDLENBQUM7SUFFRCxJQUFJLE9BQU87UUFDUCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDekIsQ0FBQztJQUVELElBQUksU0FBUztRQUNULE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQztJQUMzQixDQUFDO0lBRU8sZUFBZSxDQUFDLE9BQTRCO1FBQ2hELE1BQU0sV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRTlDLE9BQU8sR0FBRztZQUNSLEdBQUcsV0FBVztZQUNkLEdBQUcsT0FBTztTQUNYLENBQUM7UUFFRixPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEQsT0FBTyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUU3RSxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDOzs0R0FyQ1EsY0FBYztnSEFBZCxjQUFjOzRGQUFkLGNBQWM7a0JBRDFCLFVBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcbmltcG9ydCB7IE5nRmxvd2NoYXJ0IH0gZnJvbSAnLi4vbW9kZWwvZmxvdy5tb2RlbCc7XHJcblxyXG5ASW5qZWN0YWJsZSgpXHJcbmV4cG9ydCBjbGFzcyBPcHRpb25zU2VydmljZSB7XHJcblxyXG4gICAgcHJpdmF0ZSBfb3B0aW9uczogTmdGbG93Y2hhcnQuT3B0aW9ucztcclxuICAgIHByaXZhdGUgX2NhbGxiYWNrczogTmdGbG93Y2hhcnQuQ2FsbGJhY2tzID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IG5ldyBOZ0Zsb3djaGFydC5PcHRpb25zKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0T3B0aW9ucyhvcHRpb25zKSB7XHJcbiAgICAgICAgdGhpcy5fb3B0aW9ucyA9IHRoaXMuc2FuaXRpemVPcHRpb25zKG9wdGlvbnMpOyAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2FsbGJhY2tzKGNhbGxiYWNrcykge1xyXG4gICAgICAgIHRoaXMuX2NhbGxiYWNrcyA9IGNhbGxiYWNrcztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgb3B0aW9ucygpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fb3B0aW9ucztcclxuICAgIH1cclxuXHJcbiAgICBnZXQgY2FsbGJhY2tzKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLl9jYWxsYmFja3M7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzYW5pdGl6ZU9wdGlvbnMob3B0aW9uczogTmdGbG93Y2hhcnQuT3B0aW9ucyk6IE5nRmxvd2NoYXJ0Lk9wdGlvbnMge1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRPcHRzID0gbmV3IE5nRmxvd2NoYXJ0Lk9wdGlvbnMoKTtcclxuXHJcbiAgICAgICAgb3B0aW9ucyA9IHtcclxuICAgICAgICAgIC4uLmRlZmF1bHRPcHRzLFxyXG4gICAgICAgICAgLi4ub3B0aW9uc1xyXG4gICAgICAgIH07XHJcbiAgICBcclxuICAgICAgICBvcHRpb25zLnN0ZXBHYXAgPSBNYXRoLm1heChvcHRpb25zLnN0ZXBHYXAsIDIwKSB8fCA0MDtcclxuICAgICAgICBvcHRpb25zLmhvdmVyRGVhZHpvbmVSYWRpdXMgPSBNYXRoLm1heChvcHRpb25zLmhvdmVyRGVhZHpvbmVSYWRpdXMsIDApIHx8IDIwO1xyXG4gICAgXHJcbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XHJcbiAgICB9XHJcbn0iXX0=