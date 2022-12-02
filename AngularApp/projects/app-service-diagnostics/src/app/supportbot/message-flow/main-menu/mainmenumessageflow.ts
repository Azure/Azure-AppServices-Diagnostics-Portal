import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { MainMenuComponent } from './main-menu.component';
import { MessageSender } from '../../models/message-enums';
import { AuthService } from '../../../startup/services/auth.service';
import { ResourceType } from '../../../shared/models/portal';

@Injectable()
@RegisterMessageFlowWithFactory()
export class MainMenuMessageFlow extends IMessageFlowProvider {
  constructor(private _authService: AuthService) {
    super();
  }

  GetMessageFlowList(): MessageGroup[] {
    const messageGroupList: MessageGroup[] = [];

    const mainMenuGroup: MessageGroup = new MessageGroup(
      'main-menu',
      [],
      () => {
        return this._authService.resourceType === ResourceType.Site
          ? 'health-check'
          : 'feedbackprompt';
      }
    );
    mainMenuGroup.messages.push(
      new TextMessage(
        'If you know what’s wrong with your app, please select a problem category',
        MessageSender.System,
        2000
      )
    );
    mainMenuGroup.messages.push(new MainMenuMessage());

    messageGroupList.push(mainMenuGroup);

    return messageGroupList;
  }
}

export class MainMenuMessage extends Message {
  constructor(messageDelayInMs: number = 1000) {
    super(MainMenuComponent, {}, messageDelayInMs);
  }
}
