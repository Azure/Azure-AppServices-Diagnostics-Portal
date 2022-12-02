import { MessageGroup } from '../models/message-group';
import { IMessageFlowProvider } from '../interfaces/imessageflowprovider';

export class MessageFlowFactory {
  public static _registeredMessageFlowProviders: any[] = [];

  public static registerMessageFlowProvider(messageFlowProvider: any) {
    if (messageFlowProvider) {
      this._registeredMessageFlowProviders.push(messageFlowProvider);
    }
  }

  public static getMessageFlowProviders(): any[] {
    return this._registeredMessageFlowProviders;
  }

  public static getMessageGroups(): MessageGroup[] {
    let result: MessageGroup[] = [];

    this._registeredMessageFlowProviders.forEach((p: any) => {
      result = result.concat(p.prototype.GetMessageFlowList());
    });

    return result;
  }
}

// Custom Decorator for Message Providers to register with Factory.
export function RegisterMessageFlowWithFactory() {
  return function (target: any) {
    MessageFlowFactory.registerMessageFlowProvider(target);
  };
}
