import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChatMessage, ChatModel, ChatResponse, ChatUIContextService, CreateChatCompletionModel, CreateTextCompletionModel, 
  FeedbackOptions, GenericOpenAIChatService, KeyValuePair, MessageRenderingType, MessageSource, MessageStatus, ResponseTokensSize, StringUtilities, TelemetryService, TextModels, TimeUtilities } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { IButtonStyles, ITextFieldProps, PanelType } from 'office-ui-fabric-react';
import { Observable, Subscription, of } from 'rxjs';
import {v4 as uuid} from 'uuid';
import { map } from 'rxjs/operators';
import { ChatFeedbackAdditionalField, ChatFeedbackModel, ChatFeedbackPanelOpenParams, ChatFeedbackValidationStatus, FeedbackExplanationModes } from '../../../shared/models/openAIChatFeedbackModel';
import { AdalService } from 'adal-angular4';
import { ResourceService } from '../../../shared/services/resource.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { FabTextFieldComponent } from '@angular-react/fabric/lib/components/text-field';

@Component({
  selector: 'chat-feedback-panel',
  templateUrl: './chat-feedback-panel.component.html',
  styleUrls: ['./chat-feedback-panel.component.scss']
})
export class ChatFeedbackPanelComponent implements OnInit {
  panelType: PanelType = PanelType.custom;
  @Input() width: string = "850px";
  
  /// If chatMessages is empty or not supplied, then up to these many recent messages will be retrieved from chatContextService by chatIdentidier and used to generate feedback. This should also be accompanied with chatIdentidier else this is ignored.
  @Input() chatContextLength: number = 2;
  
  /// If chatMessages is empty or not supplied, then up to chatContextLength recent messages will be retrieved from chatContextService and used to generate feedback.
  @Input() chatIdentifier: string;

  /// If chatIdentifier is supplied, then the feedback will be autosaved else no action is taken and the calling component is responsible for saving the feedback. Feedback can be accessed via onDismissed event.
  @Input() autoSaveFeedback: boolean = true;
  
  @Input() responseTokenSize: ResponseTokensSize = ResponseTokensSize.XLarge;
  
  @Input() headerText: string = "Finetune AI";

  @Input() additionalFields: ChatFeedbackAdditionalField[];

  @Input() resourceSpecificInfo: KeyValuePair[] = [];

  @Input() SubmitButtonText: string = "Submit feedback";

  
  _feedbackPanelState:ChatFeedbackPanelOpenParams = {
    isOpen: false,
    chatMessageId: null
  };

  @Input() set feedbackPanelState(val:ChatFeedbackPanelOpenParams) {
    if(val && val.isOpen) {
      this.initValues(val);
    }
    this._feedbackPanelState = val;
  }
  public get feedbackPanelState(): ChatFeedbackPanelOpenParams {
    return this._feedbackPanelState;
  }
  @Output() feedbackPanelStateChange = new EventEmitter<ChatFeedbackPanelOpenParams>();

  @Output() onDismissed = new EventEmitter<ChatFeedbackModel>();
  @Input() onBeforeSubmit: (feedbackModel: ChatFeedbackModel) => Observable<ChatFeedbackModel>;

  @Input() feedbackExplanationMode: FeedbackExplanationModes = FeedbackExplanationModes.None;

  @Input() expectedResponseLabelText:string = 'Expected response';
  
  public statusMessage = '';
  public savingInProgress = false;
  public disableSubmitButton = true;
    
  private openAIAPICallSubscription:Subscription;
  private currentApiCallCount:number = 0;
  private openAIApiCallLimit = 10;

  fabTextFieldStyles: ITextFieldProps["styles"] = {
    wrapper: {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '1.5em'
    },
    field: {
      width: '500px'
    },
    subComponentStyles: {
      label: {
        root: {fontWeight: 700}
      },

    }
  }

  fabDefaultButtonStyle: IButtonStyles = {
    root: {
      margin: "1.5em",
    }
  }
  
  feedbackUserQuestion:ChatMessage = this.GetEmptyChatMessage();
  systemResponse:ChatMessage = this.GetEmptyChatMessage();
  correctResponseFeedback:string = '';
  correctResponseFeedbackReasoning:string = '';
  
  private GetChatFeedbackModel(): ChatFeedbackModel {
    let chatFeedbackModel = new ChatFeedbackModel(this.chatIdentifier, this.userAlias, this.provider, this.resourceType);
      chatFeedbackModel.userQuestion = this.feedbackUserQuestion.displayMessage;
      chatFeedbackModel.incorrectSystemResponse = this.systemResponse.message;
      chatFeedbackModel.expectedResponse = this.correctResponseFeedback;
      chatFeedbackModel.feedbackExplanation = this.correctResponseFeedbackReasoning;
      chatFeedbackModel.additionalFields = this.additionalFields;
      chatFeedbackModel.resourceSpecificInfo = this.resourceSpecificInfo;
      chatFeedbackModel.validationStatus = <ChatFeedbackValidationStatus>{
        succeeded:true,
        validationStatusResponse: ''
      };
      chatFeedbackModel.linkedFeedbackIds = this.systemResponse.feedbackDocumentIds?.length > 0 ? this.systemResponse.feedbackDocumentIds : [];
      return chatFeedbackModel;
  }

  public dismissedHandler(source?:string) {
    this.savingInProgress = false;
    this.feedbackPanelState = {
      isOpen: false,
      chatMessageId: this.systemResponse && this.systemResponse.message ? this.systemResponse.id : null
    };
    this.feedbackPanelStateChange.emit(this.feedbackPanelState);
    
    if(source === 'Close') {
      this.onDismissed.emit(null);
    }
    else {
      let chatFeedbackModel = this.GetChatFeedbackModel();
      this.onDismissed.emit(chatFeedbackModel);
    }
  }

  userAlias:string;
  resource:any;
  provider:string;
  resourceType:string;
  savingProgressText:string = 'Saving...';

  private addOrUpdateResourceSpecificInfo(key:string, value:string) {
    if(key) {
      let existing =  this.resourceSpecificInfo.find(kvp => kvp.key === key);
      if(existing) {
        existing.value = value;
      }
      else {
        this.resourceSpecificInfo.push(<KeyValuePair>{
          key: key,
          value: value
        });
      }
    }
  }

  constructor(private _adalService: AdalService, private _applensGlobal:ApplensGlobal, private _openAIService: GenericOpenAIChatService, 
    private _chatContextService: ChatUIContextService, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _telemetryService: TelemetryService) {

    this.userAlias = `${this._adalService.userInfo.profile.upn}`.split('@')[0];
    
    this.provider = this._resourceService.ArmResource.provider;
    this.resourceType = this._resourceService.ArmResource.resourceTypeName;
    
  }

  ngOnInit(): void {
    //this.initValues();
  }

  private initValues(panelOpenParams:ChatFeedbackPanelOpenParams): void {
    if(!panelOpenParams.isOpen) {
      return;
    }
    this.statusMessage = '';
    
    if(this.chatIdentifier != 'analyticskustocopilot') {
      this.addOrUpdateResourceSpecificInfo('provider', this.provider);
      this.addOrUpdateResourceSpecificInfo('resourceTypeName', this.resourceType );

      let resourceReady: Observable<any>;
      resourceReady =  (this._resourceService.ArmResource?.resourceGroup && this._resourceService.ArmResource?.resourceName) ? this._resourceService.getCurrentResource() : of(null);    
      resourceReady.subscribe(resource => {
        if (resource) {
          this.resource = resource;
          let valuesToAdd = ['IsLinux', 'Kind', 'IsXenon'];
          valuesToAdd.forEach(key => {
            if(this.resource[key]) {
              this.addOrUpdateResourceSpecificInfo(key, this.resource[key]);
            }
          });
        }
      });
    }
      
    let chatMessagesToWorkWith:ChatMessage[] = [];

    // Update user question    
    if(this.chatIdentifier && this._chatContextService.messageStore[this.chatIdentifier] && this._chatContextService.messageStore[this.chatIdentifier].length > 0 ) {
      if(panelOpenParams.chatMessageId && this._chatContextService.messageStore[this.chatIdentifier] && this._chatContextService.messageStore[this.chatIdentifier].some((msg:ChatMessage)  => msg.id == panelOpenParams.chatMessageId) ) {
        let chatMessageIndex = this._chatContextService.messageStore[this.chatIdentifier].findIndex((msg:ChatMessage)  => msg.id == panelOpenParams.chatMessageId);
        chatMessagesToWorkWith = this._chatContextService.messageStore[this.chatIdentifier].slice( this.chatContextLength > chatMessageIndex ? 0 : (chatMessageIndex - this.chatContextLength) , chatMessageIndex + 1);
      }
      else {
        chatMessagesToWorkWith = this._chatContextService.messageStore[this.chatIdentifier].slice(-1 * this.chatContextLength);
      }
    }

    if(chatMessagesToWorkWith && chatMessagesToWorkWith.length > 0) {
      let lastDislikeSystemMessageIndex = -1;
      let dislikedSystemMessage = null;
      let lastUserMessageBeforeDislike = null;
      
      for (let i = chatMessagesToWorkWith.length - 1; i >= 0; i--) {
        const message = chatMessagesToWorkWith[i];
        if (message.messageSource === MessageSource.System && message.userFeedback === FeedbackOptions.Dislike) {
          lastDislikeSystemMessageIndex = i;
          dislikedSystemMessage = message;
          break;
        }
        else {
          dislikedSystemMessage = message;
        }

        if (message.messageSource === MessageSource.User) {
          lastUserMessageBeforeDislike = message;
        }
      }

      if (lastDislikeSystemMessageIndex !== -1) {
        lastUserMessageBeforeDislike = null;
        for (let i = lastDislikeSystemMessageIndex - 1; i >= 0; i--) {
          const message = chatMessagesToWorkWith[i];
          if (message.messageSource === MessageSource.User) {
            lastUserMessageBeforeDislike = message;
            break;
          }
        }
      }

      this.systemResponse = dislikedSystemMessage;
      this.feedbackUserQuestion = lastUserMessageBeforeDislike;

      let chatMessagesToConstructUserQuestionFrom = chatMessagesToWorkWith.slice(0, chatMessagesToWorkWith.findIndex(message => message.id === lastUserMessageBeforeDislike.id) + 1);
      if(chatMessagesToConstructUserQuestionFrom && chatMessagesToConstructUserQuestionFrom.length > 0 && chatMessagesToConstructUserQuestionFrom.filter(message => message.messageSource === MessageSource.User).length > 1) {
        // Construct a composite user question via OpenAI
        this._openAIService.CheckEnabled().subscribe((enabled) => {
          if(enabled) {
            this.currentApiCallCount = 0;
            this._openAIService.fetchOpenAIResultAsChatMessageUsingRest(this.prepareChatHistory(chatMessagesToConstructUserQuestionFrom, ChatModel.GPT3), this.GetEmptyChatMessage(), true, true, ChatModel.GPT3, 
                "Given the chat history, consolidate the users latest topic of discussion into a self contained question. Do not attempt to answer the user's question, the goal is to construct a self contained question that captures the user's most recent topic of discussion. Phrase the question as if the user were talking with the AI assistant in first person. Output only the question without any explanation.",
                '', this.responseTokenSize, this.currentApiCallCount, this.openAIApiCallLimit, true)
            .subscribe((messageObj) => {
                if(messageObj && messageObj.status === MessageStatus.Finished && !`${messageObj.displayMessage}`.startsWith('Error: ')  ) {
                  this.feedbackUserQuestion = messageObj;
                  this.statusMessage = 'Note: User question was updated based on the chat history. Please validate the question before submitting.';
                }
              });
          }
        });
      }
    }
  }

  private GetEmptyChatMessage(): ChatMessage {
    return {
      id: uuid(),
      message: "",
      displayMessage: "",
      messageSource: MessageSource.System,
      timestamp: new Date().getTime(),
      messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
      status: MessageStatus.Created,
      userFeedback: FeedbackOptions.None,
      renderingType: MessageRenderingType.Text,
      feedbackDocumentIds: []
    };
  } 

  private prepareChatHistory(messagesToConsider: ChatMessage[], chatModel: ChatModel) {
    //Take last 'chatContextLength' messages to build context    
    if (messagesToConsider && messagesToConsider.length > 0) {
      var context;
      if (chatModel == ChatModel.GPT3) {
        context = messagesToConsider.map((x: ChatMessage, index: number) => {
          return `${x.messageSource}: ${ (x.displayMessage? x.displayMessage: x.message)}`;
        }).join('\n');
        return context;
      }
      else {
        context = [];
        messagesToConsider.forEach((element: ChatMessage, index: number) => {
          let role = element.messageSource == MessageSource.User ? "User" : "Assistant";
          let content = element.displayMessage? element.displayMessage : element.message ;
          if (content != '') {
            context.push({
              "role": role,
              "content": content
            });
          }
        });
        return context;
      }
    }
    return null;
  }

  updateFeedbackUserQuestion(e: { event: Event, newValue?: string }) {
    if(this.feedbackUserQuestion && e) {
      this.feedbackUserQuestion.displayMessage = (e.newValue)? `${e.newValue}` : '';
      this.feedbackUserQuestion.message =  (e.newValue)? `${e.newValue}` : '';
    }
  }

  updateFeedbackUserResponse(e: { event: Event, newValue?: string }) {
    let cursorStartPosition:number = -1;
    if(e && e.event && e.event.target && e.event.target['selectionStart']) {
      cursorStartPosition = e.event.target['selectionStart'];
    }
    this.correctResponseFeedback = (e?.newValue)? `${e.newValue}` : '';
    this.correctResponseFeedbackReasoning = '';
    if(!StringUtilities.IsNullOrWhiteSpace(this.correctResponseFeedback)) {
      this.disableSubmitButton = false;
    }
    else {
      this.disableSubmitButton = true;
    }
    if(cursorStartPosition > -1) {
      setTimeout(() => {
        e.event.target['selectionStart'] = cursorStartPosition;
        e.event.target['selectionEnd'] = cursorStartPosition;
      });
    }
  }
  
  updateAdditionalFieldValue(element: ChatFeedbackAdditionalField, e: { event: Event, newValue?: string }) {
    if(element && e) {
      element.value = (e.newValue)? `${e.newValue}` : '';
    }
  }

  validateFeedback():Observable<boolean> {
    // Remove all occurrence of empty whitespace space from this.correctResponseFeedback
    if(this.correctResponseFeedback && !StringUtilities.IsNullOrWhiteSpace(this.correctResponseFeedback) && this.correctResponseFeedback.replace(/\s/g, '').length > 2) {
      let chatFeedbackModel = this.GetChatFeedbackModel();
      if(this.onBeforeSubmit) {
        return this.onBeforeSubmit(chatFeedbackModel).pipe(map((validatedChatFeedback) => {
          if(validatedChatFeedback && validatedChatFeedback.validationStatus) {
            this.statusMessage = validatedChatFeedback.validationStatus.validationStatusResponse;
            this.feedbackUserQuestion.displayMessage = validatedChatFeedback.userQuestion? validatedChatFeedback.userQuestion : this.feedbackUserQuestion.displayMessage;
            this.feedbackUserQuestion.message = validatedChatFeedback.userQuestion? validatedChatFeedback.userQuestion : this.feedbackUserQuestion.message;
            this.systemResponse.displayMessage = validatedChatFeedback.incorrectSystemResponse? validatedChatFeedback.incorrectSystemResponse : this.systemResponse.displayMessage;
            this.systemResponse.message = validatedChatFeedback.incorrectSystemResponse? validatedChatFeedback.incorrectSystemResponse : this.systemResponse.message;            

            //Update UI element with returned values for user response
            this.correctResponseFeedback = validatedChatFeedback.expectedResponse? validatedChatFeedback.expectedResponse : this.correctResponseFeedback;
            
            // Not updating this.correctResponseFeedbackReasoning as it is not part of the validation response
            this.correctResponseFeedbackReasoning = validatedChatFeedback.feedbackExplanation;
            this.additionalFields = validatedChatFeedback.additionalFields;
            chatFeedbackModel = validatedChatFeedback;
            return validatedChatFeedback.validationStatus.succeeded;
          }
          else {
            this.statusMessage = validatedChatFeedback && validatedChatFeedback.validationStatus && validatedChatFeedback.validationStatus.validationStatusResponse? validatedChatFeedback?.validationStatus?.validationStatusResponse: 'Error: Failed to validate feedback.';
            return false;
          }
        }));
      }
      else {        
        this.statusMessage = '';
        this.statusMessage += (!this.feedbackUserQuestion.displayMessage) ? 'Error: User question is required.\n': '';
        this.statusMessage += (!this.correctResponseFeedback) ? `Error: ${this.expectedResponseLabelText} is required.`: '';
        return of(!this.statusMessage);
      }
    }
    else {
      this.statusMessage = '';
      this.statusMessage += (!this.feedbackUserQuestion.displayMessage) ? 'Error: User question is required.\n': '';
      this.statusMessage += (!this.correctResponseFeedback || StringUtilities.IsNullOrWhiteSpace(this.correctResponseFeedback) || this.correctResponseFeedback.replace(/\s/g, '').length < 3) ? `Error: ${this.expectedResponseLabelText} is required.`: '';
      return of(!this.statusMessage);
    }
  }

  getFeedbackExplanationInitialPrompt() {
    if(this.feedbackUserQuestion.displayMessage && this.systemResponse.message && this.correctResponseFeedback)
    {
      if(this.feedbackExplanationMode ==  FeedbackExplanationModes.ComparativeReasoning)
      {
        return `--------------------UserQuestion--------------------
${this.feedbackUserQuestion.displayMessage}
--------------------UserQuestion--------------------

--------------------IncorrectAnswer--------------------
${this.systemResponse.message}
--------------------IncorrectAnswer--------------------

--------------------CorrectAnswer--------------------
${this.correctResponseFeedback}
--------------------CorrectAnswer--------------------

You are a chat assistant that helps reason why an answer to a question is incorrect and generates a summary reasoning about why the answer is incorrect. Given the UserQuestion, IncorrectAnswer and CorrectAnswer, compare the correct and incorrect answers. Please provide a detailed explanation of why the correct response is indeed correct and why the incorrect response is wrong. Break down the reasoning step by step to help the user understand the concepts better. You can also highlight any key points or examples that illustrate the differences between the two responses. Make the explanation clear, concise, and informative so that the user gains a deeper understanding of the topic.`;
      }
      else {
        if(this.feedbackExplanationMode == FeedbackExplanationModes.Explanation) {
          return `--------------------UserQuestion--------------------
${this.feedbackUserQuestion.displayMessage}
--------------------UserQuestion--------------------

--------------------ExpectedResponse--------------------
${this.correctResponseFeedback}
--------------------ExpectedResponse--------------------
          
You are a chat assistant that helps explain why an expected response successfully answers the user's question. Given the UserQuestion and ExpectedResponse, please provide a detailed explanation of why and how the expected response indeed addresses the users question. Break down the explanation step by step to help the user understand the concepts better. You can also highlight any key points or examples that illustrate the response. Make the explanation clear, concise, and informative so that the user gains a deeper understanding of the topic.`;
        }
      }
    }

    return ``;
  }

  submitChatFeedback() {
    this.savingInProgress = true;
    this.disableSubmitButton = true;
    this.savingProgressText = 'Saving...';
    try
    {
      this.savingProgressText = 'Validating feedback...';
      this.validateFeedback().subscribe((validated) => {
        if(validated){
          if(this.correctResponseFeedbackReasoning) {
            this.handleFeedbackAutoSaveAndRaiseEvent();
          }
          else {
            this.statusMessage = '';
            if(this.feedbackExplanationMode == FeedbackExplanationModes.None) {
              this.handleFeedbackAutoSaveAndRaiseEvent();
            }
            else
            {
              this.savingProgressText = 'Constructing feedback explanation...';
              this._openAIService.CheckEnabled().subscribe((enabled) => {
                if(enabled && this.feedbackUserQuestion.displayMessage && this.systemResponse.message && this.correctResponseFeedback) {            
                  this.currentApiCallCount = 0;
                  this._openAIService.fetchOpenAIResultAsChatMessageUsingRest('', this.GetEmptyChatMessage(), true, true, ChatModel.GPT3, this.getFeedbackExplanationInitialPrompt(), '', 
                    this.responseTokenSize, this.currentApiCallCount, this.openAIApiCallLimit, false)
                  .subscribe((messageObj) => {
                    if(messageObj && messageObj.status === MessageStatus.Finished && !`${messageObj.displayMessage}`.startsWith('Error: ')  ) {
                      this.correctResponseFeedbackReasoning = messageObj.displayMessage;
                    }
                    this.handleFeedbackAutoSaveAndRaiseEvent();
                  }, (error) => {
                    this.statusMessage = `Error saving feedback: ${error.message}`;
                    this.savingInProgress = false;
                  });
                }
              }, (error) => {
                this.statusMessage = `Error saving feedback: ${error.message}`;
                this.savingInProgress = false;
              });
            }
          }
        }
        else {
          // submitChatFeedback - Validation failed. Keep the panel open and let the user correct the feedback. Do nothing here...
          this.savingInProgress = false;
        }
      }, (error) => {
        this.savingInProgress = false;
        this.statusMessage = `Error saving feedback: ${error.message}`;
        throw error;
      });
    }
    catch(ex) {
      this.statusMessage = `Error saving feedback: ${ex.message}`;
      this.savingInProgress = false;
    }
    
  }

  private handleFeedbackAutoSaveAndRaiseEvent() {
    if (this.autoSaveFeedback) {
      this.savingProgressText = 'Saving feedback...';
      this._diagnosticService.saveChatFeedback(this.GetChatFeedbackModel().toChatFeedbackPostBody()).subscribe((result) => {
        // Feedback saved successfully
        this.statusMessage = '';
        this.dismissedHandler();
      }
      , (error) => {
        this.statusMessage = `Error saving feedback: ${error.message}`;
        this.savingInProgress = false;
        this.disableSubmitButton = false;
        this._telemetryService.logException(error, 'chat-feedback-panel_handleFeedbackAutoSaveAndRaiseEvent_saveChatFeedback', {armId: this._resourceService.getCurrentResourceId(false), userId: this.userAlias, message: error.message})
        console.error(`Error saving feedback: ${error.message}`);
        console.error(error);
      });
    } else {
      // Raise the event and let the caller save this feedback
      this.dismissedHandler();
    }
    
  }
}