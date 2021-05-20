import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { L2SideNavType } from "./modules/dashboard/l2-side-nav/l2-side-nav.component";

@Injectable()
export class ApplensGlobal {
    constructor(private _route:ActivatedRoute) {}
    openL2SideNavSubject:BehaviorSubject<L2SideNavType> = new BehaviorSubject<L2SideNavType>(L2SideNavType.None);

    dashboardTitleSubject:BehaviorSubject<string> = new BehaviorSubject<string>("");

    openFeedback:boolean = false;
    getDetectorName():string {
        const detectorId = this._route.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot.params["detector"];
        return detectorId;
    }
}
