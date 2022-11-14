import { StepFlowManager } from "diagnostic-data";
import { DiagProvider } from "projects/app-service-diagnostics/src/app/shared/components/tools/network-checks/diag-provider";
import { Site, SiteInfoMetaData } from "../../../models/site";

export interface NetworkCheckFlow {
    id: string;
    title: string;
    description?: string;
    func(resourceInfo: any, diagProvider: DiagProvider, flowMgr: StepFlowManager): Promise<null | void>;
}