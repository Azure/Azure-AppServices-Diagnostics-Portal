import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DemoSubscriptions } from '../betaSubscriptions';
import { AuthService } from '../startup/services/auth.service';
import { ResourceType, AppType } from '../shared/models/portal';
import { SiteService } from '../shared/services/site.service';
import { BehaviorSubject } from 'rxjs';
import { Site } from '../shared/models/site';
import { ResourceDescriptor } from 'diagnostic-data';

export const allowV3PResourceTypeList: { type: string, allowSwitchBack: boolean }[] = [
    { type: "microsoft.apimanagement/service", allowSwitchBack: false },
    { type: "microsoft.signalrservice/signalr", allowSwitchBack: false },
    { type: "microsoft.logic/workflows", allowSwitchBack: false},
    { type: "microsoft.logic/integrationserviceenvironments", allowSwitchBack: false},
    { type: "microsoft.web/hostingenvironments", allowSwitchBack: false }
];


@Injectable({
    providedIn: 'root'
})
export class VersionTestService {
    public isLegacySub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    public isVnextSub: boolean = false;
    public isVnextOnlyResource: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    public initializedPortalVersion: BehaviorSubject<string> = new BehaviorSubject<string>("v2");

    // If overrideUseLegacy is not set, we still use the logic to return true for windows web app, return false for other resource types
    // If overrideUseLegacy is set, this will take precedence of our existing logic:
    // overrideUseLegacy = 1, we switch to the old experience.
    // overrideUseLegacy = 2, we switch to the new experience.
    public overrideUseLegacy: BehaviorSubject<number> = new BehaviorSubject(0);
    constructor(private _authService: AuthService, private _siteService: SiteService) {
        this._authService.getStartupInfo().subscribe(startupInfo => {
            const resourceType = this._authService.resourceType;
            const resourceId = startupInfo.resourceId;
            const subId = resourceId.split('/')[2];
            // Change the percentageToRelease accordingly for more customers, for now it's around 10%
            this.isVnextSub = true;
            this._siteService.currentSite.subscribe(site => {
                this.overrideUseLegacy.subscribe(overrideValue => {
                    if (resourceType === ResourceType.Site) {
                        const isVnextOnlyResourceType = this.isVnextOnlyResourceType(site, resourceType);
                        const isVnextResourceType = this.isVnextResourceType(site, resourceType);
                        // Initialize with the new version if the subscription falls in vnext sub groups and the resource is web app
                        this.initializedPortalVersion.next(this.isVnextSub && isVnextResourceType ? "v3" : "v2");
                        // The current expericence can still be override if customer click on the link to switch to a different version
                        const shouldUseLegacy = overrideValue !== 0 ? overrideValue === 1 : (!this.isVnextSub || !isVnextResourceType);

                        this.isLegacySub.next(shouldUseLegacy);
                        this.isVnextOnlyResource.next(isVnextOnlyResourceType);
                    } else {
                        const resourceDescriptor = ResourceDescriptor.parseResourceUri(resourceId);
                        const type = `${resourceDescriptor.provider}/${resourceDescriptor.type}`;
                        //For other resources, check if it's in allowV3ProviderSet
                        const isAllowUseNewUI = allowV3PResourceTypeList.findIndex(item => type.toLowerCase() === item.type.toLowerCase()) > -1;
                        const shouldUseLegacy = overrideValue !== 0 ? overrideValue === 1 : !isAllowUseNewUI;
                        this.initializedPortalVersion.next(isAllowUseNewUI ? "v3" : "v2");
                        this.isLegacySub.next(shouldUseLegacy);
                    }
                });
            });
        });
    }

    // If overrideUseLegacy is set, this will take precedence of our existing logic to determine if we will use new experience.
    public setLegacyFlag(useLegacy) {
        this.overrideUseLegacy.next(useLegacy);
    }

    // This is the resource type that we completely migrate to new diagnose and solve experience
    // Resource types that are currently using new D&S only: windows web app, function app
    private isVnextOnlyResourceType(site: Site, resourceType: ResourceType): boolean {
        let isLinuxPlatform = site && site.kind && site.kind.toLowerCase().indexOf('linux') >= 0;
        return resourceType === ResourceType.Site && site && (site.appType === AppType.WebApp || site.appType === AppType.FunctionApp) && !isLinuxPlatform;
    }

    // This is the resource type that we migrate to new diagnose and solve experience but still offer the option to switch back to the old experience
    // Resource types that are currently using new D&S: windows web app, function app
    private isVnextResourceType(site: Site, resourceType: ResourceType): boolean {
        let isLinuxPlatform = site && site.kind && site.kind.toLowerCase().indexOf('linux') >= 0;
        return resourceType === ResourceType.Site && site && (site.appType === AppType.WebApp || site.appType == AppType.FunctionApp) && !isLinuxPlatform;
    }

    private isVnextSubscription(subscriptionId: string, percentageToRelease: number = 0.1): boolean {
        percentageToRelease = percentageToRelease < 0 || percentageToRelease > 1 ? 0.1 : percentageToRelease;
        let isBetaSubscription = DemoSubscriptions.betaSubscriptions.findIndex(item => subscriptionId.toLowerCase() === item.toLowerCase()) > -1;
        if (isBetaSubscription) {
            return true;
        }

        // roughly split of percentageToRelease of subscriptions to use new feature.
        let firstDigit = "0x" + subscriptionId.substr(0, 1);
        return (16 - parseInt(firstDigit, 16)) / 16 <= percentageToRelease;
    }
}
