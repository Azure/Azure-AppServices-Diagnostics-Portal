import { DetectorControlService } from './services/detector-control.service';
import { DiagnosticService } from './services/diagnostic.service';
import { GenericSupportTopicService } from './services/generic-support-topic.service';
import { GenericThemeService } from './services/generic-theme.service';
import { GenericContentService } from './services/generic-content.service';
import { GenericDocumentsSearchService } from './services/generic-documents-search.service';
import { TelemetryService } from './services/telemetry/telemetry.service';
import { GenieGlobals } from './services/genie.service';
import { MarkdownModule } from 'ngx-markdown';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, SecurityContext } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommAlertComponent } from './components/comm-alert/comm-alert.component';
import {
    CopyInsightDetailsComponent
} from './components/copy-insight-details/copy-insight-details.component';
import { DataContainerComponent } from './components/data-container/data-container.component';
import { DataRenderBaseComponent } from './components/data-render-base/data-render-base.component';
import { DataSummaryComponent } from './components/data-summary/data-summary.component';
import {
    DetectorContainerComponent
} from './components/detector-container/detector-container.component';
import {
    DetectorControlComponent, InternalPipe
} from './components/detector-control/detector-control.component';
import {
    DetectorListComponent, DetectorOrderPipe
} from './components/detector-list/detector-list.component';
import { DetectorViewComponent } from './components/detector-view/detector-view.component';
import { DynamicDataComponent } from './components/dynamic-data/dynamic-data.component';
import { EmailComponent } from './components/email/email.component';
import { FeedbackComponent } from './components/feedback/feedback.component';
import { LoaderViewComponent } from './components/loader-view/loader-view.component';
import { MarkdownEditorComponent } from './components/markdown-editor/markdown-editor.component';
import { MarkdownViewComponent } from './components/markdown-view/markdown-view.component';
import {
    StarRatingFeedbackComponent
} from './components/star-rating-feedback/star-rating-feedback.component';
import { StarRatingComponent } from './components/star-rating/star-rating.component';
import { StatusIconComponent } from './components/status-icon/status-icon.component';
import {
    TimeSeriesGraphComponent
} from './components/time-series-graph/time-series-graph.component';
import {
    TimeSeriesInstanceGraphComponent
} from './components/time-series-instance-graph/time-series-instance-graph.component';
import {
    DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig, INTERNAL_PROD_CONFIGURATION
} from './config/diagnostic-data-config';
import { ClipboardService } from './services/clipboard.service';
import { CommsService } from './services/comms.service';
import { GuageGraphicComponent } from './components/guage-graphic/guage-graphic.component';
import { GuageControlComponent } from './components/guage-control/guage-control.component';
import { FeatureNavigationService } from './services/feature-navigation.service';
import { AppInsightsTelemetryService } from './services/telemetry/appinsights-telemetry.service';
import { KustoTelemetryService } from './services/telemetry/kusto-telemetry.service';
import { FormComponent } from './components/form/form.component';
import { SolutionComponent } from './components/solution/solution.component';
import { SolutionsComponent } from './components/solutions/solutions.component';
import { VerticalDisplayListComponent } from './components/vertical-display-list/vertical-display-list.component';
import { VerticalDisplayListItemComponent } from './components/vertical-display-list/vertical-display-list-item/vertical-display-list-item.component';
import { SolutionTypeTagComponent } from './components/solution-type-tag/solution-type-tag.component';
import { SolutionDisplayComponent } from './components/solution-display/solution-display.component';
import { SolutionDisplayItemComponent } from './components/solution-display/solution-display-item/solution-display-item.component';
import { AppInsightsQueryService } from './services/appinsights.service';
import { AppInsightsMarkdownComponent } from './components/app-insights-markdown/app-insights-markdown.component';
import { ChangeAnalysisOnboardingComponent } from './components/changeanalysis-onboarding/changeanalysis-onboarding.component';
import { ChangesetsViewComponent } from './components/changesets-view/changesets-view.component';
import { ChangesViewComponent } from './components/changes-view/changes-view.component';
import { CustomMaterialModule } from './material-module';
import { DetectorListAnalysisComponent } from './components/detector-list-analysis/detector-list-analysis.component';
import { AppDependenciesComponent } from './components/app-dependencies/app-dependencies.component';
import { HighchartsChartModule } from 'highcharts-angular';
import { HighchartsGraphComponent } from './components/highcharts-graph/highcharts-graph.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { InsightsV4Component } from './components/insights-v4/insights-v4.component';
import { CardSelectionV4Component } from './components/card-selection-v4/card-selection-v4.component';
import { DropdownV4Component } from './components/dropdown-v4/dropdown-v4.component';
import { CXPChatService } from './services/cxp-chat.service';
import { CxpChatLauncherComponent } from './components/cxp-chat-launcher/cxp-chat-launcher.component';
import { AppInsightsEnablementComponent } from './components/app-insights-enablement/app-insights-enablement.component';
import { ConnectAppInsightsComponent } from './components/connect-app-insights/connect-app-insights.component';
import { DetectorSearchComponent } from './components/detector-search/detector-search.component';
import { WebSearchComponent } from './components/web-search/web-search.component';
import { RenderFilterPipe } from './components/detector-view/detector-view.component';
import { DynamicInsightV4Component } from './components/dynamic-insight-v4/dynamic-insight-v4.component';
import { InViewportModule } from "ng-in-viewport";
import { ParseResourceService } from './services/parse-resource.service';
import { MarkdownTextComponent } from './components/markdown-text/markdown-text.component';
import { DataTableV4Component } from './components/data-table-v4/data-table-v4.component';
import { DocumentsSearchComponent } from './components/documents-search/documents-search.component';
import { LoaderDetectorViewComponent } from './components/loader-detector-view/loader-detector-view.component';
import { KeystoneInsightComponent } from './components/keystone-insight/keystone-insight.component';
import { SolutionViewContainerComponent } from './components/solution-view-container/solution-view-container.component';
import { FabDataTableFilterComponent } from './components/fab-data-table-filter/fab-data-table-filter.component';
import { NotificationRenderingComponent } from './components/notification-rendering/notification-rendering.component';
import { FabTabComponent } from './components/fab-tab/fab-tab.component';
import { SectionsComponent } from './components/sections/sections.component';
import { CollapsibleListComponent } from './components/collapsible-list/collapsible-list.component';
import { CollapsibleListFabricComponent } from './components/collapsible-list/collapsible-list-fabric/collapsible-list-fabric.component';
import { CollapsibleListItemComponent } from './components/collapsible-list/collapsible-list-item.component';
import { StepViewsRendererComponent } from './components/step-views/step-view-renderer/step-views-renderer.component';
import { InputStepComponent } from './components/step-views/input-step-view/input-step.component';
import { InfoStepComponent } from './components/step-views/info-step-view/info-step.component';
import { DropDownStepComponent, GetDropdownOptionsPipe } from './components/step-views/dropdown-step-view/dropdown-step.component';
import { CheckStepComponent } from './components/step-views/check-step-view/check-step.component';
import { CheckComponent, ConvertLevelToHealthStatusPipe } from './components/step-views/check-step-view/check.component';
import { SolutionOrchestratorComponent } from "./components/solution-orchestrator/solution-orchestrator.component";
import { ButtonStepComponent } from './components/step-views/button-step-view/button-step.component';
import { FabCoachmarkModule } from './modules/fab-coachmark/coachmark.module';
import { FabTeachingBubbleModule } from './modules/fab-teachingbubble/teachingbubble.module';
import { HighChartsHoverService } from './services/highcharts-hover.service';
import { RouterModule } from '@angular/router';
import { FabDataTableComponent } from './components/fab-data-table/fab-data-table.component';
import { FabCardComponent } from './components/fab-card/fab-card.component';
import { SolutionsPanelComponent } from './components/solutions-panel/solutions-panel.component';
import { DetectorTimePickerComponent } from './components/detector-time-picker/detector-time-picker.component';
import { FabricFeedbackComponent } from './components/fabric-feedback/fabric-feedback.component';
import { GenericBreadcrumbService } from './services/generic-breadcrumb.service';
import { GenericUserSettingService } from './services/generic-user-setting.service';
import { FormStepComponent } from './components/step-views/form-step-view/form-step.component';
import { GenericPortalService } from './services/generic-portal.service';

import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabCommandBarModule } from '@angular-react/fabric/lib/components/command-bar';
import { FabBreadcrumbModule } from '@angular-react/fabric/lib/components/breadcrumb';
import { FabCalloutModule } from '@angular-react/fabric/lib/components/callout';
import { FabCheckboxModule } from '@angular-react/fabric/lib/components/checkbox';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabDatePickerModule } from '@angular-react/fabric/lib/components/date-picker';
import { FabSpinnerModule } from '@angular-react/fabric/lib/components/spinner';
import { FabPivotModule } from '@angular-react/fabric/lib/components/pivot';
import { FabLinkModule } from '@angular-react/fabric/lib/components/link';
import { FabMessageBarModule } from '@angular-react/fabric/lib/components/message-bar';
import { FabTooltipModule } from '@angular-react/fabric/lib/components/tooltip';
import { FabSearchBoxModule } from '@angular-react/fabric/lib/components/search-box';
import { FabCalendarModule } from '@angular-react/fabric/lib/components/calendar';
import { FabDetailsListModule } from '@angular-react/fabric/lib/components/details-list';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { ClientScriptViewComponent } from './components/client-script-view/client-script-view.component';
import { GenericFeatureService } from './services/generic-feature-service';
import { GanttChartTaskbarColorsComponent } from './components/gantt-chart-taskbar-colors/gantt-chart-taskbar-colors.component';
import { WorkflowResultComponent } from './components/workflow-result/workflow-result.component';
import { WorkflowViewComponent } from './components/workflow-view/workflow-view.component';
import { WorkflowNodeComponent } from './components/workflow-node/workflow-node.component';
import { NgFlowchartModule } from 'projects/ng-flowchart/dist';
import { ArchitectureDiagramComponent } from './components/architecture-diagram/architecture-diagram.component';
import { ArchitectureDiagramNodeComponent } from './components/architecture-diagram-node/architecture-diagram-node.component';
import { GenericOpenAIChatService, OpenAIArmService } from '../public_api';
import { OpenaiComponent } from './components/openai/openai.component';
import { QueryResponseService } from './services/query-response.service';
import { WorkflowConditionNodeComponent } from './components/workflow-condition-node/workflow-condition-node.component';
import { OptInsightsEnablementComponent } from './components/opt-insights-enablement/opt-insights-enablement.component';
import { OptInsightsMarkdownComponent } from './components/opt-insights-markdown/opt-insights-markdown.component';
import { OptInsightsGenericService } from './services/optinsights.service';
import { DemoSubscriptions } from './models/betaSubscriptions';
import { WorkflowAcceptUserinputComponent } from './components/workflow-accept-userinput/workflow-accept-userinput.component';
import { VideoComponent } from './components/video/video.component';
import { SafePipe } from './pipe/safe.pipe';
import { DateTimePickerComponent } from './components/date-time-picker/date-time-picker.component';
import { ChatUIComponent } from './components/chat-ui/chat-ui.component';
import { ChatUIContextService } from './services/chatui-context.service';
import {OpenAIChatComponent} from './components/openai-chat/openai-chat.component';
import {OpenAIGenieComponent} from './components/openai-genie/openai-genie.component';
import {OpenAIChatContainerComponent} from './components/openai-chat-container/openai-chat-container.component';
import { ChatUIMarkdownWrapperComponent } from './components/chat-ui-markdown-wrapper/chat-ui-markdown-wrapper.component';
import { FabDialogModule } from '@angular-react/fabric/lib/components/dialog';


@NgModule({
    imports: [
        CommonModule,
        MarkdownModule.forRoot({
            sanitize: SecurityContext.STYLE
        }),
        FormsModule,
        MonacoEditorModule.forRoot(),
        CustomMaterialModule,
        HighchartsChartModule,
        RouterModule,
        FabPanelModule,
        FabIconModule,
        FabChoiceGroupModule,
        FabSearchBoxModule,
        FabCoachmarkModule,
        FabTeachingBubbleModule,
        FabCommandBarModule,
        FabDropdownModule,
        InViewportModule,
        FabDetailsListModule,
        FabTextFieldModule,
        FabMessageBarModule,
        FabButtonModule,
        FabTooltipModule,
        FabSpinnerModule,
        FabCalloutModule,
        FabCheckboxModule,
        FabPivotModule,
        FabLinkModule,
        FabBreadcrumbModule,
        RouterModule,
        FabDatePickerModule,
        FabCalendarModule,
        NgFlowchartModule,
        FabDialogModule
    ],
    providers: [
        ClipboardService
    ],
    declarations: [
        TimeSeriesGraphComponent, DynamicDataComponent,
        DataRenderBaseComponent, DataContainerComponent, TimeSeriesInstanceGraphComponent, DetectorViewComponent, DetectorSearchComponent,
        DataSummaryComponent, EmailComponent, LoaderViewComponent,
        MarkdownViewComponent, DetectorListComponent, DetectorOrderPipe, StarRatingComponent, StarRatingFeedbackComponent,
        StatusIconComponent, DetectorControlComponent, DetectorContainerComponent, InternalPipe,
        CommAlertComponent, FeedbackComponent, CopyInsightDetailsComponent, MarkdownEditorComponent,
        GuageGraphicComponent, GuageControlComponent, SolutionComponent, SolutionsComponent, FormComponent,
        VerticalDisplayListComponent, VerticalDisplayListItemComponent, SolutionTypeTagComponent, SolutionDisplayComponent,
        SolutionDisplayItemComponent,
        ChangeAnalysisOnboardingComponent,
        ChangesetsViewComponent,
        ChangesViewComponent,
        DetectorListAnalysisComponent,
        AppDependenciesComponent,
        AppInsightsMarkdownComponent,
        HighchartsGraphComponent,
        SummaryCardsComponent,
        InsightsV4Component,
        CardSelectionV4Component,
        DropdownV4Component,
        CxpChatLauncherComponent,
        AppInsightsEnablementComponent,
        ConnectAppInsightsComponent,
        WebSearchComponent,
        RenderFilterPipe,
        DynamicInsightV4Component,
        ClientScriptViewComponent,
        MarkdownTextComponent,
        DataTableV4Component,
        DocumentsSearchComponent,
        LoaderDetectorViewComponent,
        KeystoneInsightComponent,
        SolutionViewContainerComponent,
        FabDataTableFilterComponent,
        NotificationRenderingComponent,
        FabTabComponent,
        SectionsComponent,
        CollapsibleListComponent,
        CollapsibleListFabricComponent,
        CollapsibleListItemComponent,
        InputStepComponent,
        StepViewsRendererComponent,
        InfoStepComponent,
        DropDownStepComponent,
        ButtonStepComponent,
        CheckStepComponent,
        CheckComponent,
        ConvertLevelToHealthStatusPipe,
        GetDropdownOptionsPipe,
        SolutionOrchestratorComponent,
        FabCardComponent,
        FabDataTableComponent,
        SolutionsPanelComponent,
        DetectorTimePickerComponent,
        FabricFeedbackComponent,
        FormStepComponent,
        ClientScriptViewComponent,
        GanttChartTaskbarColorsComponent,
        WorkflowResultComponent,
        WorkflowViewComponent,
        WorkflowNodeComponent,
        ArchitectureDiagramComponent,
        ArchitectureDiagramNodeComponent,
        WorkflowConditionNodeComponent,
        OptInsightsEnablementComponent,
        OptInsightsMarkdownComponent,
        WorkflowAcceptUserinputComponent,
        VideoComponent,
        SafePipe,
        OpenaiComponent,
        DateTimePickerComponent,
        ChatUIComponent,
        OpenAIChatComponent,
        OpenAIGenieComponent,
        OpenAIChatContainerComponent,
        ChatUIMarkdownWrapperComponent
    ],
    exports: [
        FormsModule, TimeSeriesGraphComponent, DynamicDataComponent, DetectorViewComponent, DetectorSearchComponent, ClientScriptViewComponent,
        DataSummaryComponent, LoaderViewComponent, LoaderDetectorViewComponent, StatusIconComponent, DetectorControlComponent,
        DetectorContainerComponent, InternalPipe, CommAlertComponent, GuageControlComponent, SolutionComponent,
        FormComponent, VerticalDisplayListComponent, VerticalDisplayListItemComponent, SolutionTypeTagComponent, DataContainerComponent,
        ChangeAnalysisOnboardingComponent,
        ChangesetsViewComponent,
        ChangesViewComponent,
        DetectorListAnalysisComponent,
        AppInsightsMarkdownComponent,
        FeedbackComponent,
        CxpChatLauncherComponent,
        AppInsightsEnablementComponent,
        ConnectAppInsightsComponent,
        WebSearchComponent,
        SolutionViewContainerComponent,
        FabTabComponent,
        CollapsibleListComponent,
        CollapsibleListFabricComponent,
        CollapsibleListItemComponent,
        InputStepComponent,
        StepViewsRendererComponent,
        ClientScriptViewComponent,
        InfoStepComponent,
        DropDownStepComponent,
        ButtonStepComponent,
        CheckStepComponent,
        CheckComponent,
        ConvertLevelToHealthStatusPipe,
        GetDropdownOptionsPipe,
        SolutionOrchestratorComponent,
        FabCoachmarkModule,
        FabTeachingBubbleModule,
        FabTabComponent,
        FabricFeedbackComponent,
        FabDataTableComponent,
        DetectorTimePickerComponent,
        FabCardComponent,
        FormStepComponent,
        GanttChartTaskbarColorsComponent,
        WorkflowViewComponent,
        SafePipe,
        OpenaiComponent,
        ChatUIComponent,
        OpenAIChatComponent,
        OpenAIGenieComponent,
        DateTimePickerComponent,
        OpenAIChatContainerComponent,
        ChatUIMarkdownWrapperComponent
    ]
})
export class DiagnosticDataModule {
    static forRoot(config: DiagnosticDataConfig = INTERNAL_PROD_CONFIGURATION): ModuleWithProviders<DiagnosticDataModule> {
        return {
            ngModule: DiagnosticDataModule,
            providers: [
                DiagnosticService,
                GenericSupportTopicService,
                GenericThemeService,
                GenericContentService,
                GenericDocumentsSearchService,
                GenericBreadcrumbService,
                GenericUserSettingService,
                GenericPortalService,
                { provide: DIAGNOSTIC_DATA_CONFIG, useValue: config },
                CXPChatService,
                KustoTelemetryService,
                GenieGlobals,
                AppInsightsTelemetryService,
                TelemetryService,
                DetectorControlService,
                CommsService,
                FeatureNavigationService,
                AppInsightsQueryService,
                ParseResourceService,
                HighChartsHoverService,
                GenericFeatureService,
                GenericOpenAIChatService,
                OpenAIArmService,
                QueryResponseService,
                OptInsightsGenericService,
                DemoSubscriptions,
                ChatUIContextService
            ]
        };
    }
}
