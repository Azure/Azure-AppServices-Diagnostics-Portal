import { SiteDaasInfo } from '../../../models/solution-metadata';
import { OperatingSystem, SiteInfoMetaData } from '../../../models/site';
import { SiteService } from '../../../services/site.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

export abstract class DaasBaseComponent {

    diagnoserName: string;
    siteToBeDiagnosed: SiteDaasInfo;
    scmPath: string;
    refreshSessions: boolean = false;
    isWindowsApp: boolean = true;

    constructor(private _siteService: SiteService,
        private _webSiteService: WebSitesService) {
        this.isWindowsApp = this._webSiteService.platform === OperatingSystem.windows;
        this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
            this.siteToBeDiagnosed = site;
        });
    }

    updateSessions(event) {
        this.refreshSessions = event;
    }
}
