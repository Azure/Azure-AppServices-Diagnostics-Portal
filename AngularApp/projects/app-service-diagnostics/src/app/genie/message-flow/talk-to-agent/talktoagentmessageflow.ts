import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { TextMessage, ButtonListMessage, Message } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { TalkToAgentMessageComponent } from './talk-to-agent-message.component';
import { SiteService } from '../../../shared/services/site.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ResourceType } from '../../../shared/models/portal';
import { Site, SiteInfoMetaData } from '../../../shared/models/site';

//TODO: THIS IS NO LONGER REGISTERED ANYWHERE
// Need to migrate this
@Injectable()
@RegisterMessageFlowWithFactory()
export class TalkToAgentMessageFlow extends IMessageFlowProvider {
  public isApplicable: boolean;
  private isDemoMode: boolean = true;

  constructor(
    private siteService: SiteService,
    private authService: AuthService
  ) {
    super();
    this.isApplicable = false;

    if (this.authService.resourceType === ResourceType.Site) {
      this.siteService.currentSite.subscribe((site: Site) => {
        if (site) {
          this.siteService.currentSiteMetaData.subscribe(
            (siteMetaData: SiteInfoMetaData) => {
              if (siteMetaData) {
                this.isApplicable = false;
              }
            }
          );
        }
      });
    }
  }

  public GetMessageFlowList(): MessageGroup[] {
    let messageGroupList: MessageGroup[] = [];

    let msgGroup: MessageGroup = new MessageGroup(
      'talk-to-agent',
      [],
      () => ''
    );
    msgGroup.messages.push(
      new TextMessage(
        'Do you want to talk about Azure App Service Certificate or Domain issue?'
      )
    );
    msgGroup.messages.push(
      new ButtonListMessage(this.getProdIssueButtonList(), 'Talk-To-Agent')
    );
    msgGroup.messages.push(new TextMessage('Yes', MessageSender.User, 100));
    msgGroup.messages.push(
      new TextMessage(
        'Got it. Let me connect you with one of our live agents for further assistance.',
        MessageSender.System,
        1000
      )
    );
    msgGroup.messages.push(new TalkToAgentMessage());
    msgGroup.messages.push(
      new TextMessage(
        'I connected you to one of our agents who can assist you further. Thank you.',
        MessageSender.System,
        1000
      )
    );
    messageGroupList.push(msgGroup);

    let noProdIssueGroup: MessageGroup = new MessageGroup(
      'no-prod-issue',
      [],
      () => 'no-help'
    );
    noProdIssueGroup.messages.push(
      new TextMessage('No, not right now', MessageSender.User, 100)
    );
    messageGroupList.push(noProdIssueGroup);

    return messageGroupList;
  }

  private getProdIssueButtonList(): any {
    return [
      {
        title: 'Yes',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: 'No',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: 'no-prod-issue'
      }
    ];
  }

  private getContinueButtonList(): any {
    return [
      {
        title: 'Continue',
        type: ButtonActionType.Continue,
        next_key: ''
      }
    ];
  }
}

export class TalkToAgentMessage extends Message {
  constructor() {
    super(TalkToAgentMessageComponent, {});
  }
}
