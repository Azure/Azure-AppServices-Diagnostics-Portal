import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AdalService } from "adal-angular4";
import { BehaviorSubject, combineLatest, merge } from "rxjs";
import { map } from "rxjs/operators";
import { L2SideNavType, l2SideNavWidth } from "./modules/dashboard/l2-side-nav/l2-side-nav";
import { l1SideNavCollapseWidth, l1SideNavExpandWidth } from "./shared/components/l1-side-nav/l1-side-nav";



@Injectable()
export class ApplensGlobal {
    constructor(private _route: ActivatedRoute, private _adalService: AdalService) { }
    openL2SideNavSubject: BehaviorSubject<L2SideNavType> = new BehaviorSubject<L2SideNavType>(L2SideNavType.None);
    expandL1SideNavSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    dashboardTitleSubject: BehaviorSubject<string> = new BehaviorSubject<string>("");

    showCommAlertSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


    openFeedback: boolean = false;
    getDetectorName(): string {
        const detectorId = this._route.firstChild.firstChild.firstChild.firstChild.firstChild.snapshot.params["detector"];
        return detectorId;
    }

    getUserAlias(): string {
        const alias: string = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
        return alias;
    }

    private calcSideNavOverallWidth(isL1Expand: boolean, isL2Open: boolean): number {
        const l1Width = isL1Expand ? l1SideNavExpandWidth : l1SideNavCollapseWidth;
        const l2Width = isL2Open ? l2SideNavWidth : 0;
        return l1Width + l2Width;
    }

    getSideNavWidth() {
        const isL2NavShowSub = this.openL2SideNavSubject.pipe(map(type => type !== L2SideNavType.None));
        const mergeSideNavSub = combineLatest(this.expandL1SideNavSubject,isL2NavShowSub).pipe(map(input => {
            return this.calcSideNavOverallWidth(input[0],input[1]);
        }));
        return mergeSideNavSub;
    }
}
