import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { GenieFeedbackComponent } from './genie-feedback.component';
import { MessageSender, ButtonActionType } from '../../models/message-enums';

export class GenieFeedbackMessage extends Message {
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
      GenieFeedbackComponent,
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
