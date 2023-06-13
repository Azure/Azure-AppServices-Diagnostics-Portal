import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  // Models 
  ChatMessage, MessageStatus, MessageSource, MessageRenderingType, TextModels, OpenAIAPIResponse, CreateTextCompletionModel,
  // Services
  ChatUIContextService, GenericOpenAIChatService,
  // Telemetry
  TelemetryService, TelemetryEventNames,
  // Components
  ChatUIComponent,
  // Utilities
  TimeUtilities,
  ChatAlignment,
  StringUtilities

} from "../../../public_api";
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { KeyValuePair } from '../../models/common-models';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'openai-chat',
  templateUrl: './openai-chat.component.html',
  styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit {
  @ViewChild('chatUIComponent') chatUIComponentRef: ChatUIComponent;

  @Input() customInitialPrompt: string = '';
  @Input() customFirstMessage: string = '';
  @Input() userId: string = '';
  @Input() userNameInitial: string = '';
  @Input() userPhotoSource: string = '';
  @Input() systemNameInitial: string = 'AI';
  @Input() systemPhotoSource: string = '/assets/img/openailogo.svg';
  @Input() persistChat: boolean = false;
  @Input() chatIdentifier: string = '';
  @Input() chatHeader: string = '';
  @Input() chatContextLength: number = 2;
  @Input() chatQuerySamplesFileUri: string = ''; //e.g. "assets/chatConfigs/chatQuerySamples.json"
  @Input() fetchChat: Function;
  @Input() saveChat: Function;
  @Input() chatAlignment: ChatAlignment = ChatAlignment.Center;

  // Callback methods for pre and post processing messages
  @Input() preprocessUserMessage: (message: ChatMessage) => ChatMessage = function (message: ChatMessage) {
    return message;
  };

  @Input() postProcessSystemMessage: (message: ChatMessage) => ChatMessage;

  // Variables that can be taken as input
  @Input() showFeedbackOptions: boolean = true;
  @Input() showContentDisclaimer: boolean = true;
  @Input() contentDisclaimerMessage: string = "";

  @Input() quotaEnforced: boolean = false;
  @Input() dailyMessageQuota: number = 20;
  @Input() messageQuotaWarningThreshold: number = 10;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: GenericOpenAIChatService,
    public _chatContextService: ChatUIContextService,
    private _telemetryService: TelemetryService,
    private http: HttpClient) {
  }

  // Variables to be passed down to the chat UI component
  openAIChatRequestError: string = '';
  showChatRequestError: boolean = false;
  showMessageQuotaError: boolean = false;
  messageQuotaErrorMessage: string = '';
  showMessageQuotaWarning: boolean = false;
  messageQuotaWarningMessage: string = '';

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  openaiChatSearchText: string = "";
  chatQuerySamples: KeyValuePair[] = [];

  ngOnInit() {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      if (this.isEnabled) {
        if (this.chatQuerySamplesFileUri && this.chatQuerySamplesFileUri.length > 0) {
          this.http.get<any>(this.chatQuerySamplesFileUri).subscribe((data: KeyValuePair[]) => { this.chatQuerySamples = data; this.isEnabledChecked = true; },
            (err) => {
              this._telemetryService.logEvent("OpenAIChatQuerySamplesFileLoadError", { "chatQuerySamplesFileUri": this.chatQuerySamplesFileUri, userId: this.userId, ts: new Date().getTime().toString() });
            });
        }
      }
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent("OpenAIChatComponentLoaded", { "chatIdentifier": this.chatIdentifier, userId: this.userId, ts: new Date().getTime().toString() });
      }
    });

    this.loadChatFromStore(); // Works only if persistChat is true
  }
  
  populateCustomFirstMessage() {
      if (this.customFirstMessage && this.customFirstMessage.length > 0){
        let message = {
            id: uuid(),
            displayMessage: this.customFirstMessage,
            message: this.customFirstMessage,
            messageSource: MessageSource.User,
            timestamp: new Date().getTime(),
            messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
            status: MessageStatus.Finished,
            userFeedback: "none",
            renderingType: MessageRenderingType.Text
        };
        this.onUserSendMessage(message);
      }
  }

  loadChatFromStore() {
    if (this.persistChat && this.fetchChat) {
      this.fetchChat(this.chatIdentifier).subscribe((chatMessages: ChatMessage[]) => {
        this._chatContextService.messageStore[this.chatIdentifier] = chatMessages;
        this.chatUIComponentRef.scrollToBottom(true);
        this._telemetryService.logEvent("OpenAIChatLoadedFromStore", { userId: this.userId, ts: new Date().getTime().toString() });

        this.checkQuota();
        this.populateCustomFirstMessage();
      });
    }
    else {
      if (!this._chatContextService.messageStore.hasOwnProperty(this.chatIdentifier)) {
        this._chatContextService.messageStore[this.chatIdentifier] = [];
      }
      this.populateCustomFirstMessage();
    }
  }

  saveChatToStore() {
    if (this.persistChat && this.saveChat) {
      this.saveChat(this.chatIdentifier, this._chatContextService.messageStore[this.chatIdentifier]).subscribe((res) => { });
    }
  }

  logUserFeedback = (messageId: string, feedbackType: string) => {
    var msgObj = this._chatContextService.messageStore[this.chatIdentifier].find(m => m.id == messageId);
    if (msgObj == undefined) {
      return;
    }
    else {
      msgObj.userFeedback = feedbackType;
    }

    if (feedbackType == 'like') {
      this._telemetryService.logEvent("OpenAIChatUserFeedbackLike", { chatIdentifier: this.chatIdentifier, userId: this.userId, messageId: messageId, messageText: msgObj.displayMessage, ts: new Date().getTime().toString() });
    }
    else {
      this._telemetryService.logEvent("OpenAIChatUserFeedbackDislike", { chatIdentifier: this.chatIdentifier, userId: this.userId, messageId: messageId, messageText: msgObj.displayMessage, ts: new Date().getTime().toString() });
    }
    this.saveChatToStore();
  }

  checkQuota() {
    if (!this.quotaEnforced) {
      return true;
    }
    try {
      if (this._chatContextService.messageStore[this.chatIdentifier] && this._chatContextService.messageStore[this.chatIdentifier].length > 0) {
        let messageDailyCount = this._chatContextService.messageStore[this.chatIdentifier]
          .filter((m: ChatMessage) => m.messageSource == MessageSource.User && TimeUtilities.checkSameDay(m.timestamp)).length;
        if (messageDailyCount > this.dailyMessageQuota) {
          this._telemetryService.logEvent("OpenAIChatMessageQuotaExceeded", { userId: this.userId, messageCount: messageDailyCount.toString(), quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString() });
          this._chatContextService.chatInputBoxDisabled = true;
          this.showMessageQuotaError = true;
          this.messageQuotaErrorMessage = `You have exhausted your daily quota of ${this.dailyMessageQuota} messages. We are working on increasing the quota capacity.`
          this.showMessageQuotaWarning = false;
          this.messageQuotaWarningMessage = '';
          return false;
        }
        else if (messageDailyCount >= this.dailyMessageQuota - this.messageQuotaWarningThreshold) {
          this.showMessageQuotaWarning = true;
          this.messageQuotaErrorMessage = '';
          this.messageQuotaWarningMessage = `You have used ${messageDailyCount} out of the daily quota limit of ${this.dailyMessageQuota} messages.`;
          this.showMessageQuotaError = false;
        }
      }
      return true;
    }
    catch (e) {
      this._telemetryService.logException(e, "OpenAIChatCheckQuota", { chatIdentifier: this.chatIdentifier, userId: this.userId, quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString() });
      return true;
    }
  }

  resetChatRequestError() {
    this.showChatRequestError = false;
    this.openAIChatRequestError = '';
  }

  displayChatRequestError(errorMessage) {
    this.showChatRequestError = true;
    this.openAIChatRequestError = errorMessage;

    // Hide the error message after 5 seconds
    setTimeout(() => {
      this.resetChatRequestError();
    }, 5000);
  }

  /**Chat Message Request section */
  fetchOpenAIResult(searchQuery: string, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = true) {
    this.resetChatRequestError();
    this._chatContextService.chatInputBoxDisabled = true;
    try {
      let openAIQueryModel = CreateTextCompletionModel(searchQuery);
      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;
      this._openAIService.generateTextCompletion(openAIQueryModel, this.customInitialPrompt, true).subscribe((res: OpenAIAPIResponse) => {
        var result = res?.choices[0];

        if (this.postProcessSystemMessage == undefined) {
          messageObj.displayMessage = messageObj.displayMessage + (trimnewline ? StringUtilities.TrimBoth(result.text) : StringUtilities.TrimEnd(result.text));
        }

        messageObj.message = messageObj.message + (trimnewline ? StringUtilities.TrimBoth(result.text) : StringUtilities.TrimEnd(result.text));

        // Check if the response is truncated
        if (result.finish_reason == "length") {
          messageObj.status = MessageStatus.InProgress;

          //Do not trim newline for the next query
          this.fetchOpenAIResult(this.prepareChatContext(), messageObj, retry, trimnewline = false);
          this.chatUIComponentRef.scrollToBottom();
        }

        else {

          if (this.postProcessSystemMessage != undefined) {
            messageObj = this.postProcessSystemMessage(messageObj);
          }

          messageObj.status = MessageStatus.Finished;
          messageObj.timestamp = new Date().getTime();
          messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());

          this.openaiChatSearchText = "";
          this._chatContextService.chatInputBoxDisabled = false;
          this.chatUIComponentRef.scrollToBottom();
          this.chatUIComponentRef.focusChatInput();

          if (this.persistChat) {
            this.saveChatToStore();
          }
        }
      },
        (err) => {
          if (err.status && err.status == 400) {
            //Sometimes the chat context may become too long for the API to handle. In that case, we reduce the chat context length by 2 and retry
            this._telemetryService.logEvent("OpenAIChatBadRequestError", { ...err, userId: this.userId, ts: new Date().getTime().toString() });
            this.chatContextLength = this.chatContextLength - 2 >= 0? this.chatContextLength - 2 : 0;
            this.fetchOpenAIResult(searchQuery, messageObj, retry = false);
          }
          else if (retry) {
            this.fetchOpenAIResult(searchQuery, messageObj, retry = false);
          }
          else {
            this.handleFailure(err, messageObj);
          }
        });
    }
    catch (error) {
      this.handleFailure(error, messageObj);
    }
  }

  handleFailure(err, messageObj) {
    if (err.status && err.status == 429) {
      this._telemetryService.logEvent("OpenAIChatTooManyRequestsError", { ...err, userId: this.userId, ts: new Date().getTime().toString() });
      this.displayChatRequestError("Ah! Too many people asking me questions! Please try again in sometime.");
    }
    else {
      this._telemetryService.logEvent("OpenAIChatRequestError", { ...err, userId: this.userId, ts: new Date().getTime().toString() });
      this.displayChatRequestError("Me and AppLens are on a talking freeze it seems. Lets try again later.");
    }
    messageObj.status = MessageStatus.Finished;
    messageObj.timestamp = new Date().getTime();
    messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
    this.openaiChatSearchText = "";
    this._chatContextService.chatInputBoxDisabled = false;
    this.chatUIComponentRef.scrollToBottom();
    this.chatUIComponentRef.focusChatInput();
  }

  prepareChatContext() {

    //Take last 'chatContextLength' messages to build context
    var context = this._chatContextService.messageStore[this.chatIdentifier].slice(-1 * this.chatContextLength).map((x: ChatMessage, index: number) => {
      if (index >= this._chatContextService.messageStore[this.chatIdentifier].length - 2) {
        return `${x.messageSource}: ${x.message}`;
      }
      return `${x.messageSource}: ${x.displayMessage}`;
    }).join('\n');
    return context;
  }

  onUserSendMessage = (messageObj: ChatMessage) => {

    // Invoke Pre-processing callback for message
    messageObj = this.preprocessUserMessage(messageObj);

    this.openaiChatSearchText = messageObj.message;
    if (this.checkQuota()) {

      this._chatContextService.messageStore[this.chatIdentifier].push(messageObj);
      this._telemetryService.logEvent("OpenAIChatUserMessageSent", { message: messageObj.message, userId: this.userId, ts: new Date().getTime().toString() });
      this._chatContextService.chatInputBoxDisabled = true;
      let chatMessage = {
        id: uuid(),
        message: "",
        displayMessage: "",
        messageSource: MessageSource.System,
        timestamp: new Date().getTime(),
        messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
        status: MessageStatus.Created,
        userFeedback: "none",
        renderingType: MessageRenderingType.Text
      };
      this._chatContextService.messageStore[this.chatIdentifier].push(chatMessage);
      //Add a little timeout here to wait for the child component to initialize well
      setTimeout(() => {this.chatUIComponentRef.scrollToBottom();}, 200);
      this.fetchOpenAIResult(this.prepareChatContext(), chatMessage);
    }
  }
}  
