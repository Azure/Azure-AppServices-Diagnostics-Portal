import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { L2SideNavType } from "./modules/dashboard/l2-side-nav/l2-side-nav.component";

@Injectable()
export class ApplensGlobal {
    openL2SideNavSubject:BehaviorSubject<L2SideNavType> = new BehaviorSubject<L2SideNavType>(L2SideNavType.None);

    dashboardTitleSubject:BehaviorSubject<string> = new BehaviorSubject<string>("");
}
