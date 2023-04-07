import { Injectable } from "@angular/core";
import { AdalService } from "adal-angular4";
import { map } from "rxjs/operators";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { FavoriteDetectorProp, FavoriteDetectors, LandingInfo, RecentResource, UserPanelSetting, UserSetting, } from "../../../shared/models/user-setting";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { Params } from "@angular/router";
import { environment } from "projects/applens/src/environments/environment";

@Injectable()
export class UserSettingService {
    private _userSettingSubject: BehaviorSubject<UserSetting> = new BehaviorSubject(null);
    currentTheme: string = "light";
    currentViewMode: string = "smarter";
    currentThemeSub: BehaviorSubject<string> = new BehaviorSubject<string>("light");
    currentViewModeSub: BehaviorSubject<string> = new BehaviorSubject<string>("smarter");
    isWaterfallViewSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private readonly queryParamsToExclude: string[] = ["branchInput"];
    public defaultServiceType: string = "";
    private set _userSetting(userSetting: UserSetting) {
        this._userSettingSubject.next(userSetting);
    }
    private get _userSetting() {
        return this._userSettingSubject.getValue();
    }

    private get _userId() {
        if (environment.adal.enabled === false){
            return "default";
        }

        const alias = !!this._adalService.userInfo.profile && !!this._adalService.userInfo.profile.upn ? this._adalService.userInfo.profile.upn : '';
        return alias.replace('@microsoft.com', '');
    }

    private readonly maxRecentResources = 5;
    public readonly maxFavoriteDetectors = 10;

    constructor(private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService) {
    }

    getUserSetting(invalidateCache = false, chatGPT = false): Observable<UserSetting> {
        if (!!this._userSetting && !invalidateCache) {
            return this._userSettingSubject;
        }

        if (!chatGPT) {
            return this._diagnosticApiService.getUserSetting(this._userId, invalidateCache).pipe(
                map(userSetting => {
                    this._userSetting = userSetting;
                    return userSetting;
                })
            );
        }
        else {
            return this._diagnosticApiService.getUserSettingChatGPT(this._userId, invalidateCache).pipe(
                map(userSetting => {
                    this._userSetting = userSetting;
                    return userSetting;
                })
            );
        }
    }

    getExpandAnalysisCheckCard() {
        return this.getUserSetting().pipe(map(userSetting => userSetting.expandAnalysisCheckCard));
    }

    isWaterfallViewMode() {
        return this.getUserSetting().pipe(map(userSetting => { return userSetting.viewMode == "waterfall" }));
    }

    excludeQueryParams(qp: Params){
        let newParams: Params = {};
        const keys = Object.keys(qp);
        keys.forEach(x => {
            if (!this.queryParamsToExclude.includes(x)) { newParams[x] = qp[x] }
        });
        return newParams;
    }


    updateThemeAndView(updatedUserSetting: UserSetting) {
        this.currentTheme = updatedUserSetting.theme;
        this.currentThemeSub.next(this.currentTheme);
        this.currentViewMode = updatedUserSetting.viewMode;
        this.currentViewModeSub.next(this.currentViewMode);
    }

    updateDefaultServiceType(serviceType: string) {
        //One thing can do in future is to update default service type in different module
        this.defaultServiceType = serviceType;
    }

    private addRecentResource(newResource: RecentResource, userSetting: UserSetting): RecentResource[] {
        const res = [...this._userSetting.resources];
        const index = userSetting.resources.findIndex(resource => resource.resourceUri.toLowerCase() === newResource.resourceUri.toLowerCase());
        if (index >= 0) {
            res.splice(index, 1);
        } else if (res.length >= this.maxRecentResources) {
            res.pop();
        }
        res.unshift(newResource);

        return res;
    }

    updateUserChatGPTSetting(chatGPTSetting: any): Observable<UserSetting> {
        return this._diagnosticApiService.updateUserChatGPTSetting(chatGPTSetting, this._userId).pipe(map(userSetting => {
            this._userSetting = userSetting;
            return userSetting;
        }))
    }

    updateUserPanelSetting(panelSetting: UserPanelSetting): Observable<UserSetting> {
        return this._diagnosticApiService.updateUserPanelSetting(panelSetting, this._userId).pipe(map(userSetting => {
            this._userSetting = userSetting;
            return userSetting;
        }))
    }

    updateLandingInfo(resource: RecentResource): Observable<UserSetting> {
        const updatedResources = this.addRecentResource(resource, this._userSetting);
        const info: LandingInfo = {
            resources: updatedResources,
            defaultServiceType: this.defaultServiceType ? this.defaultServiceType : this._userSetting.defaultServiceType
        };
        return this._diagnosticApiService.updateUserLandingInfo(info, this._userId).pipe(map(userSetting => {
            this._userSetting = userSetting;
            return userSetting;
        }));
    }

    removeFavoriteDetector(detectorId: string): Observable<FavoriteDetectors> {
        return this._diagnosticApiService.removeFavoriteDetector(detectorId, this._userId).pipe(map(userSetting => {
            this._userSetting = userSetting;
            return userSetting.favoriteDetectors
        }));
    }

    addFavoriteDetector(detectorId: string, detectorProp: FavoriteDetectorProp): Observable<FavoriteDetectors> {
        return this._diagnosticApiService.addFavoriteDetector(detectorId, detectorProp, this._userId).pipe(map(userSetting => {
            this._userSetting = userSetting;
            return userSetting.favoriteDetectors
        }))
    }
}
