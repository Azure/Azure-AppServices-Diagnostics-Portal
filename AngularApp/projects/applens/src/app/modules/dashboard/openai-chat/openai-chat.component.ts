import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ChatMessage, MessageStatus, MessageSource, MessageRenderingType, UserFeedbackType, 
        TextModels, OpenAIAPIResponse, CreateTextCompletionModel,
        ChatGPTContextService} from "diagnostic-data";
import { v4 as uuid } from 'uuid';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../services/user-setting.service';
import { ResourceProviderMessages, UserChatGPTSetting } from '../../../shared/models/user-setting';
import { ResourceService } from '../../../shared/services/resource.service';
import { openAIChatQueries } from '../../../shared/models/openai-chat-samples';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';

@Component({
    selector: 'openai-chat',
    templateUrl: './openai-chat.component.html',
    styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit {

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: ApplensOpenAIChatService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    public _chatContextService: ChatGPTContextService,
    private _userSettingService: UserSettingService,
    private _resourceService: ResourceService,
    private _telemetryService: TelemetryService) {
  }

  userAlias: string = '';
  userChatGPTSetting: UserChatGPTSetting;
  showMessageQuotaError: boolean = false;
  showMessageQuotaWarning: boolean = false;
  showDataDisclaimer: boolean = true;
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  originalResourceProvider: string;
  currentResourceProvider: string;
  chatGPTRequestError: string = '';
  showChatGPTRequestError: boolean = false;
    
  ngOnInit() {
    this.originalResourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    if (this.originalResourceProvider === 'microsoft.web/sites') {
      this.currentResourceProvider = `${this.originalResourceProvider}${this._resourceService.displayName}`;
    }
    else {
      this.currentResourceProvider = this.originalResourceProvider;
    }
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent(TelemetryEventNames.ChatGPTLoaded, { "resourceProvider": this.currentResourceProvider, ts: new Date().getTime().toString()});
      }
    });
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this.userAlias = userId;
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this._chatContextService.userPhotoSource = image;
    });

    if (this._adalService.userInfo.profile) {
      const familyName: string = this._adalService.userInfo.profile.family_name;
      const givenName: string = this._adalService.userInfo.profile.given_name;
      this._chatContextService.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
    }

    this._userSettingService.getUserSetting(true, true).subscribe((settings) => {
      this.userChatGPTSetting = settings.userChatGPTSetting && settings.userChatGPTSetting.length>0? JSON.parse(settings.userChatGPTSetting): {
        allMessages: [],
        messageDailyCount: 0
      };
      if (this.userChatGPTSetting && this.userChatGPTSetting.allMessages && this.userChatGPTSetting.allMessages.length > 0) {
        this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.
                                  messages.forEach((m: ChatMessage) => {m.messageDisplayDate = this.displayMessageDate(new Date(m.timestamp));});
        this._chatContextService.messages = this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.messages??[];
      }
      this.scrollToBottom(true);
      this._telemetryService.logEvent(TelemetryEventNames.ChatGPTUserSettingLoaded, { userId: this.userAlias, ts: new Date().getTime().toString()});
      
      this.checkMessageCount();
    });
  }

  logUserFeedback(messageId: string, feedbackType: UserFeedbackType){
    var msgObj = this._chatContextService.messages.find(m => m.id == messageId);
    if (msgObj) {
      msgObj.userFeedback = feedbackType;
    };
    if (feedbackType == 'like') {
      this._telemetryService.logEvent(TelemetryEventNames.ChatGPTUserFeedbackLike, { userId: this.userAlias, messageId: messageId, messageText: msgObj.message, ts: new Date().getTime().toString()});
    }
    else {
      this._telemetryService.logEvent(TelemetryEventNames.ChatGPTUserFeedbackDislike, { userId: this.userAlias, messageId: messageId, messageText: msgObj.message, ts: new Date().getTime().toString()});
    }
    this.saveUserSetting();
  }

  checkSameDay(dayts){
    var today = new Date().setHours(0, 0, 0, 0);
    var thatDay = new Date(dayts).setHours(0, 0, 0, 0);
    return today === thatDay;
  }

  displayMessageDate(timestamp){
    return timestamp.getHours() + ":" + timestamp.getMinutes() + "   " + (timestamp.getMonth()+1) + "/" + timestamp.getDate() + "/" + timestamp.getFullYear();
  }

  checkMessageCount(){
    try {
      if (this.userChatGPTSetting && this.userChatGPTSetting.allMessages && this.userChatGPTSetting.allMessages.length > 0) {
        this.userChatGPTSetting.messageDailyCount = this.userChatGPTSetting.allMessages.
                                                        map((rm: ResourceProviderMessages) => rm.messages.filter((m: ChatMessage) => m.messageSource == MessageSource.User && this.checkSameDay(m.timestamp)).length).
                                                        reduce((partialSum, a) => partialSum + a, 0);
        if (this.userChatGPTSetting.messageDailyCount > this.dailyMessageQuota) {
          this._telemetryService.logEvent(TelemetryEventNames.ChatGPTUserQuotaExceeded, { userId: this.userAlias, messageCount: this.userChatGPTSetting.messageDailyCount.toString(), quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString()});
          this._chatContextService.chatInputBoxDisabled = true;
          this.showMessageQuotaError = true;
          this.showMessageQuotaWarning = false;
          return false;
        }
        else if (this.userChatGPTSetting.messageDailyCount >= this.dailyMessageQuota - this.messageQuotaWarningThreshold) {
          this.showMessageQuotaWarning = true;
          this.showMessageQuotaError = false;
        }
      }
      return true;
    }
    catch (e) {
      this._telemetryService.logException(e, TelemetryEventNames.ChatGPTCheckMessageCount, { userId: this.userAlias, messageCount: this.userChatGPTSetting.toString(), quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString()});
      return true;
    }
  }

  saveUserSetting() {
    let idx = this.userChatGPTSetting.allMessages.findIndex(t => t.resourceProvider == this.currentResourceProvider);
    if (idx >= 0) {
      this.userChatGPTSetting.allMessages[idx].messages = this._chatContextService.messages;
    }
    else {
      this.userChatGPTSetting.allMessages.push({resourceProvider: this.currentResourceProvider, messages: this._chatContextService.messages});
    }
    this.userChatGPTSetting.messageDailyCount = this.userChatGPTSetting.allMessages.
                                                    map((rm: ResourceProviderMessages) => rm.messages.filter((m: ChatMessage) => m.messageSource == MessageSource.User && this.checkSameDay(m.timestamp)).length).
                                                    reduce((partialSum, a) => partialSum + a, 0);
    this._userSettingService.updateUserChatGPTSetting(this.userChatGPTSetting).subscribe((settings) => {
      this.userChatGPTSetting = JSON.parse(settings.userChatGPTSetting);
    });
  }

  scrollToBottom(initial = false) {
    this.scrollToBottomOfChatContainer(initial? 2000: 200);
  }

  scrollToBottomOfChatContainer(timeout=200){
    setTimeout(() => {
        var element = document.getElementById("chatgpt-all-messages-container-id");
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      }, timeout);
  }

  resetChatGPTRequestError(){
    this.showChatGPTRequestError = false;
    this.chatGPTRequestError = '';
  }

  displayChatGPTRequestError(errorMessage){
    this.showChatGPTRequestError = true;
    this.chatGPTRequestError = errorMessage;
    setTimeout(() => {
      this.resetChatGPTRequestError();
    }, 5000);
  }

  /**ChatGPT section */
  fetchOpenAIResult(searchQuery: string, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = true) {
    this.resetChatGPTRequestError();
    this._chatContextService.chatInputBoxDisabled = true;
    try {
      let openAIQueryModel = CreateTextCompletionModel(searchQuery);
      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting: messageObj.status;
      this._openAIService.generateTextCompletion(openAIQueryModel, true).subscribe((res: OpenAIAPIResponse) => {
          var result = res?.choices[0].text;
          //Trim any newline character at the beginning of the result
          messageObj.message = messageObj.message + (trimnewline? result.trim(): result.trimEnd());
          
          //Check finishing criteria
          if (res.usage.completion_tokens == openAIQueryModel.max_tokens) {
            //Will need some additional criteria here to check if the response is complete
            messageObj.status = MessageStatus.InProgress;
            
            //Do not trim newline for the next query
            this.fetchOpenAIResult(this.prepareChatContext(), messageObj, retry, trimnewline=false);
            this.scrollToBottom();
          }
          else {
            messageObj.status = MessageStatus.Finished;
            messageObj.timestamp = new Date().getTime();
            messageObj.messageDisplayDate = this.displayMessageDate(new Date());

            this.saveUserSetting();
            this.chatgptSearchText = "";
            this._chatContextService.chatInputBoxDisabled = false;
            this.scrollToBottom();
            setTimeout(() => {
              document.getElementById(`chatGPTInputBox`).focus();
            }, 200);
          }
      },
      (err) => {
          if (retry) {
              this.fetchOpenAIResult(searchQuery, messageObj, retry=false);
          }
          this.handleFailure(err, messageObj);
      });
    }
    catch (error) {
      this.handleFailure(error, messageObj);
    }
  }

  handleFailure(err, messageObj) {
    if (err.status && err.status == 429) {
      this._telemetryService.logEvent(TelemetryEventNames.ChatGPTTooManyRequestsError, { ...err, ts: new Date().getTime().toString()});
      this.displayChatGPTRequestError("Ah! Too many people asking me questions! Please try again in sometime.");
    }
    else {
      this._telemetryService.logEvent(TelemetryEventNames.ChatGPTRequestError, { ...err, ts: new Date().getTime().toString()});
      this.displayChatGPTRequestError("Me and AppLens are on a talking freeze it seems. Lets try again later.");
    }
    messageObj.status = MessageStatus.Finished;
    messageObj.timestamp = new Date().getTime();
    messageObj.messageDisplayDate = this.displayMessageDate(new Date());
    this.chatgptSearchText = "";
    this._chatContextService.chatInputBoxDisabled = false;
    this.scrollToBottom();
    document.getElementById("chatGPTInputBox").focus();
  }

  chatgptSearchText: string = "";
  chatQuerySamples = openAIChatQueries;

  prepareChatContext(){
    //Take last 10 messages to build context
    return this._chatContextService.messages.slice(-10).map(x => `${x.messageSource}: ${x.message}`).join('\n');
  }

  onchatSampleClick(idx: number){
    this._telemetryService.logEvent(TelemetryEventNames.ChatGPTSampleClicked, { userId: this.userAlias, idx: idx.toString(), clickedSample: this.chatQuerySamples[idx].key, ts: new Date().getTime().toString() });
    this.chatgptSearchText = this.chatQuerySamples[idx].value;
    this.triggerChat();
  }

  triggerChat(){
    this.chatgptSearchText = this.chatgptSearchText.trimEnd();
    if (this.checkMessageCount()) {
      this._chatContextService.messages.push({
        id: uuid(),
        message: this.chatgptSearchText,
        messageSource: MessageSource.User,
        timestamp: new Date().getTime(),
        messageDisplayDate: this.displayMessageDate(new Date()),
        status: MessageStatus.Finished,
        userFeedback: UserFeedbackType.None,
        renderingType: MessageRenderingType.Text
      });
      this._chatContextService.chatInputBoxDisabled = true;
      let chatMessage = {
        id: uuid(),
        message: "",
        messageSource: MessageSource.System,
        timestamp: new Date().getTime(),
        messageDisplayDate: this.displayMessageDate(new Date()),
        status: MessageStatus.Created,
        userFeedback: UserFeedbackType.None,
        renderingType: MessageRenderingType.Text
      };
      this._chatContextService.messages.push(chatMessage);
      this.scrollToBottom();
      this.fetchOpenAIResult(this.prepareChatContext(), chatMessage);
    }
  }
  /** */
}  
