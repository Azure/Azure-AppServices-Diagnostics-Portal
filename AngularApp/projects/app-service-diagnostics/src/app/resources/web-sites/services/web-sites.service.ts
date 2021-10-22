import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { OperatingSystem, Site, HostingEnvironmentKind } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { ArmService } from '../../../shared/services/arm.service';
import { ServerFarm, Sku } from '../../../shared/models/server-farm';
import { IDiagnosticProperties } from '../../../shared/models/diagnosticproperties';
import { flatMap } from 'rxjs/operators';
import { PortalReferrerMap } from '../../../shared/models/portal-referrer-map';
import { DetectorType } from 'diagnostic-data';
import { of, Observable, merge } from 'rxjs';
import { ArmResource } from '../../../shared-v2/models/arm';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Injectable({ providedIn: 'root' })
export class WebSitesService extends ResourceService {

    private _resourceGroup: string;
    private _siteName: string;
    private _slotName: string;

    public appStack: string = '';
    public platform: OperatingSystem = OperatingSystem.any;
    public appType: AppType = AppType.WebApp;
    public sku: Sku = Sku.All;
    public hostingEnvironmentKind: HostingEnvironmentKind = HostingEnvironmentKind.All;

    constructor(protected _armService: ArmService, private _appAnalysisService: AppAnalysisService) {
        super(_armService);
    }

    public getIbizaBladeToDetectorMapings(): Observable<PortalReferrerMap[]> {
        return this.warmUpCallFinished.pipe(flatMap(() => {
            let bladeToDetectorMap: PortalReferrerMap[];

            bladeToDetectorMap = [{
                ReferrerExtensionName: 'Websites',
                ReferrerBladeName: 'CertificatesBlade',
                ReferrerTabName: 'Bindings',
                DetectorType: DetectorType.Detector,
                DetectorId: 'configuringsslandcustomdomains'
            },
            {
                ReferrerExtensionName: 'Websites',
                ReferrerBladeName: 'CustomDomainsAndSSL',
                ReferrerTabName: '',
                DetectorType: DetectorType.Detector,
                DetectorId: 'configuringsslandcustomdomains'
            },
            {
                ReferrerExtensionName: 'Websites',
                ReferrerBladeName: 'VnetIntegrationV2DetailsBlade',
                ReferrerTabName: '',
                DetectorType: DetectorType.DiagnosticTool,
                DetectorId: 'networkchecks'
            }];


            if (this.appType == AppType.WebApp) {
                bladeToDetectorMap.push({
                    ReferrerExtensionName: 'Websites',
                    ReferrerBladeName: 'BackupSummaryBlade',
                    ReferrerTabName: '',
                    DetectorType: DetectorType.Detector,
                    DetectorId: 'backupFailures'
                });
            }
            return of(bladeToDetectorMap);
        }));
    }

    public getPesId(): Observable<string> {
        return this.warmUpCallFinished.pipe(flatMap(() => {
            if (this.appType == AppType.WebApp && this.platform == OperatingSystem.windows) {
                return of("14748");
            }
            else if (this.appType == AppType.WebApp && this.platform == OperatingSystem.linux) {
                return of("16170");
            }
            else if (this.appType == AppType.FunctionApp) {
                return of("16072");
            }
            else {
                return of(null);
            }
        }));
    }

    public getKeystoneDetectorId(): Observable<string>{
        return this.warmUpCallFinished.pipe(flatMap(() => {
            if (this.appType == AppType.WebApp && this.platform == OperatingSystem.windows) {
                return of("test_keystone_detector");
            }
            else if (this.appType == AppType.FunctionApp)
            {
                return of("function_keystone");
            }
            else if (this.appType == AppType.WorkflowApp)
            {
                return of("la_standard_keystone");
            }
            else {
                return of(null);
            }
        }));
    }
    public isGenieDisabled(): boolean{
        return false;
    }

    public get searchSuffix(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Azure Web App' : 'Azure Web App(Linux)' : 'Azure Function';
    }

    public get azureServiceName(): string {
        return this.appType === AppType.WebApp ? this.platform === OperatingSystem.windows ? 'Web App (Windows)' : 'Web App (Linux)' : 'Function App';
    }

    public get isArmApiResponseBase64Encoded():boolean {
        return false;
    }

    public get isApplicableForLiveChat(): boolean {
        return this.resource
            && (this.appType & (AppType.WebApp | AppType.FunctionApp)) > 0 //Enable chat for Function apps
            && (this.platform & (OperatingSystem.windows | OperatingSystem.linux)
            ) > 0;
    }

    public get liveChatEnabledSupportTopicIds(): string[] {
        if (this.isApplicableForLiveChat) {
            if (this.appType === AppType.FunctionApp) {
                return ['*']; //Enable all support topics for chat. CXP system, performs a check and they can independently enable/disable chats for specific ST's
            }
            else if (this.appType === AppType.WebApp) {
                if (this.platform === OperatingSystem.windows) {
                    return ['*']; //Enable all support topics for chat. CXP system, performs a check and they can independently enable/disable chats for specific ST's
                }
                else if (this.platform === OperatingSystem.linux) {
                    return ['*']; //Enable all support topics for chat. CXP system, performs a check and they can independently enable/disable chats for specific ST's
                }
                else {
                    return [];
                }
            }
        }
        else {
            return [];
        }
    }

    public getSitePremierAddOns(resourceUri: string): Observable<any> {
        return this._armService.getArmResource(`${resourceUri}/premieraddons`, '2018-02-01');
    }

    protected makeWarmUpCalls() {
        super.makeWarmUpCalls();
        this._populateSiteInfo();
        this.warmUpCallFinished.next(true);
    }

    private _populateSiteInfo(): void {
        const pieces = this.resource.id.toLowerCase().split('/');
        this._subscription = pieces[pieces.indexOf('subscriptions') + 1];
        this._resourceGroup = pieces[pieces.indexOf('resourcegroups') + 1];
        this._siteName = pieces[pieces.indexOf('sites') + 1];
        this._slotName = pieces.indexOf('slots') >= 0 ? pieces[pieces.indexOf('slots') + 1] : '';

        const site: Site = <Site>this.resource.properties;

        this._appAnalysisService.getDiagnosticProperties(this._subscription, this._resourceGroup, this._siteName, this._slotName).subscribe((data: IDiagnosticProperties) => {
            this.appStack = data && data.appStack && data.appStack != '' ? data.appStack : '';
        });

        this.appType = site.kind.toLowerCase().indexOf('workflowapp') >= 0 ? AppType.WorkflowApp : site.kind.toLowerCase().indexOf('functionapp') >= 0 ? AppType.FunctionApp : AppType.WebApp;
        this.platform = site.isXenon ? OperatingSystem.HyperV : site.kind.toLowerCase().indexOf('linux') >= 0 ? OperatingSystem.linux : OperatingSystem.windows;
        this.sku = Sku[site.sku] ? Sku[site.sku] : this.sku;
        this.hostingEnvironmentKind = this.getHostingEnvirontmentKind(site);
    }

    private getHostingEnvirontmentKind(site: Site) {
        let scmHostName = site.enabledHostNames.find(h => h.indexOf('.scm.') > 0);
        return site.hostingEnvironmentId == null ? HostingEnvironmentKind.None : (scmHostName.toLowerCase().endsWith(".azurewebsites.net") ? HostingEnvironmentKind.Public : HostingEnvironmentKind.ILB);
    }
}
