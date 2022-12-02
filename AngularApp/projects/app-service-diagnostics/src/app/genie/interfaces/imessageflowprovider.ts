import { MessageGroup } from '../models/message-group';
import { Observable, BehaviorSubject } from 'rxjs';

export class IMessageFlowProvider {
  protected additionalMessageFlows: BehaviorSubject<MessageGroup[]> =
    new BehaviorSubject<MessageGroup[]>(null);

  GetMessageFlowList(): MessageGroup[] {
    return [];
  }
  SubscribeToAdditionalMessageFlowLists(): Observable<MessageGroup[]> {
    return this.additionalMessageFlows;
  }
}
