import { Component, OnInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  // Models 
  ChatMessage, ChatResponse, MessageStatus, MessageSource, MessageRenderingType, CreateTextCompletionModel,
  // Services
  ChatUIContextService, GenericOpenAIChatService,
  // Telemetry
  TelemetryService,
  // Components
  ChatUIComponent,
  // Utilities
  TimeUtilities,
  ChatAlignment,
  StringUtilities,
  ChatModel,
  CreateChatCompletionModel,
  ResponseTokensSize,
  TextModels,
  APIProtocol,
  FeedbackOptions

} from "../../../public_api";
import { v4 as uuid } from 'uuid';
import { HttpClient } from '@angular/common/http';
import { KeyValuePair } from '../../models/common-models';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'openai-chat',
  templateUrl: './openai-chat.component.html',
  styleUrls: ['./openai-chat.component.scss']
})

export class OpenAIChatComponent implements OnInit, OnChanges {
  @ViewChild('chatUIComponent') chatUIComponentRef: ChatUIComponent;

  @Input() customInitialPrompt: string = '';
  @Input() customFirstMessage: string = '';
  @Input() chatIdentifier: string = '';
  @Input() persistChat: boolean = false;
  @Input() chatHeader: string = '';
  @Input() chatContextLength: number = 2;
  @Input() chatQuerySamplesFileUri: string = ''; //e.g. "assets/chatConfigs/chatQuerySamples.json"
  @Input() fetchChat: Function;
  @Input() saveChat: Function;
  @Input() chatAlignment: ChatAlignment = ChatAlignment.Center;
  @Input() chatModel: ChatModel = ChatModel.GPT3;
  @Input() responseTokenSize: ResponseTokensSize = ResponseTokensSize.Small;
  @Input() stopMessageGeneration: boolean = false;
  @Input() systemInitial: string = "AI";
  @Input() systemPhotoSource: string = '/assets/img/openailogo.svg';
  @Input() showCopyOption: boolean = false;
  @Input() apiProtocol: APIProtocol = APIProtocol.Rest;
  @Input() inputTextLimit: Number = 500;
  @Input() autoAddResourceSpecificInfoToChatMessages:boolean = true;
  @Input() chatContainerHeight: string  = ''; 

  // Callback methods for pre and post processing messages
  @Input() preprocessUserMessage: (message: ChatMessage) => ChatMessage = function (message: ChatMessage) {
    return message;
  };
  @Input() postProcessSystemMessage: (message: ChatMessage) => ChatMessage;
  @Input() postPrepareChatContext: (context: any) => any = function (context: any) {
    return context;
  };

  @Input() onCopyClick: Function;

  // Variables that can be taken as input
  @Input() showFeedbackOptions: boolean = true;
  @Input() showContentDisclaimer: boolean = true;
  @Input() contentDisclaimerMessage: string = "";

  @Input() quotaEnforced: boolean = false;
  @Input() dailyMessageQuota: number = 20;
  @Input() messageQuotaWarningThreshold: number = 10;
  @Input() onFeedbackClicked: (chatMessage:ChatMessage, feedbackType:FeedbackOptions) => void;

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

  // This is the limit on the number of recursive calls made to open AI
  openAIApiCallLimit = 10;
  currentApiCallCount = 0;

  private openAIAPICallSubscription: Subscription;

  ngOnInit() {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      if (this.isEnabled) {

        this.loadChatQuerySamples();

        if (this.apiProtocol == APIProtocol.WebSocket) {
          this._openAIService.establishSignalRConnection().subscribe((result: boolean) => {
            this._chatContextService.chatInputBoxDisabled = !result;
          });
        }
        else {
          this._chatContextService.chatInputBoxDisabled = false;
        }

        this._telemetryService.logEvent("OpenAIChatComponentLoaded", { "chatIdentifier": this.chatIdentifier, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
      }
      this.isEnabledChecked = true;
    });

    this.loadChatFromStore(); // Works only if persistChat is true

  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['chatQuerySamplesFileUri'] != undefined && this.chatQuerySamplesFileUri) {
      this.loadChatQuerySamples();
    }

    if (changes['stopMessageGeneration'] != undefined && this.stopMessageGeneration) {
      this.onStopMessageGeneration('Message cancelled by user');
    }
  }

  populateCustomFirstMessage() {
    if (this.customFirstMessage && this.customFirstMessage.length > 0) {
      let message = {
        id: uuid(),
        displayMessage: this.customFirstMessage,
        message: this.customFirstMessage,
        messageSource: MessageSource.User,
        timestamp: new Date().getTime(),
        messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
        status: MessageStatus.Finished,
        userFeedback: FeedbackOptions.None,
        renderingType: MessageRenderingType.Text,
        feedbackDocumentIds:[]
      };
      this.onUserSendMessage(message);
    }
  }

  loadChatQuerySamples() {

    if (this.chatQuerySamplesFileUri && this.chatQuerySamplesFileUri.length > 0) {
      this.http.get<any>(this.chatQuerySamplesFileUri).subscribe((res) => {
        if (res && res.samples) {
          this.chatQuerySamples = res.samples;
        }
        this.isEnabledChecked = true;
      },
        (err) => {
          this._telemetryService.logEvent("OpenAIChatQuerySamplesFileLoadError", {chatIdentifier: this.chatIdentifier,  "chatQuerySamplesFileUri": this.chatQuerySamplesFileUri, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
        });
    }
  }

  loadChatFromStore() {
    if (this.persistChat && this.fetchChat) {
      this.fetchChat(this.chatIdentifier).subscribe((chatMessages: ChatMessage[]) => {
        this._chatContextService.messageStore[this.chatIdentifier] = chatMessages;
        this.chatUIComponentRef.scrollToBottom(true);
        this._telemetryService.logEvent("OpenAIChatLoadedFromStore", { chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });

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

  logUserFeedback = (messageId: string, feedbackType: FeedbackOptions) => {
    var msgObj = this._chatContextService.messageStore[this.chatIdentifier].find(m => m.id == messageId);
    if (msgObj == undefined) {
      return;
    }
    else {
      msgObj.userFeedback = feedbackType;
    }

    if (feedbackType == FeedbackOptions.Like) {
      this._telemetryService.logEvent("OpenAIChatUserFeedbackLike", { chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, messageId: messageId, messageText: msgObj.displayMessage, ts: new Date().getTime().toString() });
    }
    else {
      this._telemetryService.logEvent("OpenAIChatUserFeedbackDislike", { chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, messageId: messageId, messageText: msgObj.displayMessage, ts: new Date().getTime().toString() });
    }
    this.saveChatToStore();
    if(this.onFeedbackClicked) {
      this.onFeedbackClicked(msgObj, feedbackType);
    }
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
          this._telemetryService.logEvent("OpenAIChatMessageQuotaExceeded", { chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, messageCount: messageDailyCount.toString(), quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString() });
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
      this._telemetryService.logException(e, "OpenAIChatCheckQuota", { chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, quotaLimit: this.dailyMessageQuota.toString(), ts: new Date().getTime().toString() });
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

  /**Chat Message Request section using Rest Protocol */
  fetchOpenAIResultUsingRest(searchQuery: any, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = false) {

    if (this.currentApiCallCount >= this.openAIApiCallLimit) {
      this.onStopMessageGeneration(`Message cancelled by system. This message exceeded the recursive completion api call limit of ${this.openAIApiCallLimit}`);
      return;
    }

    this.currentApiCallCount++;

    if (this.stopMessageGeneration || messageObj.status == MessageStatus.Cancelled)
      return;

    this.resetChatRequestError();
    this._chatContextService.chatInputBoxDisabled = true;

    let openAIAPICall: Observable<ChatResponse> = new Observable();

    try {

      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;

      if (this.chatModel == ChatModel.GPT3) {
        let openAIQueryModel = CreateTextCompletionModel(searchQuery, TextModels.Default, this.responseTokenSize);
        openAIAPICall = this._openAIService.generateTextCompletion(openAIQueryModel, this.customInitialPrompt, true);
      }
      else {
        let chatCompletionQueryModel = CreateChatCompletionModel(searchQuery, messageObj.id, this.chatIdentifier, this.chatModel, this.responseTokenSize);
        openAIAPICall = this._openAIService.getChatCompletion(chatCompletionQueryModel, this.customInitialPrompt, this.autoAddResourceSpecificInfoToChatMessages);
      }

      this.openAIAPICallSubscription = openAIAPICall.subscribe((response: ChatResponse) => {

        if (messageObj.status == MessageStatus.Cancelled) {
          return;
        }

        let trimmedText = this.chatModel == ChatModel.GPT3 ?
          (trimnewline ? StringUtilities.TrimBoth(response.text) : StringUtilities.TrimEnd(response.text)) :
          response.text;

        messageObj.message = StringUtilities.mergeOverlappingStrings(messageObj.message, trimmedText);
        messageObj.status = response.truncated === true ? MessageStatus.InProgress : MessageStatus.Finished;

        // Check if the ids in response.feedbackIds are already present in messageObj.feedbackDocumentIds. If not, add them to messageObj.feedbackDocumentIds
        if (response.feedbackIds && response.feedbackIds.length > 0) {
          response.feedbackIds.forEach((id) => {
            if (messageObj.feedbackDocumentIds.indexOf(id) == -1) {
              messageObj.feedbackDocumentIds.push(id);
            }
          });
        }

        if (this.postProcessSystemMessage == undefined) {
          messageObj.displayMessage = StringUtilities.mergeOverlappingStrings(messageObj.displayMessage, trimmedText);
        }
        else {
          messageObj = this.postProcessSystemMessage(messageObj);
        }

        if (response.truncated) {
          //Do not trim newline for the next query
          this.fetchOpenAIResultUsingRest(this.prepareChatContext(), messageObj, retry, trimnewline = false);
          this.chatUIComponentRef.scrollToBottom();
        }

        else {
          this.markMessageCompleted(messageObj);
          this.reenableChatBox();

          if (this.persistChat) {
            this.saveChatToStore();
          }
        }
      },
        (err) => {
          if (err.status && err.status == 400) {
            //Sometimes the chat context may become too long for the API to handle. In that case, we reduce the chat context length by 2 and retry
            this._telemetryService.logEvent("OpenAIChatBadRequestError", { ...err, chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
            this.chatContextLength = this.chatContextLength - 2 >= 0 ? this.chatContextLength - 2 : 0;
            this.fetchOpenAIResultUsingRest(searchQuery, messageObj, retry = false);
          }
          else if (retry) {
            this.fetchOpenAIResultUsingRest(searchQuery, messageObj, retry = false);
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

  fetchOpenAIResultUsingWSS(searchQuery: any, messageObj: ChatMessage) {

    this.resetChatRequestError();
    this._chatContextService.chatInputBoxDisabled = true;
    messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;

    if (this.openAIAPICallSubscription) {
      this.openAIAPICallSubscription.unsubscribe();
    }

    this.openAIAPICallSubscription = this._openAIService.onMessageReceive.subscribe(chatResponse => {

      if (messageObj.status == MessageStatus.Cancelled) {
        return;
      }

      if (chatResponse != null && chatResponse != undefined) {

        if (chatResponse.text != undefined && chatResponse.text != '') {

          messageObj.status = MessageStatus.InProgress;
          messageObj.message = `${messageObj.message}${chatResponse.text}`;

          if (this.postProcessSystemMessage == undefined) {
            messageObj.displayMessage = `${messageObj.displayMessage}${chatResponse.text}`;
          }
          else {
            messageObj = this.postProcessSystemMessage(messageObj);
          }

          this.chatUIComponentRef.scrollToBottom();
        }

        // In streaming, the finish reason would be set when the stream ends. (not for every message chunk)
        if (chatResponse.finishReason != undefined && chatResponse.finishReason != '') {

          // Check if the ids in chatResponse.feedbackIds are already present in messageObj.feedbackDocumentIds. If not, add them to messageObj.feedbackDocumentIds
          if (chatResponse.feedbackIds && chatResponse.feedbackIds.length > 0) {
            chatResponse.feedbackIds.forEach((id) => {
              if (messageObj.feedbackDocumentIds.indexOf(id) == -1) {
                messageObj.feedbackDocumentIds.push(id);
              }
            });
          }

          let finalMsgStatus = MessageStatus.Finished;

          if (chatResponse.finishReason === 'length') {
            // In streaming, the message reached token limit and system cannot continue further

            finalMsgStatus = MessageStatus.Cancelled;
            this.onStopMessageGeneration('Message cancelled by system. This message exceeded the max token limit.');
          }

          if (chatResponse.finishReason === 'cancelled') {
            // The message was cancelled by the server due to some expcetion.

            finalMsgStatus = MessageStatus.Cancelled;
            this.onStopMessageGeneration(`Message cancelled by system. Reason :${chatResponse.exception}`);
          }

          messageObj.status = finalMsgStatus;

          if (this.postProcessSystemMessage != undefined) {
            messageObj = this.postProcessSystemMessage(messageObj);
          }

          this.markMessageCompleted(messageObj, finalMsgStatus);
          this.reenableChatBox();

          if (this.persistChat) {
            this.saveChatToStore();
          }
        }
      }
    }, (err) => {
      this.onStopMessageGeneration(`Message cancelled by system. An unexpected error occured. ${err}`);
      this.reenableChatBox();
      this._openAIService.onMessageReceive = new BehaviorSubject<ChatResponse>(null);
    });

    let chatCompletionQueryModel = CreateChatCompletionModel(searchQuery, messageObj.id, this.chatIdentifier, this.chatModel, this.responseTokenSize);

    this._openAIService.sendChatMessage(chatCompletionQueryModel, this.customInitialPrompt, this.autoAddResourceSpecificInfoToChatMessages).subscribe(response => {
    }, err => {
    });
  }

  handleFailure(err, messageObj) {
    if (err.status && err.status == 429) {
      this._telemetryService.logEvent("OpenAIChatTooManyRequestsError", { ...err, chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
      this.displayChatRequestError("Ah! Too many people asking me questions! Please try again in sometime.");
    }
    else {
      this._telemetryService.logEvent("OpenAIChatRequestError", { ...err, chatIdentifier: this.chatIdentifier, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
      this.displayChatRequestError("Me and AppLens are on a talking freeze it seems. Lets try again later.");
    }

    this.markMessageCompleted(messageObj);
    this.reenableChatBox();
  }

  prepareChatContext() {

    //Take last 'chatContextLength' messages to build context
    var context;
    let messagesToConsider = this._chatContextService.messageStore[this.chatIdentifier].slice(-1 * this.chatContextLength);

    if (this.chatModel == ChatModel.GPT3) {
      context = messagesToConsider.map((x: ChatMessage, index: number) => {
        if (index >= messagesToConsider.length - 2) {
          return `${x.messageSource}: ${x.message}`;
        }
        return `${x.messageSource}: ${x.displayMessage}`;
      }).join('\n');
    }
    else {
      context = [];
      messagesToConsider.forEach((element: ChatMessage, index: number) => {
        let role = element.messageSource == MessageSource.User ? "User" : "Assistant";
        let content = index >= messagesToConsider.length - 2 ?
          element.message : element.displayMessage;

        if (content != '') {
          context.push({
            "role": role,
            "content": content
          });
        }
      });
    }

    // Invoke callback if callers have specified 
    context = this.postPrepareChatContext(context);

    return context;
  }

  onUserSendMessage = (messageObj: ChatMessage) => {

    if (!this._chatContextService.messageStore.hasOwnProperty(this.chatIdentifier)) {
      this._chatContextService.messageStore[this.chatIdentifier] = [];
    }

    // Invoke Pre-processing callback for message
    messageObj = this.preprocessUserMessage(messageObj);

    this.openaiChatSearchText = messageObj.message;
    if (this.checkQuota()) {

      this._chatContextService.messageStore[this.chatIdentifier].push(messageObj);
      this._telemetryService.logEvent("OpenAIChatUserMessageSent", { chatIdentifier: this.chatIdentifier, message: messageObj.message, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
      this._chatContextService.chatInputBoxDisabled = true;
      let chatMessage = {
        id: uuid(),
        message: "",
        displayMessage: "",
        messageSource: MessageSource.System,
        timestamp: new Date().getTime(),
        messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
        status: MessageStatus.Created,
        userFeedback: FeedbackOptions.None,
        renderingType: MessageRenderingType.Text,
        feedbackDocumentIds:[]
      };

      this._chatContextService.messageStore[this.chatIdentifier].push(chatMessage);
      //Add a little timeout here to wait for the child component to initialize well
      setTimeout(() => { this.chatUIComponentRef.scrollToBottom(); }, 200);

      if (this.apiProtocol == APIProtocol.Rest || this.chatModel == ChatModel.GPT3) {
        this.fetchOpenAIResultUsingRest(this.prepareChatContext(), chatMessage);
      }
      else if (this.apiProtocol == APIProtocol.WebSocket) {
        this.fetchOpenAIResultUsingWSS(this.prepareChatContext(), chatMessage);
      }
    }
  }

  onStopMessageGeneration = (cancellationReason: string) => {

    let lastChatMessage: ChatMessage = this._chatContextService.messageStore[this.chatIdentifier].at(-1);

    if (lastChatMessage != undefined && lastChatMessage.messageSource == MessageSource.System) {


      if (this.openAIAPICallSubscription != undefined) {
        this.openAIAPICallSubscription.unsubscribe();
      }

      if (lastChatMessage.status != MessageStatus.Cancelled && lastChatMessage.status != MessageStatus.Finished) {
        lastChatMessage.displayMessage = `${lastChatMessage.displayMessage}\n\n<span style="color:#890000">${cancellationReason}</span>`;
        this.markMessageCompleted(lastChatMessage, MessageStatus.Cancelled);
        if (this.postProcessSystemMessage != undefined) {
          lastChatMessage = this.postProcessSystemMessage(lastChatMessage);
        }

        this.reenableChatBox();
      }

      if (this.apiProtocol == APIProtocol.WebSocket) {
        this._openAIService.cancelChatMessage(lastChatMessage.id);
      }
    }
  }

  private markMessageCompleted(messageObj: ChatMessage, status: MessageStatus = MessageStatus.Finished) {
    messageObj.status = status;
    messageObj.timestamp = new Date().getTime();
    messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
  }

  private reenableChatBox = () => {
    this.openaiChatSearchText = "";
    this.currentApiCallCount = 0;
    this._chatContextService.chatInputBoxDisabled = false;
    this.chatUIComponentRef.scrollToBottom();
    this.chatUIComponentRef.focusChatInput();
  }
}  
