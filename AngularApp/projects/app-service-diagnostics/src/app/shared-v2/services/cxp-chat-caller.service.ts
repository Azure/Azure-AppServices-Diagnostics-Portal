import { Injectable } from '@angular/core';
import { flatMap } from 'rxjs/operators';
import { Observable, ReplaySubject, of } from 'rxjs';
import { PortalService } from '../../startup/services/portal.service';
import { ResourceService } from './resource.service';
import { Verbs, KeyValuePair } from '../../shared/models/portal';
import { Guid } from '../../shared/utilities/guid';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { AuthService } from '../../startup/services/auth.service';

@Injectable()
export class CXPChatCallerService {
  public isChatSupported: boolean;
  private supportedSupportTopicIds: string[];
  private supportedSapSupportTopicIds: string[];
  public configuredPesId: string = ''; // pesId as configured in the arm resource config by partners.
  public configuredSapProductId: string = ''; // sapProductId as configured in the arm resource config by partners.
  public suppliedPesId: string = ''; // pesId as supplied by case submission flow.
  public suppliedSapProductId: string = ''; // sapProductId as supplied by case submission flow.
  public readonly cxpChatTagName: string = 'webapps';
  public readonly applensUserAgentForCXPChat: string = 'applensDiagnostics';
  public supportPlanType: string = '';
  public chatLanguage: string = 'en';

  public trackingId: string = '';
  public chatUrl: string = '';
  public caseSubject: string = '';

  constructor(
    private _authService: AuthService,
    private _portalService: PortalService,
    private _telemetryService: TelemetryService,
    private _resourceService?: ResourceService
  ) {
    this.isChatSupported = this._resourceService.isApplicableForLiveChat;
    if (this.isChatSupported) {
      this.supportedSupportTopicIds =
        this._resourceService.liveChatEnabledSupportTopicIds;
      this.supportedSapSupportTopicIds =
        this._resourceService.liveChatEnabledSapSupportTopicIds;
    }

    this._authService.getStartupInfo().subscribe((startupInfo) => {
      if (!!startupInfo) {
        if (
          !!startupInfo.effectiveLocale &&
          startupInfo.effectiveLocale.length > 0
        ) {
          this.chatLanguage = startupInfo.effectiveLocale;
        }

        if (!!startupInfo.pesId && !isNaN(Number(startupInfo.pesId))) {
          this.suppliedPesId = startupInfo.pesId;
        }

        if (
          !!startupInfo.sapProductId &&
          isNaN(Number(startupInfo.sapProductId))
        ) {
          this.suppliedSapProductId = startupInfo.sapProductId;
        }

        if (
          !!startupInfo.optionalParameters &&
          Array.isArray(startupInfo.optionalParameters)
        ) {
          var caseSubjectParam = startupInfo.optionalParameters.find(
            (param) => param.key === 'caseSubject'
          );
          if (!!caseSubjectParam) {
            this.caseSubject = caseSubjectParam.value;
          }

          var cxSupportPlanType = startupInfo.optionalParameters.find(
            (param) => param.key === 'supportPlans'
          );
          if (!!cxSupportPlanType) {
            this.supportPlanType = cxSupportPlanType.value.supportPlanType;
          }
        }
      }
    });

    this._resourceService.getPesId().subscribe((pesId) => {
      if (isNaN(Number(pesId))) {
        this.configuredPesId = pesId;
      }
    });

    this._resourceService.getSapProductId().subscribe((sapProductId) => {
      if (!isNaN(Number(sapProductId))) {
        this.configuredSapProductId = sapProductId;
      }
    });
  }

  public isSupportTopicEnabledForLiveChat(
    supportTopicIdToCheck: string
  ): boolean {
    if (!supportTopicIdToCheck) {
      return false;
    }

    //We always assume that a support topic is enabled for CXP chat as long as we have a valid support topic.
    //Chat can be disabled specifically within the CXP system.
    return true;
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @returns a Guid that can be used as a tracking id.
   */
  public generateTrackingId(supportTopicId: string): string {
    let generatedGuid: string = '';
    try {
      generatedGuid = Guid.newGuid();
      return generatedGuid;
    } catch (error) {
      this.logChatEligibilityCheck(
        supportTopicId,
        'GenerateCXPChatTrackingId',
        `Error while generating tracking ID : ${JSON.stringify(error)}`
      );
      return '';
    }
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param trackingIdGuid  Guid used for tracking. Get this by calling `generateTrackingId(supportTopicId:string)`.
   * @returns CXP Chat type. If no engineer is available, it will return None, else it will return the type of chat that can be initiated for this support topic.
   */
  public getChatAvailability(
    supportTopicId: string,
    trackingIdGuid: string
  ): ReplaySubject<any> {
    let input = {
      tagName: this.cxpChatTagName,
      eligibilityParams: {
        productId: this.getEffectiveProductId(),
        supportPlanType: this.supportPlanType,
        supportTopicId: supportTopicId,
        language: this.chatLanguage,
        subscriptionId: this._resourceService.subscriptionId
      },
      additionalInfo: {
        resourceId: this._resourceService.resource.id,
        subscriptionId: this._resourceService.subscriptionId
      },
      callerName: this.applensUserAgentForCXPChat,
      trackingId: trackingIdGuid,
      params: {}
    };

    this._portalService.postMessage(
      Verbs.getChatAvailability,
      JSON.stringify(input)
    );

    //Wait for the response from the CXP chat API call.
    return this._portalService.getChatAvailability();
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
    let input = {
      chatAvailability: {
        chatType: cxpChatType,
        queue: queueForSupportTopic
      },
      trackingId: trackingIdGuid,
      callerName: this.applensUserAgentForCXPChat,
      additionalInfo: {}
    };

    if (this.chatUrl.length > 0 && this.trackingId.length > 0) {
      let stringToLog = `No call made, result from service cache. ChatUrl: ${this.chatUrl}`;
      this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
        cxpChatTrackingId: this.trackingId,
        passedInput: JSON.stringify(input),
        returnValue: stringToLog
      });

      return of(this.chatUrl);
    } else {
      this._portalService.postMessage(
        Verbs.buildChatUrl,
        JSON.stringify(input)
      );

      //Wait for the response from the CXP chat API call.
      return this._portalService.buildChatUrl().pipe(
        flatMap((chatUrl) => {
          let stringToLog = '';
          let returnValue = '';
          if (chatUrl && chatUrl != '') {
            this.chatUrl = chatUrl;
            this.trackingId = trackingIdGuid;
            stringToLog = chatUrl;
            returnValue = chatUrl;
          } else {
            if (chatUrl === '') {
              stringToLog =
                'Empty URL returned. Likely cause, no engineer available.';
            } else {
              stringToLog =
                'NULL object returned. Likely cause, unknown. Followup with CXP team with trackingId.';
            }
          }

          this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
            cxpChatTrackingId: trackingIdGuid,
            passedInput: JSON.stringify(input),
            returnValue: stringToLog
          });
          return of(returnValue);
        })
      );
    }
  }

  private getEffectiveProductId(): string {
    if (this.suppliedSapProductId) {
      return this.suppliedSapProductId;
    } else {
      if (this.configuredSapProductId) {
        return this.configuredSapProductId;
      } else {
        if (this.suppliedPesId) {
          return this.suppliedPesId;
        } else {
          return this.configuredPesId;
        }
      }
    }
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
    let input = {
      tagName: this.cxpChatTagName,
      eligibilityParams: {
        productId: this.getEffectiveProductId(),
        supportTopicId: supportTopicId,
        language: this.chatLanguage,
        subscriptionId: this._resourceService.subscriptionId
      },
      additionalInfo: {
        resourceId: this._resourceService.resource.id,
        subscriptionId: this._resourceService.subscriptionId
      },
      callerName: this.applensUserAgentForCXPChat,
      trackingId: trackingIdGuid,
      createTicket: true,
      ticketInformation: {
        subscriptionId: this._resourceService.subscriptionId,
        productId: this.getEffectiveProductId(),
        supportTopicId: supportTopicId,
        title: this.caseSubject,
        resourceId: this._resourceService.resource.id
      }
    };

    if (
      this.chatUrl.length > 0 &&
      this.trackingId.length > 0 &&
      forceFetch == false
    ) {
      let stringToLog = `No call made, result from service cache. ChatUrl: ${this.chatUrl}`;
      this._telemetryService.logEvent(TelemetryEventNames.BuildCXPChatUrl, {
        cxpChatTrackingId: this.trackingId,
        passedInput: JSON.stringify(input),
        returnValue: stringToLog
      });

      return of(this.chatUrl);
    } else {
      let forceFetchReasonStr: string = '';
      if (forceFetch) {
        forceFetchReasonStr = ' Force Fetch attribute was set for this call.';
      }
      if (this.chatUrl.length > 0) {
        forceFetchReasonStr = `${forceFetchReasonStr} Current chat URL before this call is ${this.chatUrl}.`;
      }

      if (this.trackingId.length > 0) {
        forceFetchReasonStr = `${forceFetchReasonStr} Current tracking id before this call is ${this.trackingId}.`;
      }

      //Make a call to the CXP Chat API to get the URL, the call is piped via SCI Frame blade in the portal.
      try {
        this._portalService.postMessage(
          Verbs.getChatUrl,
          JSON.stringify(input)
        );
      } catch (error) {
        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          cxpChatTrackingId: trackingIdGuid,
          passedInput: JSON.stringify(input),
          returnValue: `Error while sending a call to CXP chat portal RPC API. ${JSON.stringify(
            error
          )}`
        });
      }

      //Wait for the response from the CXP chat API call.
      try {
        return this._portalService.getChatUrl().pipe(
          flatMap((chatUrl) => {
            let stringToLog = '';
            let returnValue = '';

            if (chatUrl && chatUrl != '') {
              this.chatUrl = chatUrl;
              this.trackingId = trackingIdGuid;
              stringToLog = chatUrl;
              returnValue = chatUrl;
            } else {
              if (chatUrl === '') {
                stringToLog =
                  'Empty URL returned. Likely cause, no engineer available.';
              } else {
                stringToLog =
                  'NULL object returned. Likely cause, unknown. Followup with CXP team with trackingId.';
              }
            }
            return of(returnValue);
          })
        );
      } catch (error) {
        this._telemetryService.logEvent(TelemetryEventNames.GetCXPChatURL, {
          cxpChatTrackingId: trackingIdGuid,
          passedInput: JSON.stringify(input),
          returnValue: `Error in Chat portal RPC API response. ${JSON.stringify(
            error
          )}`
        });
        return of('');
      }
    }
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
  ) {
    let chatOpenedNotificationContract = {
      key: 'ChatEngagementState',
      value: {
        hasChatted: chatStarted,
        chatUrl: chatUrl
      }
    } as KeyValuePair;

    this._portalService
      .setBladeReturnValue(chatOpenedNotificationContract)
      .subscribe((returnValue: any) => {
        if (returnValue.returnValueSet) {
          this.logUserActionOnChat(
            'CXPChatStartedStatusSendToIbizaComplete',
            trackingId,
            chatUrl
          );
        } else {
          const notificationSetError = {
            cxpChatTrackingId: trackingId,
            userAction: 'CXPChatStartedStatusSendToIbizaFailed',
            chatUrl: chatUrl,
            failueReason: returnValue.reason,
            dataSentByIFrame: JSON.stringify(chatOpenedNotificationContract),
            returnedDataFromIbiza: returnValue.data
          };

          this._telemetryService.logEvent(
            TelemetryEventNames.CXPChatUserAction,
            notificationSetError
          );
        }
      });
  }

  /**
   * @param userAction Which button did the user click on
   * @param trackingIdGuid  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   * @param chatUrl  The chat URL that is being opened.
   */
  public logUserActionOnChat(
    userAction: string,
    trackingIdGuid: string,
    chatUrl: string
  ): void {
    let notificationMessage = {
      cxpChatTrackingId: trackingIdGuid,
      userAction: userAction,
      chatUrl: chatUrl
    };

    this._telemetryService.logEvent(
      TelemetryEventNames.CXPChatUserAction,
      notificationMessage
    );
  }

  /**
   * @param supportTopicId  Support Topic id for which the chat is being initiated for.
   * @param checkType Which button did the user click on
   * @param checkOutcome  Guid used for tracking. This is the trackingId for which the Chat was initiated.
   */
  public logChatEligibilityCheck(
    supportTopicId: string,
    checkType: string,
    checkOutcome: string
  ): void {
    //Currently CXP chat is enabled only in case submission so the logging should work inly in case submission
    //To reduce telemetry noise, log only if we have a non empty support topic id. Support topic id will be empty for non case submission scenarios.
    if (!!supportTopicId && supportTopicId.length > 1) {
      let notificationMessage = {
        checkType: checkType,
        checkOutcome: checkOutcome
      };

      this._telemetryService.logEvent(
        TelemetryEventNames.CXPChatEligibilityCheck,
        notificationMessage
      );
    }
  }
}
