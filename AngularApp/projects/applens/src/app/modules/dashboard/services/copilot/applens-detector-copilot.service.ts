import { Injectable } from '@angular/core';
import { ApplensCopilotContainerService, CopilotSupportedFeature } from './applens-copilot-container.service';
import { ChatUIContextService, DetectorResponse, DiagnosticData, RenderingType } from 'diagnostic-data';
import { ResponseUtilities } from 'projects/diagnostic-data/src/lib/utilities/response-utilities';
import { ResourceService } from 'projects/applens/src/app/shared/services/resource.service';

export enum DetectorCopilotSupportedRenderings {
    Table = 1,
    TimeSeries = 2,
    DataSummary = 5,
    Insights = 7,
    DynamicInsight = 8,
    Markdown = 9,
    DetectorList = 10,
    DropDown = 11,
    Form = 15,
    SummaryCard = 22
}

@Injectable()
export class ApplensDetectorCopilotService {

    public detectorCopilotChatIdentifier = 'detectorcopilot';
    public detectorResponse: DetectorResponse;
    public wellFormattedDetectorOutput: any;
    public selectedComponent: any;
    public operationInProgress: boolean = false;
    public customPrompt: string = '';

    constructor(private _copilotContainerService: ApplensCopilotContainerService, private _resourceService: ResourceService,
        private _chatContextService: ChatUIContextService) {
        this.reset();
    }

    initializeMembers(isAnalysisMode: boolean) {

        if (isAnalysisMode) {
            this._copilotContainerService.feature = CopilotSupportedFeature.AnalysisDataTab;
        }
        else {
            this._copilotContainerService.feature = CopilotSupportedFeature.DetectorDataTab;
        }
    }

    processDetectorData(detectorData: DetectorResponse) {
        this.detectorResponse = detectorData;
        this.wellFormattedDetectorOutput = ResponseUtilities.ConvertResponseTableToWellFormattedJson(detectorData);
        this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        console.log(this.customPrompt);
    }

    selectComponentAndOpenCopilot(componentData: DiagnosticData) {

        let customDetectorResponse: DetectorResponse = {
            dataset: [componentData],
            metadata: this.detectorResponse.metadata,
            status: undefined,
            dataProvidersMetadata: [],
            suggestedUtterances: undefined
        }

        let wellFormattedSelectedData = ResponseUtilities.ConvertResponseTableToWellFormattedJson(customDetectorResponse);
        this.customPrompt = this.prepareCustomPrompt(wellFormattedSelectedData);
        console.log(customDetectorResponse);

        // TODO Shekhar - Make it more robouust.. null checks
        this.selectedComponent['heading'] = `"${wellFormattedSelectedData.output[0].type.charAt(0).toUpperCase() + wellFormattedSelectedData.output[0].type.slice(1)}" selected`;
        this.selectedComponent['iconSrc'] = this.getIconByType(wellFormattedSelectedData.output[0]);
        this.selectedComponent['subheading'] = wellFormattedSelectedData.output[0].title;

        console.log(this.selectedComponent);
        this._copilotContainerService.showCopilotPanel();
    }

    clearComponentSelection() {
        this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        this.selectedComponent = {};
    }

    reset() {

        //Shekhar - TODO - Need to think about this : this._chatContextService.clearChat(this.chatComponentIdentifier);
        this.selectedComponent = {};

        this.detectorResponse = null;
        this.wellFormattedDetectorOutput = null;
        this.customPrompt = '';
        this.operationInProgress = false;
        this._copilotContainerService.feature = CopilotSupportedFeature.Other;
        this._chatContextService.clearChat(this.detectorCopilotChatIdentifier);
    }

    private prepareCustomPrompt(wellFormattedDetectorOutput: any): string {
        let messageJson = {};
        messageJson['azureServiceName'] = this._resourceService.displayName;
        messageJson['azureResourceName'] = this._resourceService.getResourceName();
        messageJson['detectorMetadata'] = this.sanitizeDetectorMetadata(wellFormattedDetectorOutput.metadata);
        messageJson['detectorOutput'] = wellFormattedDetectorOutput.output;

        return `\n Here is the detector output to consider:\n${JSON.stringify(messageJson)}`;
    }

    private sanitizeDetectorMetadata(metadata: any): any {
        if (metadata == undefined)
            return undefined;

        delete metadata.analysisType;
        delete metadata.analysisTypes
        delete metadata.analysisTypes
        delete metadata.score;
        delete metadata.type;
        delete metadata.typeId;

        return metadata;
    }

    private getIconByType(componentOutput: any) {
        if (componentOutput == undefined || componentOutput.type == undefined)
            return '/assets/img/copilot-components/default.svg';

        switch (componentOutput.type) {
            case "insight":
                if (componentOutput.status === 'Critical')
                    return '/assets/img/copilot-components/insight-critical.svg';
                else if (componentOutput.status === 'Warning')
                    return '/assets/img/copilot-components/insight-warning.svg';
                else
                    return '/assets/img/copilot-components/insight-success.svg';
            case "graph":
                return '/assets/img/copilot-components/metrics.svg';
            case "markdown":
                return '/assets/img/copilot-components/markdown.svg';
            default:
                return '/assets/img/copilot-components/default.svg';
        }
    }
}