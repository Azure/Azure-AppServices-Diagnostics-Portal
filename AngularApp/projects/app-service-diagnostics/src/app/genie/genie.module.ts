import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { FabricModule } from '../fabric-ui/fabric.module';
import { SolutionsModule } from '../solutions/solutions.module';
import { StartupMessages } from './message-flow/startup/startupmessages';
import { GenieMessageProcessor } from './message-processor.service';
import { GenieTextMessageComponent } from './common/text-message/text-message.component';
import { ButtonMessageComponent } from './common/button-message/button-message.component';
import { FeedbackButtonMessageComponent } from './common/feedback-button-message/feedback-button-message.component';
import { LoadingMessageComponent } from './common/loading-message/loading-message.component';
import { TalkToAgentMessageComponent } from './message-flow/talk-to-agent/talk-to-agent-message.component';
import { GenieFeedbackComponent } from './message-flow/genie-feedback/genie-feedback.component'
import { SolutionsMessageComponent } from './common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from './common/graph-message/graph-message.component';
import { DetectorSummaryComponent } from './message-flow/detector-summary/detector-summary.component';
import { DocumentSearchComponent } from './message-flow/document-search/document-search.component';
import { DocumentSearchResultsComponent } from './message-flow/document-search-results/document-search-results.component';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { DiagnosticDataModule } from 'diagnostic-data';
import { GenieChatFlow } from './message-flow/v2-flows/genie-chat.flow';
import { DynamicAnalysisComponent } from './message-flow/dynamic-analysis/dynamic-analysis.component';
import { GeniePanelComponent } from '../fabric-ui/components/genie-panel/genie-panel.component';
import { GenieDynamicComponent} from './dynamic-component/genie-dynamic.component';
import { CommonModule } from '@angular/common';
import { GenericResourceService } from 'diagnostic-data';
import { ResourceService } from '../shared-v2/services/resource.service';
import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';

@NgModule({
    declarations: [
        GenieTextMessageComponent,
        LoadingMessageComponent,
        ButtonMessageComponent,
        FeedbackButtonMessageComponent,
        TalkToAgentMessageComponent,
        GenieFeedbackComponent,
        SolutionsMessageComponent,
        GraphMessageComponent,
        DetectorSummaryComponent,
        DocumentSearchComponent,
        DocumentSearchResultsComponent,
        DynamicAnalysisComponent,
        GeniePanelComponent,
        GenieDynamicComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        FabricModule,
        SolutionsModule,
        SharedV2Module,
        DiagnosticDataModule,
        FabIconModule,
        FabChoiceGroupModule,
        FabPanelModule
    ],
    exports: [
        DetectorSummaryComponent,
        LoadingMessageComponent,
        GeniePanelComponent,
        GenieDynamicComponent
    ],
    providers: [
        StartupMessages,
        GenieMessageProcessor,
        GenieChatFlow,
        { provide: GenericResourceService, useExisting: ResourceService}
    ]
})
export class GenieModule {
}
