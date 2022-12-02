import { Component } from '@angular/core';
import { TextMessageComponent } from '../common/text-message/text-message.component';
import { ButtonMessageComponent } from '../common/button-message/button-message.component';
import { MessageSender, ButtonActionType } from './message-enums';

export abstract class Message {
  constructor(
    public component: any,
    public parameters: any,
    public messageDelayInMs: number = 100
  ) {}
}

export class TextMessage extends Message {
  constructor(
    message: string,
    sender: MessageSender = MessageSender.System,
    messageDelayInMs: number = MessageSender.User ? 0 : 1000,
    focus: boolean = false
  ) {
    super(
      TextMessageComponent,
      {
        message: message,
        sender: sender,
        focus: focus
      },
      messageDelayInMs
    );
  }
}

export class ButtonListMessage extends Message {
  constructor(
    buttonList: { title: string; type: ButtonActionType; next_key: string }[],
    context: string,
    category: string = 'Support Home',
    sender: MessageSender = MessageSender.System
  ) {
    super(ButtonMessageComponent, {
      buttonList: buttonList,
      sender: sender,
      context: context,
      category: category
    });
  }
}
