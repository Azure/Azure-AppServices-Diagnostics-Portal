import { Injectable } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { BehaviorSubject } from 'rxjs';

export enum CopilotSupportedFeature {
    DetectorDevelopmentTab,
    GistDevelopmentTab,
    DetectorDataTab,
    AnalysisDataTab,
    Other // No copilot will show for this option
}

@Injectable()
export class ApplensCopilotContainerService {

    public feature: CopilotSupportedFeature = CopilotSupportedFeature.Other;
    public openPanel: boolean;
    public panelType: PanelType = PanelType.custom;
    public panelWidth: string = "720px";
    public onCloseCopilotPanelEvent: BehaviorSubject<{ showConfirmation: boolean, resetCopilot: boolean }>;
    public copilotHeaderTitle: string;

    constructor() {
        this.onCloseCopilotPanelEvent = new BehaviorSubject<{ showConfirmation: boolean, resetCopilot: boolean }>(null);
    }

    hideCopilotPanel() {
        this.openPanel = false;
    }

    showCopilotPanel() {
        this.openPanel = true;
    }
}