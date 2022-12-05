import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { FeedbackComponent } from './feedback.component';
import { MessageSender, ButtonActionType } from '../../models/message-enums';

@Injectable()
@RegisterMessageFlowWithFactory()
export class FeedbackMessageFlow extends IMessageFlowProvider {
  GetMessageFlowList(): MessageGroup[] {
    const messageGroupList: MessageGroup[] = [];

    const feedbackPromptGroup: MessageGroup = new MessageGroup(
      'feedbackprompt',
      [],
      () => 'feedback'
    );

    feedbackPromptGroup.messages.push(
      new TextMessage(
        'Thanks for using App Service diagnostics. Did you find this experience useful?',
        MessageSender.System,
        2500
      )
    );
    feedbackPromptGroup.messages.push(
      new ButtonListMessage(
        this._getButtonListForHealthCheckFeedback(),
        'Was diagnoser useful?'
      )
    );
    feedbackPromptGroup.messages.push(
      new TextMessage('Yes, thank you!', MessageSender.User, 100)
    );
    feedbackPromptGroup.messages.push(
      new TextMessage(
        "Great, I'm glad I could be of help!",
        MessageSender.System
      )
    );

    messageGroupList.push(feedbackPromptGroup);

    const feedbackGroup: MessageGroup = new MessageGroup(
      'feedback',
      [],
      () => ''
    );
    feedbackGroup.messages.push(
      new TextMessage(
        'Please help me improve by providing some feedback. What was my most/least helpful feature? What features would you like to see?'
      )
    );
    feedbackGroup.messages.push(
      new FeedbackMessage([], 'Submit', 'Feedback', 'Support Home')
    );
    feedbackGroup.messages.push(new TextMessage('Thank you!'));
    // TODO : Add Button Message - 1) To Refresh, 2) Return to top
    messageGroupList.push(feedbackGroup);

    const furtherAssistanceGroup: MessageGroup = new MessageGroup(
      'further-assistance',
      [],
      () => 'no-help'
    );

    furtherAssistanceGroup.messages.push(
      new TextMessage('I need further assistance.', MessageSender.User, 100)
    );
    messageGroupList.push(furtherAssistanceGroup);

    const noHelpMessageGroup: MessageGroup = new MessageGroup(
      'no-help',
      [],
      () => 'feedback'
    );
    noHelpMessageGroup.messages.push(
      new TextMessage(
        'Sorry to hear that I could not be of more help. Please explore our additional resources in the right hand column, especially our popular Support Tools, FAQs, and Community forums.',
        MessageSender.System
      )
    );
    messageGroupList.push(noHelpMessageGroup);

    return messageGroupList;
  }

  private _getButtonListForHealthCheckFeedback(): any {
    return [
      {
        title: 'Yes, thank you!',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: 'I need further assistance.',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: 'further-assistance'
      }
    ];
  }
}

export class FeedbackMessage extends Message {
  constructor(
    buttonList: {
      title: string;
      type: ButtonActionType;
      next_key: string;
    }[],
    submitButtonName: string,
    context: string,
    category: string = 'Support Home',
    messageDelayInMs: number = 1000
  ) {
    super(
      FeedbackComponent,
      {
        buttonList: buttonList,
        context: context,
        category: category,
        submitButtonName: submitButtonName
      },
      messageDelayInMs
    );
  }
}
