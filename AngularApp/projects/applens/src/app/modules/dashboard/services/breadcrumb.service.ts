import { Injectable } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { BreadcrumbNavigationItem } from "diagnostic-data";
import { BehaviorSubject } from "rxjs";
import { ApplensDiagnosticService } from "./applens-diagnostic.service";



@Injectable()
export class BreadcrumbService {
    private readonly defaultBreadcrumbItem: BreadcrumbNavigationItem = {
        name: "Home"
    };
    public breadcrumbSubject: BehaviorSubject<BreadcrumbNavigationItem[]> = new BehaviorSubject([this.defaultBreadcrumbItem]);
    private resourceId: string = "";
    private get breadcrumbList() {
        return this.breadcrumbSubject.getValue();
    }
    constructor(private _router: Router, private _diagnosticService: ApplensDiagnosticService, private _activatedRoute: ActivatedRoute) {
        this.resourceId = this._diagnosticService.resourceId;
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
        if(itemIndex === 0) {
            this.resetBreadCrumbSubject();
        } else if(itemIndex > 0) {
            //Remove all items includes the one you clicked
            const removeItemCount = copiedList.length - itemIndex;
            copiedList.splice(itemIndex, removeItemCount);
            this.breadcrumbSubject.next(copiedList);
        }


        const queryParams = this._activatedRoute.snapshot.queryParams;
        if (item.name === "Home" && item.id == undefined) {
            this._router.navigate([this.resourceId], { queryParamsHandling: "preserve" });
            return;
        }

        if (item && item.isDetector) {
            this._router.navigate([`${this.resourceId}/detectors/${item.id}`], { queryParamsHandling: "preserve" });
            return;
        }

        if (item && !item.isDetector) {
            this._router.navigate([`${this.resourceId}/analysis/${item.id}`], { queryParamsHandling: "preserve" });
            return;
        }
    }

}