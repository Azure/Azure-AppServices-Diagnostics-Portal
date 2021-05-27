import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AdalService } from "adal-angular4";
import { BehaviorSubject } from "rxjs";
import { L2SideNavType } from "./modules/dashboard/l2-side-nav/l2-side-nav-type";


@Injectable()
export class ApplensGlobal {
    constructor(private _route:ActivatedRoute,private _adalService:AdalService) {}
    openL2SideNavSubject:BehaviorSubject<L2SideNavType> = new BehaviorSubject<L2SideNavType>(L2SideNavType.None);

    dashboardTitleSubject:BehaviorSubject<string> = new BehaviorSubject<string>("");

    openFeedback:boolean = false;
    getDetectorName():string {
        const detectorId = this._route.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot.params["detector"];
        return detectorId;
    }

    getUserAlias():string {
        const alias:string = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
        return alias;
    }
}
