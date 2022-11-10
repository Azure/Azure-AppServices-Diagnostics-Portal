import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@angular/common";
export class NgFlowchartArrowComponent {
    constructor() {
        this.opacity = 1;
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.containerLeft = 0;
        this.containerTop = 0;
        //to be applied on left and right edges
        this.padding = 10;
        this.isLeftFlowing = false;
    }
    set position(pos) {
        this._position = pos;
        this.isLeftFlowing = pos.start[0] > pos.end[0];
        //in the case where steps are directly underneath we need some minimum width
        this.containerWidth = Math.abs(pos.start[0] - pos.end[0]) + (this.padding * 2);
        this.containerLeft = Math.min(pos.start[0], pos.end[0]) - this.padding;
        this.containerHeight = Math.abs(pos.start[1] - pos.end[1]);
        this.containerTop = pos.start[1];
        this.updatePath();
    }
    ngOnInit() {
    }
    ngAfterViewInit() {
        this.updatePath();
    }
    hideArrow() {
        this.opacity = .2;
    }
    showArrow() {
        this.opacity = 1;
    }
    updatePath() {
        if (!this.arrow?.nativeElement) {
            return;
        }
        if (this.isLeftFlowing) {
            this.arrow.nativeElement.setAttribute("d", `
        M${this.containerWidth - this.padding},0 
        L${this.containerWidth - this.padding},${this.containerHeight / 2}
        L${this.padding},${this.containerHeight / 2}
        L${this.padding},${this.containerHeight - 4}
      `);
        }
        else {
            this.arrow.nativeElement.setAttribute("d", `
        M${this.padding},0 
        L${this.padding},${this.containerHeight / 2}
        L${this.containerWidth - this.padding},${this.containerHeight / 2}
        L${this.containerWidth - this.padding},${this.containerHeight - 4}
      `);
        }
    }
}
NgFlowchartArrowComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartArrowComponent, deps: [], target: i0.ɵɵFactoryTarget.Component });
NgFlowchartArrowComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: NgFlowchartArrowComponent, selector: "lib-ng-flowchart-arrow", inputs: { position: "position" }, viewQueries: [{ propertyName: "arrow", first: true, predicate: ["arrow"], descendants: true }], ngImport: i0, template: "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  [ngStyle]=\"{\r\n      height: containerHeight+'px',\r\n      width: containerWidth+'px',\r\n      left: containerLeft+'px',\r\n      top: containerTop+'px',\r\n      opacity: opacity\r\n  }\"\r\n  class=\"ngflowchart-arrow\"\r\n>\r\n  <defs>\r\n    <marker\r\n      id=\"arrowhead\"\r\n      viewBox=\"0 0 10 10\"\r\n      refX=\"3\"\r\n      refY=\"5\"\r\n      markerWidth=\"5\"\r\n      markerHeight=\"5\"\r\n      orient=\"auto\"\r\n      fill=\"grey\"\r\n    >\r\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\r\n    </marker>\r\n  </defs>\r\n  <g id=\"arrowpath\" fill=\"none\" stroke=\"grey\" stroke-width=\"2\" marker-end=\"url(#arrowhead)\">\r\n    <path id=\"arrow\" #arrow />\r\n  </g>\r\n</svg>\r\n", styles: ["svg{position:absolute;z-index:0;transition:all .2s}\n"], directives: [{ type: i1.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: NgFlowchartArrowComponent, decorators: [{
            type: Component,
            args: [{ selector: 'lib-ng-flowchart-arrow', template: "<svg\r\n  xmlns=\"http://www.w3.org/2000/svg\"\r\n  [ngStyle]=\"{\r\n      height: containerHeight+'px',\r\n      width: containerWidth+'px',\r\n      left: containerLeft+'px',\r\n      top: containerTop+'px',\r\n      opacity: opacity\r\n  }\"\r\n  class=\"ngflowchart-arrow\"\r\n>\r\n  <defs>\r\n    <marker\r\n      id=\"arrowhead\"\r\n      viewBox=\"0 0 10 10\"\r\n      refX=\"3\"\r\n      refY=\"5\"\r\n      markerWidth=\"5\"\r\n      markerHeight=\"5\"\r\n      orient=\"auto\"\r\n      fill=\"grey\"\r\n    >\r\n      <path d=\"M 0 0 L 10 5 L 0 10 z\" />\r\n    </marker>\r\n  </defs>\r\n  <g id=\"arrowpath\" fill=\"none\" stroke=\"grey\" stroke-width=\"2\" marker-end=\"url(#arrowhead)\">\r\n    <path id=\"arrow\" #arrow />\r\n  </g>\r\n</svg>\r\n", styles: ["svg{position:absolute;z-index:0;transition:all .2s}\n"] }]
        }], ctorParameters: function () { return []; }, propDecorators: { arrow: [{
                type: ViewChild,
                args: ['arrow']
            }], position: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctZmxvd2NoYXJ0LWFycm93LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9saWIvbmctZmxvd2NoYXJ0LWFycm93L25nLWZsb3djaGFydC1hcnJvdy5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9zcmMvbGliL25nLWZsb3djaGFydC1hcnJvdy9uZy1mbG93Y2hhcnQtYXJyb3cuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFpQixTQUFTLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBVSxTQUFTLEVBQUUsTUFBTSxlQUFlLENBQUM7OztBQU8vRixNQUFNLE9BQU8seUJBQXlCO0lBa0NwQztRQVpBLFlBQU8sR0FBRyxDQUFDLENBQUM7UUFDWixtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixvQkFBZSxHQUFXLENBQUMsQ0FBQztRQUM1QixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUl6Qix1Q0FBdUM7UUFDL0IsWUFBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLGtCQUFhLEdBQUcsS0FBSyxDQUFDO0lBRWQsQ0FBQztJQTdCakIsSUFDSSxRQUFRLENBQUMsR0FBdUM7UUFDbEQsSUFBSSxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFFckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFL0MsNEVBQTRFO1FBQzVFLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFL0UsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFdkUsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVqQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQWdCRCxRQUFRO0lBQ1IsQ0FBQztJQUVELGVBQWU7UUFDYixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVELFNBQVM7UUFDUCxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRUQsU0FBUztRQUNQLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFTyxVQUFVO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRTtZQUM5QixPQUFPO1NBQ1I7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDdEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtXQUN0QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPO1dBQ2xDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUM7V0FDOUQsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUM7V0FDeEMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUM7T0FDNUMsQ0FBQyxDQUFDO1NBQ0o7YUFDSTtZQUNILElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUU7V0FDdEMsSUFBSSxDQUFDLE9BQU87V0FDWixJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQztXQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDO1dBQzlELElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsZUFBZSxHQUFHLENBQUM7T0FDbEUsQ0FBQyxDQUFDO1NBQ0o7SUFHSCxDQUFDOzt1SEExRVUseUJBQXlCOzJHQUF6Qix5QkFBeUIsZ01DUHRDLDB2QkE2QkE7NEZEdEJhLHlCQUF5QjtrQkFMckMsU0FBUzsrQkFDRSx3QkFBd0I7MEVBT2xDLEtBQUs7c0JBREosU0FBUzt1QkFBQyxPQUFPO2dCQUlkLFFBQVE7c0JBRFgsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFmdGVyVmlld0luaXQsIENvbXBvbmVudCwgRWxlbWVudFJlZiwgSW5wdXQsIE9uSW5pdCwgVmlld0NoaWxkIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XHJcblxyXG5AQ29tcG9uZW50KHtcclxuICBzZWxlY3RvcjogJ2xpYi1uZy1mbG93Y2hhcnQtYXJyb3cnLFxyXG4gIHRlbXBsYXRlVXJsOiAnLi9uZy1mbG93Y2hhcnQtYXJyb3cuY29tcG9uZW50Lmh0bWwnLFxyXG4gIHN0eWxlVXJsczogWycuL25nLWZsb3djaGFydC1hcnJvdy5jb21wb25lbnQuc2NzcyddXHJcbn0pXHJcbmV4cG9ydCBjbGFzcyBOZ0Zsb3djaGFydEFycm93Q29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBBZnRlclZpZXdJbml0IHtcclxuXHJcbiAgQFZpZXdDaGlsZCgnYXJyb3cnKVxyXG4gIGFycm93OiBFbGVtZW50UmVmO1xyXG5cclxuICBASW5wdXQoKVxyXG4gIHNldCBwb3NpdGlvbihwb3M6IHsgc3RhcnQ6IG51bWJlcltdLCBlbmQ6IG51bWJlcltdIH0pIHtcclxuICAgIHRoaXMuX3Bvc2l0aW9uID0gcG9zO1xyXG5cclxuICAgIHRoaXMuaXNMZWZ0Rmxvd2luZyA9IHBvcy5zdGFydFswXSA+IHBvcy5lbmRbMF07XHJcblxyXG4gICAgLy9pbiB0aGUgY2FzZSB3aGVyZSBzdGVwcyBhcmUgZGlyZWN0bHkgdW5kZXJuZWF0aCB3ZSBuZWVkIHNvbWUgbWluaW11bSB3aWR0aFxyXG4gICAgdGhpcy5jb250YWluZXJXaWR0aCA9IE1hdGguYWJzKHBvcy5zdGFydFswXSAtIHBvcy5lbmRbMF0pICsgKHRoaXMucGFkZGluZyAqIDIpO1xyXG5cclxuICAgIHRoaXMuY29udGFpbmVyTGVmdCA9IE1hdGgubWluKHBvcy5zdGFydFswXSwgcG9zLmVuZFswXSkgLSB0aGlzLnBhZGRpbmc7XHJcblxyXG4gICAgdGhpcy5jb250YWluZXJIZWlnaHQgPSBNYXRoLmFicyhwb3Muc3RhcnRbMV0gLSBwb3MuZW5kWzFdKTtcclxuICAgIHRoaXMuY29udGFpbmVyVG9wID0gcG9zLnN0YXJ0WzFdO1xyXG5cclxuICAgIHRoaXMudXBkYXRlUGF0aCgpO1xyXG4gIH1cclxuXHJcbiAgb3BhY2l0eSA9IDE7XHJcbiAgY29udGFpbmVyV2lkdGg6IG51bWJlciA9IDA7XHJcbiAgY29udGFpbmVySGVpZ2h0OiBudW1iZXIgPSAwO1xyXG4gIGNvbnRhaW5lckxlZnQ6IG51bWJlciA9IDA7XHJcbiAgY29udGFpbmVyVG9wOiBudW1iZXIgPSAwO1xyXG4gIF9wb3NpdGlvbjogeyBzdGFydDogbnVtYmVyW10sIGVuZDogbnVtYmVyW10gfVxyXG5cclxuXHJcbiAgLy90byBiZSBhcHBsaWVkIG9uIGxlZnQgYW5kIHJpZ2h0IGVkZ2VzXHJcbiAgcHJpdmF0ZSBwYWRkaW5nID0gMTA7XHJcbiAgcHJpdmF0ZSBpc0xlZnRGbG93aW5nID0gZmFsc2U7XHJcblxyXG4gIGNvbnN0cnVjdG9yKCkgeyB9XHJcblxyXG4gIG5nT25Jbml0KCk6IHZvaWQge1xyXG4gIH1cclxuXHJcbiAgbmdBZnRlclZpZXdJbml0KCkge1xyXG4gICAgdGhpcy51cGRhdGVQYXRoKCk7XHJcbiAgfVxyXG5cclxuICBoaWRlQXJyb3coKSB7XHJcbiAgICB0aGlzLm9wYWNpdHkgPSAuMjtcclxuICB9XHJcblxyXG4gIHNob3dBcnJvdygpIHtcclxuICAgIHRoaXMub3BhY2l0eSA9IDE7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIHVwZGF0ZVBhdGgoKSB7XHJcbiAgICBpZiAoIXRoaXMuYXJyb3c/Lm5hdGl2ZUVsZW1lbnQpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLmlzTGVmdEZsb3dpbmcpIHtcclxuICAgICAgdGhpcy5hcnJvdy5uYXRpdmVFbGVtZW50LnNldEF0dHJpYnV0ZShcImRcIiwgYFxyXG4gICAgICAgIE0ke3RoaXMuY29udGFpbmVyV2lkdGggLSB0aGlzLnBhZGRpbmd9LDAgXHJcbiAgICAgICAgTCR7dGhpcy5jb250YWluZXJXaWR0aCAtIHRoaXMucGFkZGluZ30sJHt0aGlzLmNvbnRhaW5lckhlaWdodCAvIDJ9XHJcbiAgICAgICAgTCR7dGhpcy5wYWRkaW5nfSwke3RoaXMuY29udGFpbmVySGVpZ2h0IC8gMn1cclxuICAgICAgICBMJHt0aGlzLnBhZGRpbmd9LCR7dGhpcy5jb250YWluZXJIZWlnaHQgLSA0fVxyXG4gICAgICBgKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICB0aGlzLmFycm93Lm5hdGl2ZUVsZW1lbnQuc2V0QXR0cmlidXRlKFwiZFwiLCBgXHJcbiAgICAgICAgTSR7dGhpcy5wYWRkaW5nfSwwIFxyXG4gICAgICAgIEwke3RoaXMucGFkZGluZ30sJHt0aGlzLmNvbnRhaW5lckhlaWdodCAvIDJ9XHJcbiAgICAgICAgTCR7dGhpcy5jb250YWluZXJXaWR0aCAtIHRoaXMucGFkZGluZ30sJHt0aGlzLmNvbnRhaW5lckhlaWdodCAvIDJ9XHJcbiAgICAgICAgTCR7dGhpcy5jb250YWluZXJXaWR0aCAtIHRoaXMucGFkZGluZ30sJHt0aGlzLmNvbnRhaW5lckhlaWdodCAtIDR9XHJcbiAgICAgIGApO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgfVxyXG5cclxufVxyXG4iLCI8c3ZnXHJcbiAgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXHJcbiAgW25nU3R5bGVdPVwie1xyXG4gICAgICBoZWlnaHQ6IGNvbnRhaW5lckhlaWdodCsncHgnLFxyXG4gICAgICB3aWR0aDogY29udGFpbmVyV2lkdGgrJ3B4JyxcclxuICAgICAgbGVmdDogY29udGFpbmVyTGVmdCsncHgnLFxyXG4gICAgICB0b3A6IGNvbnRhaW5lclRvcCsncHgnLFxyXG4gICAgICBvcGFjaXR5OiBvcGFjaXR5XHJcbiAgfVwiXHJcbiAgY2xhc3M9XCJuZ2Zsb3djaGFydC1hcnJvd1wiXHJcbj5cclxuICA8ZGVmcz5cclxuICAgIDxtYXJrZXJcclxuICAgICAgaWQ9XCJhcnJvd2hlYWRcIlxyXG4gICAgICB2aWV3Qm94PVwiMCAwIDEwIDEwXCJcclxuICAgICAgcmVmWD1cIjNcIlxyXG4gICAgICByZWZZPVwiNVwiXHJcbiAgICAgIG1hcmtlcldpZHRoPVwiNVwiXHJcbiAgICAgIG1hcmtlckhlaWdodD1cIjVcIlxyXG4gICAgICBvcmllbnQ9XCJhdXRvXCJcclxuICAgICAgZmlsbD1cImdyZXlcIlxyXG4gICAgPlxyXG4gICAgICA8cGF0aCBkPVwiTSAwIDAgTCAxMCA1IEwgMCAxMCB6XCIgLz5cclxuICAgIDwvbWFya2VyPlxyXG4gIDwvZGVmcz5cclxuICA8ZyBpZD1cImFycm93cGF0aFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiZ3JleVwiIHN0cm9rZS13aWR0aD1cIjJcIiBtYXJrZXItZW5kPVwidXJsKCNhcnJvd2hlYWQpXCI+XHJcbiAgICA8cGF0aCBpZD1cImFycm93XCIgI2Fycm93IC8+XHJcbiAgPC9nPlxyXG48L3N2Zz5cclxuIl19