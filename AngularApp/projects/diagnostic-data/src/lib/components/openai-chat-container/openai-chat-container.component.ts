import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  // Models 
  ChatMessage,  MessageStatus,
  // Services
  ChatUIContextService, GenericOpenAIChatService,
  // Telemetry
  TelemetryService,
  // Utilities
  ChatAlignment,
  ChatModel,
  ResponseTokensSize,
  APIProtocol,
  FeedbackOptions,
  TelemetryEventNames

} from "../../../public_api";
import { HttpClient } from '@angular/common/http';
import { KeyValuePair } from '../../models/common-models';
import { CustomCommandBarButtons } from '../../models/openai-chat-container-models';

@Component({
  selector: 'openai-chat-container',
  templateUrl: './openai-chat-container.component.html',
  styleUrls: ['./openai-chat-container.component.scss']
})

export class OpenAIChatContainerComponent implements OnInit {
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
  @Input() showCopyOption:boolean = false;
  @Input() apiProtocol: APIProtocol = APIProtocol.Rest;
  @Input() inputTextLimit: number = 500;

  // Callback methods for pre and post processing messages
  @Input() onUserMessageSend: (message: ChatMessage) => ChatMessage = function (message: ChatMessage) {
    return message;
  };
  @Input() onSystemMessageReceived: (message: ChatMessage) => ChatMessage;
  @Input() onPrepareChatContext: (context: any) => any = function (context: any) {
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

  @Input() feedbackEmailAlias:string = 'applensv2team';
  @Input() customCommandBarButtons:CustomCommandBarButtons[] = [];
  @Input() onFeedbackClicked: (chatMessage:ChatMessage, feedbackType:FeedbackOptions) => void;
  @Input() autoAddResourceSpecificInfoToChatMessages:boolean = true;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _chatContextService: ChatUIContextService,
    private _openAIService: GenericOpenAIChatService,
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
  public chatInProgress:boolean = false;
  private lastMessageIdForFeedback: string = '';
  private lastMessageForFeedback: string = '';
  clearChatConfirmationHidden: boolean = true;

  // This is the limit on the number of recursive calls made to open AI
  openAIApiCallLimit = 10;
  currentApiCallCount = 0;

  updateStatusAndPreProcessUserMessage = (message: ChatMessage): ChatMessage => {
    this.chatInProgress = true;
    this.lastMessageIdForFeedback = message.id;
    this.lastMessageForFeedback = JSON.stringify(message);
    if(this.onUserMessageSend) {
      return this.onUserMessageSend(message);
    }
    else {
      return message;
    }
    
  }

  updateStatusAndPostProcessSystemMessage = (message: ChatMessage): ChatMessage => {
    if(message.status === MessageStatus.Finished || message.status === MessageStatus.Cancelled) {
      this.chatInProgress = false;
    }

    if(this.onSystemMessageReceived) {
      return this.onSystemMessageReceived(message);
    }
    else {
      message.displayMessage = message.message;
      return message;
    }
  }
  

  cancelOpenAICall = () => {
    this.stopMessageGeneration = true;
    setTimeout(() => {
      this.stopMessageGeneration = false;
    }, 1000);
  }

  sendFeedback = () => {
    let newline = '%0D%0A';
    const subject = encodeURIComponent(`${this.chatIdentifier} Feedback`);
    let body = encodeURIComponent('Please provide feedback here:');
    let link = "";

    var url = window.location.href;
    let debugInfo = `${newline}============ Debug Info ============${newline}`;
    debugInfo += `Browser UserAgent: ${navigator.userAgent}${newline}`;
    debugInfo += `Last User Message Id: ${this.lastMessageIdForFeedback}${newline}`;
    debugInfo += `Last User Message: ${this.lastMessageForFeedback}${newline}`;
    debugInfo += `Url: ${url}${newline}`;


    body = `${body}${newline}${newline}${newline}${debugInfo}`;
    link = `mailto:${this.feedbackEmailAlias}@microsoft.com?subject=${subject}&body=${body}`;
    window.open(link);
  }


  clearChat = () => {
    this._chatContextService.clearChat(this.chatIdentifier);
    this.clearChatConfirmationHidden = true;
    this._telemetryService.logEvent(TelemetryEventNames.ChatGPTClearButtonClicked, { userId: this._chatContextService.userId, timestamp: new Date().getTime().toString() });

  }

  showClearChatDialog = (show: boolean = true) => {
    this.clearChatConfirmationHidden = !show;
  }

  getCustomButtonIconProps(customButton: CustomCommandBarButtons):any {
    return { iconName: customButton.iconName };
  }

  ngOnInit() {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
    });
  }
}  
