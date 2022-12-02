import { Injectable, Injector } from '@angular/core';
import { Message } from './models/message';
import { MessageGroup } from './models/message-group';
import { MessageFlowFactory } from './message-flow/message-flow.factory';
import { IMessageFlowProvider } from './interfaces/imessageflowprovider';
import { ButtonActionType } from './models/message-enums';

@Injectable()
export class MessageProcessor {
  private _messageFlowProviders: IMessageFlowProvider[];
  private _messageGroups: MessageGroup[] = [];
  private _startingKey: string = 'startup';
  private _currentKey: string;
  private _currentMessageGroup: MessageGroup;
  private _currentMessageIterator: number;

  constructor(private _injector: Injector) {
    //this._messageGroups = MessageFlowFactory.getMessageGroups();

    this._messageFlowProviders =
      MessageFlowFactory.getMessageFlowProviders().map((provider) => {
        return this._injector.get(provider);
      });

    let messageGroups: MessageGroup[] = [];
    this._messageFlowProviders.forEach((provider) => {
      messageGroups = messageGroups.concat(provider.GetMessageFlowList());
      provider
        .SubscribeToAdditionalMessageFlowLists()
        .subscribe((newMessageGroups) => {
          this._messageGroups.concat(newMessageGroups);
        });
    });

    this._messageGroups = messageGroups;

    this.setCurrentKey(this._startingKey);

    // this._currentKey = this._startingKey;
    // this._currentMessageIterator = 0;
    // this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
  }

  public setCurrentKey(key: string) {
    this._currentKey = key;
    this._currentMessageIterator = 0;
    this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
  }

  private _getMessageGroupByKey(key: string): MessageGroup {
    const msgGroup = this._messageGroups.find((p) => p.key === key);
    if (!msgGroup) {
      // TODO : Log Error Here for missing Message Group.
    }

    return msgGroup;
  }

  public getNextMessage(event: any): Message {
    if (
      event &&
      event.hasOwnProperty('type') &&
      event.hasOwnProperty('next_key')
    ) {
      if (event['type'] === ButtonActionType.SwitchToOtherMessageGroup) {
        this._currentMessageIterator = 0;
        this._currentKey = event['next_key'];

        this._currentMessageGroup = this._getMessageGroupByKey(
          this._currentKey
        );
      }
    }

    if (!this._currentMessageGroup) {
      return null;
    }

    if (
      this._currentMessageIterator >= this._currentMessageGroup.messages.length
    ) {
      if (this._currentMessageGroup.next_key === undefined) {
        return null;
      }

      const nextKey = this._currentMessageGroup.next_key();

      if (nextKey === '') {
        return null;
      }

      this._currentMessageIterator = 0;
      this._currentKey = nextKey;

      this._currentMessageGroup = this._getMessageGroupByKey(this._currentKey);
    }

    const nextMessage: Message =
      this._currentMessageGroup.messages[this._currentMessageIterator];
    this._currentMessageIterator++;

    return nextMessage;
  }

  public addMessageToCurrentGroup(message: Message) {
    if (this._currentMessageGroup && this._currentMessageIterator >= 0) {
      this._currentMessageGroup.messages.splice(
        this._currentMessageIterator,
        0,
        message
      );
    }
  }
}
