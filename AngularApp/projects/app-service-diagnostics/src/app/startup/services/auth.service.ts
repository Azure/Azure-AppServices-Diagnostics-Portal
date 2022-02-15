import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable ,  of } from 'rxjs';
import { StartupInfo, ResourceType } from '../../shared/models/portal';
import { PortalService } from './portal.service';
import { map } from 'rxjs/operators';
import { environment } from 'projects/app-service-diagnostics/src/environments/environment';

@Injectable()
export class AuthService {
    public inIFrame: boolean;
    private currentToken: string = null;

    public resourceType: ResourceType;

    private localStartUpInfo: StartupInfo = <StartupInfo>{
        sessionId: '',
        token: environment.authServiceToken,
        subscriptions: null,
        resourceId: environment.authServiceResourceId,
        workflowId: '',
        supportTopicId: '',
        sapSupportTopicId: ''
    };

    public get hasLocalStartupInfo() {
        return this.localStartUpInfo && this.localStartUpInfo.token && this.localStartUpInfo.resourceId;
    }

    constructor(private _http: HttpClient, private _portalService: PortalService) {
        this.inIFrame = window.parent !== window;
        this._portalService.getToken().subscribe(token => {
            this.setAuthToken(token);
        });
    }

    getAuthToken(): string {
        return this.currentToken;
    }

    setAuthToken(value: string): void {
        this.currentToken = value;
    }

    setStartupInfo(token: string, resourceId: string) {
        this.localStartUpInfo.token = token;
        this.localStartUpInfo.resourceId = resourceId;
        this.currentToken = token;
    }

    getStartupInfo(): Observable<StartupInfo> {
        let startupInfo: Observable<StartupInfo>;
        if (this.inIFrame) {
            startupInfo = this._portalService.getStartupInfo();
        } else {
            if (this.localStartUpInfo.token.startsWith('Bearer ')) {
                this.localStartUpInfo.token = this.localStartUpInfo.token.replace('Bearer ', '');
            }
            startupInfo = of<StartupInfo>(this.localStartUpInfo);
        }

        return startupInfo.pipe(
            map((info: StartupInfo) => {
                if (info && info.resourceId) {
                    info.resourceId = info.resourceId.toLowerCase();

                    if (!this.currentToken){
                        this.currentToken = info.token;
                    }

                    if (!this.resourceType) {
                        this.resourceType = info.resourceId.toLowerCase().indexOf('/providers/microsoft.web/hostingenvironments/')> 0 ? ResourceType.HostingEnvironment : info.resourceId.toLowerCase().includes("/providers/microsoft.web/sites/") ? ResourceType.Site : ResourceType.Other;
                    }

                    info.resourceType = this.resourceType;
                    return info;
                }
            }));
    }
}
