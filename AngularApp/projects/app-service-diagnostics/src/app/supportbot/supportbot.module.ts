import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { AvailabilityModule } from '../availability/availability.module';
import { SolutionsModule } from '../solutions/solutions.module';

import { StartupMessages } from './message-flow/startup/startupmessages';
import { MainMenuMessageFlow } from './message-flow/main-menu/mainmenumessageflow';
import { FeedbackMessageFlow } from './message-flow/feedback/feedbackmessageflow';
import { MessageProcessor } from './message-processor.service';

import { HomepageComponent } from './homepage/homepage.component';
import { SupportBotComponent } from './support-bot.component';
import { DynamicComponent } from './dynamic-component/dynamic.component';
import { TextMessageComponent } from './common/text-message/text-message.component';
import { ButtonMessageComponent } from './common/button-message/button-message.component';
import { LoadingMessageComponent } from './common/loading-message/loading-message.component';
import { MainMenuComponent } from './message-flow/main-menu/main-menu.component';
import { TalkToAgentMessageComponent } from './message-flow/talk-to-agent/talk-to-agent-message.component';
import { FeedbackComponent } from './message-flow/feedback/feedback.component';
import { SolutionsMessageComponent } from './common/solutions-message/solutions-message.component';
import { GraphMessageComponent } from './common/graph-message/graph-message.component';
import { CpuAnalysisChatFlow } from './message-flow/cpu-analysis-chat/cpu-analysis-chat-flow';
import { ProblemStatementMessageComponent } from './common/problem-statement-message/problem-statement-message.component';

import { CategoryMenuComponent } from './message-flow/category-menu/category-menu.component';
import { DetectorSummaryComponent } from './message-flow/detector-summary/detector-summary.component';
import { DocumentSearchComponent } from './message-flow/document-search/document-search.component';
import { DocumentSearchResultsComponent } from './message-flow/document-search-results/document-search-results.component';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { DiagnosticDataModule } from 'diagnostic-data';
import { GenericCategoryFlow } from './message-flow/v2-flows/generic-category.flow';
import { AvailabilityPerformanceFlow } from './message-flow/v2-flows/availability-performance.flow';
import { LinuxAvailabilityPerformanceFlow } from './message-flow/v2-flows/linux-availability-performance.flow';

@NgModule({
    declarations: [
        HomepageComponent,
        SupportBotComponent,
        DynamicComponent,
        TextMessageComponent,
        LoadingMessageComponent,
        MainMenuComponent,
        ButtonMessageComponent,
        TalkToAgentMessageComponent,
        FeedbackComponent,
        SolutionsMessageComponent,
        GraphMessageComponent,
        ProblemStatementMessageComponent,
        CategoryMenuComponent,
        DetectorSummaryComponent,
        DocumentSearchComponent,
        DocumentSearchResultsComponent
    ],
    imports: [
        SharedModule,
        AvailabilityModule,
        SolutionsModule,
        SharedV2Module,
        DiagnosticDataModule
    ],
    exports: [
        HomepageComponent,
        SupportBotComponent,
        CategoryMenuComponent,
        DetectorSummaryComponent
    ],
    providers: [
        StartupMessages,
        MainMenuMessageFlow,
        FeedbackMessageFlow,
        CpuAnalysisChatFlow,
        MessageProcessor,
        AvailabilityPerformanceFlow,
        LinuxAvailabilityPerformanceFlow,
        GenericCategoryFlow
    ]
})
export class SupportBotModule {
}
