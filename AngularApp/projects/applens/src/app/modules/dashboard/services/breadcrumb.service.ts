import { Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BreadcrumbNavigationItem, DetectorControlService, TimePickerOptions } from "diagnostic-data";
import { BehaviorSubject } from "rxjs";
import { ApplensDiagnosticService } from "./applens-diagnostic.service";



@Injectable()
export class BreadcrumbService {
    private defaultBreadcrumbItem: BreadcrumbNavigationItem;
    public breadcrumbSubject: BehaviorSubject<BreadcrumbNavigationItem[]> = new BehaviorSubject([]);
    private resourceId: string = "";
    private get breadcrumbList() {
        return this.breadcrumbSubject.getValue();
    }
    constructor(private _router: Router, private _diagnosticService: ApplensDiagnosticService, private _activatedRoute: ActivatedRoute, private _detectorControl: DetectorControlService) {
        this.resourceId = this._diagnosticService.resourceId;
        this.defaultBreadcrumbItem = { name: "Home", fullPath: this.resourceId };
        this.breadcrumbSubject.next([this.defaultBreadcrumbItem]);
    }

    public updateBreadCrumbSubject(breadcrumbItem: BreadcrumbNavigationItem) {
        const breadcrumbList = this.breadcrumbList;
        if (breadcrumbList.findIndex(b => b.name === breadcrumbItem.name) > -1) return;
        this.breadcrumbSubject.next([...breadcrumbList, breadcrumbItem]);
    }

    public resetBreadCrumbSubject() {
        this.breadcrumbSubject.next([this.defaultBreadcrumbItem]);
    }

    public navigate(item: BreadcrumbNavigationItem) {
        const copiedList = [...this.breadcrumbList];
        const itemIndex = copiedList.findIndex(i => i.name === item.name);
        let routingParams = {};
        if (itemIndex === 0) {
            this.resetBreadCrumbSubject();
        } else if (itemIndex > 0) {
            //Remove all items includes the one you clicked
            routingParams = copiedList[itemIndex].queryParams != undefined ? copiedList[itemIndex].queryParams : routingParams;
            const removeItemCount = copiedList.length - itemIndex;
            copiedList.splice(itemIndex, removeItemCount);
            this.breadcrumbSubject.next(copiedList);
        }

        if (!!routingParams["startTime"] && !!routingParams["endTime"]) {
            this._detectorControl.setCustomStartEnd(routingParams["startTime"], routingParams["endTime"], "BreadCrumbControl");
            //Todo, detector control service should able to read and infer TimePickerOptions from startTime and endTime
            this._detectorControl.updateTimePickerInfo({
                selectedKey: TimePickerOptions.Custom,
                selectedText: TimePickerOptions.Custom,
                startDate: new Date(routingParams["startTime"]),
                endDate: new Date(routingParams["endTime"])
            });
        }

        if (item) {
            this._router.navigate([item.fullPath], { queryParams: routingParams,queryParamsHandling:'merge' });
            return;
        }
    }

}
