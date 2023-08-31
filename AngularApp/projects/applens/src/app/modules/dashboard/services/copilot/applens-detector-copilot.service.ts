import { Injectable } from '@angular/core';
import { ApplensCopilotContainerService, CopilotSupportedFeature } from './applens-copilot-container.service';
import { DetectorResponse, DetectorViewModeWithInsightInfo, DiagnosticData, TelemetryService } from 'diagnostic-data';
import { ResponseUtilities } from 'projects/diagnostic-data/src/lib/utilities/response-utilities';
import { ResourceService } from 'projects/applens/src/app/shared/services/resource.service';
import { DiagnosticApiService } from 'projects/applens/src/app/shared/services/diagnostic-api.service';
import { Observable } from 'rxjs';
import { PortalUtils } from 'projects/applens/src/app/shared/utilities/portal-util';

@Injectable()
export class ApplensDetectorCopilotService {

    private CHAT_CONTAINER_HEIGHT: string = '73vh';
    private CHAT_CONTAINER_HEIGHT_WITH_COMPONENT_SELECTED: string = '60vh';

    public detectorCopilotChatIdentifier = 'detectorcopilot';
    public detectorResponse: DetectorResponse;
    public wellFormattedDetectorOutput: any;
    public selectedComponent: any;
    public operationInProgress: boolean = false;
    public customPrompt: string = '';
    public chatContainerHeight: string = this.CHAT_CONTAINER_HEIGHT;
    public lastDetectorId = '';
    public copilotButtonActive = false;
    public chatConfigFile = '';

    constructor(private _copilotContainerService: ApplensCopilotContainerService, private _resourceService: ResourceService,
        private _diagnosticApi: DiagnosticApiService, private _telemetryService: TelemetryService) {
        this.reset();
    }

    isEnabled(): Observable<boolean> {
        return this._diagnosticApi.get<boolean>('api/openai/detectorcopilot/enabled?detectorMode=data');
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

        if (this.lastDetectorId && this.lastDetectorId == detectorData.metadata.id) {
            return;
        }

        this.detectorResponse = detectorData;
        this.wellFormattedDetectorOutput = ResponseUtilities.ConvertResponseTableToWellFormattedJson(detectorData);
        this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        this.copilotButtonActive = true;
    }

    // This method is called by Detector List component or Analysis component to process async loading of child detectors
    processAsyncDetectorViewModels(detectorViewModels: DetectorViewModeWithInsightInfo[]) {

        this.wellFormattedDetectorOutput = ResponseUtilities.UpdateDetectorResponseWithAsyncChildDetectorsOutput(this.wellFormattedDetectorOutput, detectorViewModels);

        if (this.selectedComponent.heading == undefined) {
            this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        }
    }

    processAsyncFormsResponse(formId: any, formsResponse: DetectorResponse) {

        this.wellFormattedDetectorOutput = ResponseUtilities.UpdateDetectorResponseWithFormsResponse(this.wellFormattedDetectorOutput, formId, formsResponse);

        if (this.selectedComponent.heading == undefined) {
            this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        }
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
        this.setSelectedComponentAndOpenCopilot(wellFormattedSelectedData);

        PortalUtils.logEvent('detectorcopilot-open', `{componentHeading : ${this.selectedComponent.heading}}, componentSubHeading : ${this.selectedComponent.subheading}`, this._telemetryService);
    }

    selectChildDetectorAndOpenCopilot(detectorViewModel: DetectorViewModeWithInsightInfo) {

        let formattedDetectorResponse = {
            metadata: this.wellFormattedDetectorOutput.metadata,
            output: []
        };

        formattedDetectorResponse = ResponseUtilities.UpdateDetectorResponseWithAsyncChildDetectorsOutput(formattedDetectorResponse, [detectorViewModel]);
        this.customPrompt = this.prepareCustomPrompt(formattedDetectorResponse);
        this.setSelectedComponentAndOpenCopilot(formattedDetectorResponse);

        PortalUtils.logEvent('detectorcopilot-open', `{componentHeading : ${this.selectedComponent.heading}}, componentSubHeading : ${this.selectedComponent.subheading}`, this._telemetryService);
    }

    clearComponentSelection() {
        this.chatContainerHeight = this.CHAT_CONTAINER_HEIGHT
        this.customPrompt = this.prepareCustomPrompt(this.wellFormattedDetectorOutput);
        this.selectedComponent = {};
        this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/detectorcopilot.json';
    }

    reset() {

        this.lastDetectorId = this.detectorResponse == null ? '' : this.detectorResponse.metadata.id;
        this.selectedComponent = {};
        this.detectorResponse = null;
        this.wellFormattedDetectorOutput = null;
        this.customPrompt = '';
        this.operationInProgress = false;
        this.chatContainerHeight = this.CHAT_CONTAINER_HEIGHT;
        this.copilotButtonActive = false;
        this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/detectorcopilot.json';
    }

    private prepareCustomPrompt(wellFormattedDetectorOutput: any): string {
        if (wellFormattedDetectorOutput == undefined) {
            return '';
        }

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

    private setSelectedComponentAndOpenCopilot(componentDetectorData: any) {

        // TODO Shekhar - Make it more robouust.. null checks
        let truncatedSubHeading = (componentDetectorData.output[0].title && componentDetectorData.output[0].title.length > 70) ?
            componentDetectorData.output[0].title.substring(0, 70) + '...' : componentDetectorData.output[0].title;

        this.selectedComponent['heading'] = `"${componentDetectorData.output[0].type.charAt(0).toUpperCase() + componentDetectorData.output[0].type.slice(1)}" selected`;
        this.selectedComponent['iconSrc'] = this.getIconByType(componentDetectorData.output[0]);
        this.selectedComponent['subheading'] = ResponseUtilities.MarkdownToText(truncatedSubHeading);
        this.chatContainerHeight = this.CHAT_CONTAINER_HEIGHT_WITH_COMPONENT_SELECTED;

        switch (componentDetectorData.output[0].type.toLowerCase()) {
            case 'insight':
                this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/insight.json';
                break;
            case 'table':
                this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/table.json';
                break;
            case 'additional information':
                this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/markdown.json';
                break;
            case 'data summary':
                this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/datasummary.json';
                break;
            default:
                this.chatConfigFile = 'assets/chatConfigs/detectorcopilot/detectorcopilot.json';
        }

        this._copilotContainerService.showCopilotPanel();
    }

    private getIconByType(componentOutput: any) {
        if (componentOutput == undefined || componentOutput.type == undefined)
            return '/assets/img/copilot-components/default.svg';

        switch (componentOutput.type.toLowerCase()) {
            case "insight":
                if (componentOutput.status === 'Critical')
                    return '/assets/img/copilot-components/insight-critical.svg';
                else if (componentOutput.status === 'Warning')
                    return '/assets/img/copilot-components/insight-warning.svg';
                else if (componentOutput.status === 'Success')
                    return '/assets/img/copilot-components/insight-success.svg';
                else
                    return '/assets/img/copilot-components/insight-info.svg'
            case "graph":
                return '/assets/img/copilot-components/metrics.svg';
            case "additional information":
                return '/assets/img/copilot-components/markdown.svg';
            case "table":
                return '/assets/img/copilot-components/table.svg';
            default:
                return '/assets/img/copilot-components/default.svg';
        }
    }
}