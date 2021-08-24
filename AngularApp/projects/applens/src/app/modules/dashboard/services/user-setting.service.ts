import { Injectable } from "@angular/core";
import { AdalService } from "adal-angular4";
import { map, flatMap, catchError, tap } from "rxjs/operators";
import { of } from "rxjs";
import { RecentResource, UserSetting,  } from "../../../shared/models/user-setting";
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";

const maxRecentResourceLength = 5;
@Injectable()
export class UserSettingService {
    userSetting: UserSetting;
    userId: string = "";
    constructor(private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService) {
        const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
        this.userId = alias.replace('@microsoft.com', '');
        this._diagnosticApiService.getUserSetting(this.userId).subscribe(userInfo => {
            this.userSetting = userInfo;
        });
    }

    getRecentResources() {
        if (this.userSetting) {
            return of(this.userSetting);
        }
        return this._diagnosticApiService.getUserSetting(this.userId).pipe(catchError(err => {
            if (err.status === 404) {
                const userSetting = new UserSetting(this.userId);
                return of(userSetting);
            }
        }), map(userInfo => {
            this.userSetting = userInfo;
            return userInfo;
        }));
    }

    updateRecentResource(recentResource: RecentResource) {
        if (this.userSetting) {
            const resources = this.addRecentResource(recentResource, this.userSetting.resources);
            this.userSetting.resources = resources;
            return this._diagnosticApiService.updateUserSetting(this.userSetting).pipe(map(setting => {
                this.userSetting = setting;
                return setting;
            }));
        } else {
            this.getRecentResources().pipe(flatMap(userInfo => {
                this.userSetting.resources = this.addRecentResource(recentResource, this.userSetting.resources);
                return this._diagnosticApiService.updateUserSetting(this.userSetting).pipe(map(setting => {
                    this.userSetting = setting;
                    return setting;
                }));
            }));
        }
    }

    private addRecentResource(newResource: RecentResource, recentResources: RecentResource[]) {
        const res = [...recentResources];
        const index = recentResources.findIndex(resource => resource.resourceUri.toLowerCase() === newResource.resourceUri.toLowerCase());
        if (index >= 0) {
            res.splice(index, 1);
        } else if (res.length >= maxRecentResourceLength) {
            res.pop();
        }
        res.unshift(newResource);
        return res;
    }
}