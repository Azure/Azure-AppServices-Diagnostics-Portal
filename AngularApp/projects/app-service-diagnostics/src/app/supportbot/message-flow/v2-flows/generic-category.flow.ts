import { Injectable } from '@angular/core';
import { MessageGroup } from '../../models/message-group';
import { TextMessage, ButtonListMessage } from '../../models/message';
import { Category } from '../../../shared-v2/models/category';
import { Observable, of } from 'rxjs';
import { DetectorMetaData, DiagnosticService } from 'diagnostic-data';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { CategoryMenuMessage } from '../category-menu/category-menu.component';
import { DetectorSummaryMessage } from '../detector-summary/detector-summary.component';
import { DocumentSearchMessage } from '../document-search/document-search.component';
import { FeedbackMessage } from '../feedback/feedbackmessageflow';
import { map } from 'rxjs/operators';
import { GenericArmConfigService } from '../../../shared/services/generic-arm-config.service';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';

@Injectable()
@RegisterMessageFlowWithFactory()
export class GenericCategoryFlow extends IMessageFlowProvider {
  messageFlowList: MessageGroup[] = [];

  categoriesCreated: Category[] = [];

  constructor(
    private _diagnosticApiService: DiagnosticService,
    private _resourceService: ResourceService,
    private _genericArmConfigService?: GenericArmConfigService
  ) {
    super();
    const needMoreHelp: MessageGroup = new MessageGroup(
      'more-help',
      [],
      () => 'feedback'
    );
    needMoreHelp.messages.push(
      new TextMessage('I need further assistance', MessageSender.User)
    );
    needMoreHelp.messages.push(
      new TextMessage(
        'Sorry to hear I could not help you solve your problem',
        MessageSender.System
      )
    );

    const documentSearch: MessageGroup = new MessageGroup(
      'in-chat-search',
      [],
      () => 'feedback'
    );
    documentSearch.messages.push(
      new TextMessage('I need further assistance.', MessageSender.User)
    );
    documentSearch.messages.push(
      new TextMessage(
        'Please describe your problem below, so I can search relevant documentation and tools that may help you.',
        MessageSender.System
      )
    );
    documentSearch.messages.push(new DocumentSearchMessage());
    documentSearch.messages.push(
      new TextMessage(
        'Was this helpful to finding what you were looking for?',
        MessageSender.System,
        2000
      )
    );
    documentSearch.messages.push(
      new ButtonListMessage(
        this._getButtonListDidYouFindHelpful(
          'more-help',
          'I need further assistance'
        ),
        'Was this helpful to finding what you were looking for?',
        'Availability and Performance'
      )
    );
    documentSearch.messages.push(
      new TextMessage('Yes I found the right information.', MessageSender.User)
    );
    documentSearch.messages.push(
      new TextMessage(
        "Great I'm glad I could be of help!",
        MessageSender.System
      )
    );

    this.messageFlowList.push(documentSearch);
    this.messageFlowList.push(needMoreHelp);
  }

  GetMessageFlowList(): MessageGroup[] {
    return this.messageFlowList;
  }

  createMessageFlowForCategory(category: Category): Observable<MessageGroup[]> {
    if (
      !category ||
      !category.createFlowForCategory ||
      this.categoriesCreated.indexOf(category) >= 0
    ) {
      return of([]);
    }

    this.categoriesCreated.push(category);

    return this._diagnosticApiService.getDetectors().pipe(
      map((detectors: DetectorMetaData[]) => {
        const messageGroupList: MessageGroup[] = [];

        const mainMenuId: string = `main-menu-${category.id}`;
        const docSearch: string = `in-chat-search-${category.id}`;
        const moreHelpId: string = `more-help-${category.id}`;
        const showTiles: string = `show-all-tiles-${category.id}`;
        const feedback: string = `feedback-${category.id}`;

        let serviceName: string = 'App Service Diagnostics';
        if (
          this._resourceService.resource.type ===
          'Microsoft.Web/hostingEnvironments'
        ) {
          serviceName = 'App Service Environment Diagnostics';
        } else {
          if (
            this._resourceService &&
            this._resourceService instanceof WebSitesService &&
            (this._resourceService as WebSitesService).appType ===
              AppType.FunctionApp
          ) {
            serviceName = 'Azure Functions Diagnostics';
          }
        }

        if (
          this._resourceService.armResourceConfig &&
          this._resourceService.armResourceConfig.homePageText &&
          this._resourceService.armResourceConfig.homePageText.title &&
          this._resourceService.armResourceConfig.homePageText.title.length > 0
        ) {
          serviceName =
            this._resourceService.armResourceConfig.homePageText.title;
        }

        const welcomeCategory: MessageGroup = new MessageGroup(
          `welcome-${category.id}`,
          [],
          () => mainMenuId
        );
        welcomeCategory.messages.push(
          new TextMessage(
            `Hello! Welcome to ${serviceName}! My name is Genie and I\'m here to help you diagnose and solve problems.`
          )
        );
        welcomeCategory.messages.push(
          new TextMessage(
            `Here are some issues related to ${category.name} that I can help with. Please select the tile that best describes your issue.`,
            MessageSender.System,
            500
          )
        );

        const categoryMainMenu: MessageGroup = new MessageGroup(
          mainMenuId,
          [],
          () => feedback
        );
        categoryMainMenu.messages.push(new CategoryMenuMessage());
        categoryMainMenu.messages.push(
          new TextMessage(
            'Okay give me a moment while I analyze your app for any issues related to this tile. Once the detectors load, feel free to click to investigate each topic further.',
            MessageSender.System,
            500
          )
        );
        categoryMainMenu.messages.push(new DetectorSummaryMessage());
        categoryMainMenu.messages.push(
          new TextMessage(
            'Did you find what you were looking for?',
            MessageSender.System,
            3000
          )
        );
        categoryMainMenu.messages.push(
          new ButtonListMessage(
            this._getButtonListDidYouFindHelpful(
              docSearch,
              'Search Documentation',
              showTiles
            ),
            'feature',
            category.name
          )
        );
        categoryMainMenu.messages.push(
          new TextMessage(
            'Yes I found the right information.',
            MessageSender.User
          )
        );
        categoryMainMenu.messages.push(
          new TextMessage(
            "Great I'm glad I could be of help!",
            MessageSender.System
          )
        );

        const documentSearch: MessageGroup = new MessageGroup(
          docSearch,
          [],
          () => feedback
        );
        documentSearch.messages.push(
          new TextMessage('Search Documentation.', MessageSender.User)
        );
        documentSearch.messages.push(
          new TextMessage(
            'Please describe your problem below, so I can search relevant documentation and tools that may help you.',
            MessageSender.System
          )
        );
        documentSearch.messages.push(new DocumentSearchMessage());
        documentSearch.messages.push(
          new TextMessage(
            'Was this helpful to finding what you were looking for?',
            MessageSender.System,
            2000
          )
        );
        documentSearch.messages.push(
          new ButtonListMessage(
            this._getButtonListDidYouFindHelpful(
              moreHelpId,
              'I need further assistance',
              showTiles
            ),
            'Was this helpful to finding what you were looking for?',
            category.name
          )
        );
        documentSearch.messages.push(
          new TextMessage(
            'Yes I found the right information.',
            MessageSender.User
          )
        );
        documentSearch.messages.push(
          new TextMessage(
            "Great I'm glad I could be of help!",
            MessageSender.System
          )
        );

        const needMoreHelp: MessageGroup = new MessageGroup(
          moreHelpId,
          [],
          () => feedback
        );
        needMoreHelp.messages.push(
          new TextMessage('I need further assistance', MessageSender.User)
        );
        needMoreHelp.messages.push(
          new TextMessage(
            'Sorry to hear I could not help you solve your problem',
            MessageSender.System
          )
        );

        const feedbackGroup: MessageGroup = new MessageGroup(
          feedback,
          [],
          () => mainMenuId
        );
        feedbackGroup.messages.push(
          new TextMessage(
            'Please help me improve by providing some feedback. What was my most/least helpful feature? What features would you like to see?',
            MessageSender.System,
            500
          )
        );
        feedbackGroup.messages.push(
          new FeedbackMessage(
            [],
            'Submit and Show Tile Menu',
            'Feedback',
            category.name
          )
        );
        feedbackGroup.messages.push(new TextMessage('Thank you!'));
        feedbackGroup.messages.push(
          new TextMessage(
            `Feel free to continue to explore the tools within ${category.name}`
          )
        );

        const showAllTiles: MessageGroup = new MessageGroup(
          showTiles,
          [],
          () => mainMenuId
        );
        showAllTiles.messages.push(
          new TextMessage('Show Tile Menu.', MessageSender.User)
        );
        showAllTiles.messages.push(
          new TextMessage(
            `Here are all the tiles related to ${category.name}:`,
            MessageSender.System
          )
        );

        this.messageFlowList.push(welcomeCategory);
        this.messageFlowList.push(categoryMainMenu);
        this.messageFlowList.push(feedbackGroup);
        this.messageFlowList.push(documentSearch);
        this.messageFlowList.push(needMoreHelp);
        this.messageFlowList.push(showAllTiles);

        return messageGroupList;
      }, this)
    );
  }

  private _getButtonListForMoreHelpSearchResponse(mainMenuId: string): any {
    return [
      {
        title: 'Search',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: 'Show Tile Menu',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: mainMenuId
      }
    ];
  }

  private _getButtonListDidYouFindHelpful(
    furtherAssistance: string,
    furtherAssistanceString: string,
    mainMenuId?: string
  ): any {
    const buttons = [
      {
        title: 'Yes I found the right information',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: furtherAssistanceString,
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: furtherAssistance
      }
    ];

    if (mainMenuId) {
      buttons.push({
        title: 'Show Tile Menu',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: mainMenuId
      });
    }

    return buttons;
  }
}
