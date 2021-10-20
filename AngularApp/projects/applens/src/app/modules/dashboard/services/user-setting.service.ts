import { Injectable } from "@angular/core";
import { AdalService } from "adal-angular4";
import { map, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { RecentResource, UserSetting, } from "../../../shared/models/user-setting";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

const maxRecentResourceLength = 5;
@Injectable()
export class UserSettingService {
    userSetting: UserSetting;
    userId: string = "";
    constructor(private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService) {
        const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
        this.userId = alias.replace('@microsoft.com', '');
    }

    getRecentResources() {
        if (this.userSetting) {
            return of(this.userSetting);
        }

        return this._diagnosticApiService.getUserSetting(this.userId).pipe(
            map(userSetting => {
                this.userSetting = userSetting;
                return userSetting;
            })
        );
    }

    updateRecentResource(recentResource: RecentResource) {
        this.updateUserSetting(recentResource, this.addRecentResource);
    }

    private updateUserSetting(item: any, fn: UpdateUserSettingCallBack) {
        this.getRecentResources().pipe(catchError(error => {
            if (error.status === 404) {
                const userSetting = new UserSetting(this.userId);
                return of(userSetting);
            }
            throw error;
        })).subscribe(userSetting => {
            const newUserSetting = fn(item, userSetting);
            this._diagnosticApiService.updateUserSetting(newUserSetting).subscribe(setting => {
                this.userSetting = setting;
            })
        });
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