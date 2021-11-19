import { Injectable } from '@angular/core';
import { MessageGroup } from '../../models/message-group';
import { Message, TextMessage, ButtonListMessage, FeedbackButtonListMessage } from '../../models/message';
import { Category } from '../../../shared-v2/models/category';
import { Observable, of } from 'rxjs';
import { DetectorMetaData, DiagnosticService } from 'diagnostic-data';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { MessageSender, ButtonActionType, MessageType } from '../../models/message-enums';
import { DetectorSummaryMessage } from '../detector-summary/detector-summary.component';
import { DynamicAnalysisMessage } from '../dynamic-analysis/dynamic-analysis.component';
import { DocumentSearchMessage } from '../document-search/document-search.component';
import { GenieFeedbackMessage } from '../genie-feedback/geniefeedbackmessageflow'
import { map } from 'rxjs/operators';
import { GenericArmConfigService } from '../../../shared/services/generic-arm-config.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { Globals } from '../../../globals';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../startup/services/auth.service';
import { StartupInfo } from '../../../shared/models/portal';

@Injectable()
@RegisterMessageFlowWithFactory()
export class GenieChatFlow extends IMessageFlowProvider {
  messageFlowList: MessageGroup[] = [];
  resourceId: string="";
  categoriesCreated: Category[] = [];

  targetedScore: number = 0.5;

  constructor(private _router: Router, private _authService: AuthService, private _activatedRoute: ActivatedRoute, private _diagnosticApiService: DiagnosticService, private _resourceService: ResourceService, public globals: Globals, private _genericArmConfigService?: GenericArmConfigService) {
    super();
    let welcomeMessage: string = "Hello, my name is Genie. I am here to help answer any questions you may have about diagnosing and solving problems with your resource. Please describe the issue of your resource.";

    const welcomeMessageGroup: MessageGroup = new MessageGroup('welcome', [], () => '');
    welcomeMessageGroup.messages.push(new TextMessage(welcomeMessage, MessageSender.System, 200));
 
    const feedbackMessageGroup: MessageGroup = new MessageGroup('feedback', [], () => '');
    feedbackMessageGroup.messages.push(new FeedbackButtonListMessage('Did this information help you solve the issue?',this._getButtonListDidYouFindHelpfulinNewGenie(), 'Availability and Performance'));
   const helpfulGroup: MessageGroup = new MessageGroup('feedback-helpful', [], () => 'feedback-textbox');
   helpfulGroup.messages.push(new TextMessage('Yes', MessageSender.User, 200));
   helpfulGroup.messages.push(new TextMessage('Good to hear! Could you let us know how helpful was this?', MessageSender.System, 500));
   helpfulGroup.messages.push(new GenieFeedbackMessage([], 'Submit', 'Feedback', 'Support Home'));
   helpfulGroup.messages.push(new TextMessage('Thank you so much for your feedback! If you need more help, type in your question below. Otherwise, exit the session by using the close button in the top right corner.'));

   const notHelpfulGroup: MessageGroup = new MessageGroup('feedback-not-helpful', [], () => 'feedback-textbox');
   notHelpfulGroup.messages.push(new TextMessage('No', MessageSender.User, 200));
   notHelpfulGroup.messages.push(new TextMessage('Sorry to hear! Could you let us know how we can improve?', MessageSender.System, 500));
   notHelpfulGroup.messages.push(new GenieFeedbackMessage([], 'Submit', 'Feedback', 'Support Home'));
   notHelpfulGroup.messages.push(new TextMessage('Thank you for your feedback! Could you help describe your issue again so we can further assist you?'));
   const feedbackText: MessageGroup = new MessageGroup('feedback-textbox', [], () => '');

    this.messageFlowList.push(welcomeMessageGroup);
    this.messageFlowList.push(feedbackMessageGroup);
    this.messageFlowList.push(helpfulGroup);
    this.messageFlowList.push(notHelpfulGroup);
    this.messageFlowList.push(feedbackText);
  }

  GetMessageFlowList(): MessageGroup[] {
    return this.messageFlowList;
  }

  createMessageFlowForAnaysisResult(data: any, noSearchResult: boolean = false): any {
     const moreHelpId: string = `more-help-WindowsAvailabilityAndPerformance`;
     const showTiles: string = `show-all-tiles-WindowsAvailabilityAndPerformance`;
     const feedback: string = `feedback-WindowsAvailabilityAndPerformance`;
  }

  createMessageFlowForAnaysis(keyword: string, messageGroupId: string, resourceId: string=""): Observable<Message[]> {
    this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
        this.resourceId = startupInfo.resourceId;
      });
    let analysisMessages: Message[]  = [];
    let keywordTextMessage = new TextMessage(keyword, MessageSender.User, 500);
    let systemResponseTextMessage = new TextMessage('Okay give me a moment while I analyze your app for any issues related to this.', MessageSender.System, 500);
    resourceId = this.resourceId;
    let dynamicAnalysisMessage = new DynamicAnalysisMessage(keyword, resourceId);

    const analysisMessageGroup: MessageGroup = new MessageGroup(`${messageGroupId}`, [], () => '');
    analysisMessageGroup.messages.push(keywordTextMessage);
    analysisMessageGroup.messages.push(systemResponseTextMessage);
    analysisMessageGroup.messages.push(dynamicAnalysisMessage);
    let additionalMessageGroup: MessageGroup[] = [];
    additionalMessageGroup.push(analysisMessageGroup);
    this.additionalMessageFlows.next(additionalMessageGroup);
    return of(analysisMessages);
  }

  createMessageFlowForCategory(category: Category): Observable<MessageGroup[]> {
    if (!category.createFlowForCategory || this.categoriesCreated.indexOf(category) >= 0) { return of([]); }

    this.categoriesCreated.push(category);

    return this._diagnosticApiService.getDetectors().pipe(map((detectors: DetectorMetaData[]) => {
      const messageGroupList: MessageGroup[] = [];

      const mainMenuId: string = `main-menu-${category.id}`;

      let serviceName: string = 'App Service Diagnostics';
      let welcomeMessage = "genie-Hello, my name is Genie. I am here to help answer any questions you may have about diagnosing and solving problems with your resource. Please describe the issue of your resource.";

      if (this._resourceService.armResourceConfig
        && this._resourceService.armResourceConfig.homePageText
        && this._resourceService.armResourceConfig.homePageText.title
        && this._resourceService.armResourceConfig.homePageText.title.length > 0) {
        serviceName = this._resourceService.armResourceConfig.homePageText.title;
      }

      const welcomeCategory: MessageGroup = new MessageGroup(`welcome`, [], () => mainMenuId);
      welcomeCategory.messages.push(new TextMessage(welcomeMessage, MessageSender.System, 200));
      this.messageFlowList.push(welcomeCategory);

      return messageGroupList;
    }, this));
  }

  private _getButtonListDidYouFindHelpfulinNewGenie(): any {
    const buttons = [{
      title: 'Yes',
      type: ButtonActionType.GetFeedback,
      next_key: 'feedback-helpful'
    },
    {
      title: 'No',
      type: ButtonActionType.GetFeedback,
      next_key: 'feedback-not-helpful'
    }];

    return buttons;
  }
}
