import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { WindowService } from './services/window.service';
import { PortalService } from './services/portal.service';
import { BroadcastService } from './services/broadcast.service';
import { AuthService } from './services/auth.service';
import { StartupMessages } from '../supportbot/message-flow/startup/startupmessages';
import { MainMenuMessageFlow } from '../supportbot/message-flow/main-menu/mainmenumessageflow';
import { FeedbackMessageFlow } from '../supportbot/message-flow/feedback/feedbackmessageflow';
import { MessageProcessor } from '../supportbot/message-processor.service';
import { GenieMessageProcessor } from '../genie/message-processor.service';
import { GenericCategoryFlow } from '../supportbot/message-flow/v2-flows/generic-category.flow';
import { AvailabilityPerformanceFlow } from '../supportbot/message-flow/v2-flows/availability-performance.flow';
import { CpuAnalysisChatFlow } from '../supportbot/message-flow/cpu-analysis-chat/cpu-analysis-chat-flow';
import { LinuxAvailabilityPerformanceFlow } from '../supportbot/message-flow/v2-flows/linux-availability-performance.flow';
import { GenericPortalService } from 'diagnostic-data';

@NgModule({
  imports: [
    HttpClientModule,
    CommonModule
  ],
  declarations: []
})
export class StartupModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: StartupModule,
      providers: [
        WindowService,
        PortalService,
        { provide: GenericPortalService, useExisting: PortalService },
        BroadcastService,
        AuthService,
        StartupMessages,
        MainMenuMessageFlow,
        FeedbackMessageFlow,
        CpuAnalysisChatFlow,
        MessageProcessor,
        GenieMessageProcessor,
        AvailabilityPerformanceFlow,
        LinuxAvailabilityPerformanceFlow,
        GenericCategoryFlow,
      ]
    };
  }
}
