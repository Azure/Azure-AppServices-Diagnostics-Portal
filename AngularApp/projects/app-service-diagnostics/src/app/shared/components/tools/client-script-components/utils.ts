import { Injector } from "@angular/core";
import { TelemetryService } from "diagnostic-data";
import { Globals } from "projects/app-service-diagnostics/src/app/globals";
import { PortalService } from "projects/app-service-diagnostics/src/app/startup/services/portal.service";
import { ArmService } from "../../../services/arm.service";
import { SiteService } from "../../../services/site.service";
import { DiagProvider } from "../network-checks/diag-provider";

export class Utils{
    public static getAppServiceSiteObjectsAndServices(injector: Injector){
        var siteService = injector.get(SiteService);
        var armService = injector.get(ArmService);
        var portalService = injector.get(PortalService);
        var globals = injector.get(Globals);
        var telemetryService = injector.get(TelemetryService);

        var siteMetaData = siteService.currentSiteMetaData.value
        var fullSiteName = siteMetaData.siteName + (siteMetaData.slot == "" ? "" : "-" + siteMetaData.slot);
        var siteInfo =  { ...siteService.currentSiteMetaData.value, ...siteService.currentSite.value, fullSiteName };
        var diagProvider = new DiagProvider(siteInfo, armService, siteService, portalService.shellSrc, globals, telemetryService);

        return {siteInfo, diagProvider, telemetryService};
    }
}