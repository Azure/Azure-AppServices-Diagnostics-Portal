import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CXPChatService {
  constructor() {}

  public isSupportTopicEnabledForLiveChat(
    supportTopicIdToCheck: string
  ): boolean {
    return false;
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @returns a Guid that can be used as a tracking id.
   */
  public generateTrackingId(supportTopicId: string): string {
    return 'Not Implemented';
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param trackingIdGuid  Guid used for tracking. Get this by calling  `generateTrackingId(supportTopicId:string)`.
   * @returns CXP Chat type. If no engineer is available, it will return None, else it will return the type of chat that can be initiated for this support topic.
   */
  public getChatAvailability(
    supportTopicId: string,
    trackingIdGuid: string
  ): ReplaySubject<any> {
    return null;
  }

  /**
   * @param cxpChatType  Get this from the output of cxpChatService.getChatAvailability call.
   * @param queueForSupportTopic This is the output of getChatAvailability call.
   * @param trackingIdGuid  Guid used for tracking. Get this by calling `generateTrackingId(supportTopicId:string)`.
   * @returns Chat URL string. This can be an empty string if no agents are available or if the queue is not found. Always handle for empty string.
   */
  public buildChatUrl(
    cxpChatType: string,
    queueForSupportTopic: any,
    trackingIdGuid: string
  ): Observable<string> {
    return null;
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param trackingIdGuid  Guid used for tracking. Get this by calling `generateTrackingId(supportTopicId:string)`.
   * @param forceFetch Optional boolean. If set to true, will force fetch the ChatURL ignoring the one currently cached.
   * @returns Chat URL string. This can be an empty string if no agents are available or if the queue is not found. Always handle for empty string.
   */
  public getChatURL(
    supportTopicId: string,
    trackingIdGuid: string,
    forceFetch: boolean = false
  ): Observable<string> {
    return null;
  }

  /**
   * @param trackingId  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   * @param chatUrl  The chat URL that is being opened.
   * @param chatStarted Did the customer start a chat session.
   */
  public notifyChatOpened(
    trackingId: string,
    chatUrl: string,
    chatStarted: boolean
  ) {}

  /**
   * @param userAction Which button did the user click on
   * @param trackingIdGuid  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   * @param chatUrl  The chat URL that is being opened.
   */
  public logUserActionOnChat(
    userAction: string,
    trackingIdGuid: string,
    chatUrl: string
  ): void {}

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param checkType Which button did the user click on
   * @param checkOutcome  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   */
  public logChatEligibilityCheck(
    supportTopicId: string,
    checkType: string,
    checkOutcome: string
  ): void {}
}
