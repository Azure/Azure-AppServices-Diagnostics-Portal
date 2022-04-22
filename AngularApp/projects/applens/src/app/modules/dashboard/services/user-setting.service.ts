import { Injectable } from "@angular/core";
import { AdalService } from "adal-angular4";
import { map, catchError } from "rxjs/operators";
import { BehaviorSubject, of } from "rxjs";
import { RecentResource, UserSetting, } from "../../../shared/models/user-setting";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

const maxRecentResourceLength = 5;
@Injectable()
export class UserSettingService {
    userSetting: UserSetting;
    userId: string = "";
    currentTheme: string = "light";
    currentViewMode: string = "smarter";
    currentThemeSub: BehaviorSubject<string> = new BehaviorSubject<string>("light");
    currentViewModeSub: BehaviorSubject<string> = new BehaviorSubject<string>("smarter");
    isWaterfallViewSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService) {
        const alias = !!this._adalService.userInfo.profile && !!this._adalService.userInfo.profile.upn ? this._adalService.userInfo.profile.upn : '';
        this.userId = alias.replace('@microsoft.com', '');

        if (this.userId != "") {
            this.getUserSetting().subscribe((userSetting) => {
                this.userSetting = userSetting;
            });
        }
    }

    getUserSetting() {
        const alias = !!this._adalService.userInfo.profile && !!this._adalService.userInfo.profile.upn ? this._adalService.userInfo.profile.upn : '';
        this.userId = alias.replace('@microsoft.com', '');

        if (!!this.userSetting) {
            return of(this.userSetting);
        }

        return this._diagnosticApiService.getUserSetting(this.userId).pipe(
            map(userSetting => {
                this.userSetting = userSetting;
                return userSetting;
            })
        );
    }

    getExpandAnalysisCheckCard() {
        return this.getUserSetting().pipe(map(userSetting => userSetting.expandAnalysisCheckCard));
    }

    isWaterfallViewMode() {
        return this.getUserSetting().pipe(map(userSetting => { return userSetting.viewMode == "waterfall" }));
    }

    updateRecentResource(recentResource: RecentResource) {
        this.updateUserSetting(recentResource, this.addRecentResource);
    }

    updateThemeAndView(updatedUserSetting: UserSetting) {
        this.currentTheme = updatedUserSetting.theme;
        this.currentThemeSub.next(this.currentTheme);
        this.currentViewMode = updatedUserSetting.viewMode;
        this.currentViewModeSub.next(this.currentViewMode);
    }

    public updateUserSetting(item: any, fn: UpdateUserSettingCallBack) {
        this.getUserSetting().pipe(catchError(error => {
            if (error.status === 404) {
                const userSetting = new UserSetting(this.userId);
                return of(userSetting);
            }
            throw error;
        })).subscribe(userSetting => {
            const updatedUserSetting = fn(item, userSetting);

            this._diagnosticApiService.updateUserSetting(updatedUserSetting).subscribe(setting => {
                this.userSetting = setting;
            })
        });
    }

    updateUserPanelSetting(item: any) {
        this.updateUserSetting(item, this.updatePanelUserSettingCallBack);
    }

    updatePanelUserSettingCallBack(item: any, userSettings: UserSetting): UserSetting {
        const newUserSetting = { ...userSettings };
        if (item != null) {
            newUserSetting.expandAnalysisCheckCard = item.expandCheckCard;
            newUserSetting.theme = item.theme;
            newUserSetting.viewMode = item.viewMode;
        }

        return newUserSetting;
    }

    updateDefaultServiceType(serviceType:string) {
        if(this.userSetting) {
            this.userSetting.defaultServiceType = serviceType;
        }
    }

    private addRecentResource(newResource: RecentResource, userSetting: UserSetting) {
        const newUserSetting = { ...userSetting };
        const res = [...newUserSetting.resources];
        const index = userSetting.resources.findIndex(resource => resource.resourceUri.toLowerCase() === newResource.resourceUri.toLowerCase());
        if (index >= 0) {
            res.splice(index, 1);
        } else if (res.length >= maxRecentResourceLength) {
            res.pop();
        }
        res.unshift(newResource);

        newUserSetting.resources = res;
        return newUserSetting;
    }
}

type UpdateUserSettingCallBack = (item: any, userSetting: UserSetting) => UserSetting
