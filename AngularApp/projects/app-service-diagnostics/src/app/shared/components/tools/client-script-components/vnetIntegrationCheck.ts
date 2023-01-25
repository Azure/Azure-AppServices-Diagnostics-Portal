import { Injector, Type } from "@angular/core";
import { TelemetryService } from "../../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service";
import { DynamicInsight, Insight } from "../../../../../../../diagnostic-data/src/lib/models/insight";
import { DiagProvider } from "../network-checks/diag-provider";
import { DataRenderBaseComponent } from "../../../../../../../diagnostic-data/src/lib/components/data-render-base/data-render-base.component";
import { ClientScriptComponent } from "./component-manager";
import { InsightsV4Component } from "../../../../../../../diagnostic-data/src/lib/components/insights-v4/insights-v4.component";
import { DynamicInsightV4Component } from "../../../../../../../diagnostic-data/src/lib/components/dynamic-insight-v4/dynamic-insight-v4.component";
import { MarkdownService } from "ngx-markdown";
import { Utils } from "./utils";
import { VnetIntegrationConfigChecker } from '../network-checks/network-check-flows/vnetIntegrationConfigChecker.js';
import { Router } from "@angular/router";

export class VnetIntegrationCheck implements ClientScriptComponent {
    uiComponent = DynamicInsightV4Component;
    async func(injector: Injector): Promise<DataRenderBaseComponent> {
        var { siteInfo, diagProvider, telemetryService } = Utils.getAppServiceSiteObjectsAndServices(injector);
        var markdownService = injector.get(MarkdownService);
        var router = injector.get(Router);

        var vnetChecker = new VnetIntegrationConfigChecker(siteInfo, diagProvider);
        var vnetIntegrationType: string = await vnetChecker.getVnetIntegrationTypeAsync();

        var insightComponent = new DynamicInsightV4Component(markdownService, telemetryService, router);
        var title = "VNet Integration";

        var networkTroubleshooterUri = `resource${siteInfo.resourceUri}/categories/DiagnosticTools/tools/networkchecks`;

        if (vnetIntegrationType == "swift") {
            var instanceData = await diagProvider.getArmResourceAsync(vnetChecker.siteArmId + "/instances", vnetChecker.apiVersion);
            if (instanceData.status == 200) {
                var swiftIntegrationOk: boolean = await vnetChecker.checkWorkerPingMeshAsync(instanceData);
                if (swiftIntegrationOk != null) {
                    var insight:DynamicInsight = null;
                    if (swiftIntegrationOk) {
                        insight = new DynamicInsight("Success", title, false);
                        insight.description = "Regional VNet integration is configured and healthy";
                    } else {
                        insight = new DynamicInsight("Critical", title, false);
                        insight.description = "Regional VNet integration is configured but it's unhealthy";
                    }
                    insight.hyperlinkText = "View details in Network Troubleshooter";
                    insight.hyperlink = networkTroubleshooterUri;
                    insightComponent.insight = insight;
                } else {
                    throw new Error("null WorkerPingMeshResult");
                }
            } else {
                throw new Error(`Unexpected instanceData status: ${instanceData.status}`);
            }
        } else if (vnetIntegrationType == "gateway") {
            insightComponent.insight = new DynamicInsight("Info", title, false);
            insightComponent.insight.description = "Gateway-required VNet integration is configured"
        } else {
            insightComponent.insight = new DynamicInsight("Info", title, false);
            insightComponent.insight.description = "VNet integration is not configured"
        }

        return insightComponent;
    }

}