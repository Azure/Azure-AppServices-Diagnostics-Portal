import { Component, OnInit, ViewChild } from '@angular/core';
import { ChatUIComponent } from '../chat-ui/chat-ui.component';
import { ChatUIContextService } from '../../services/chatui-context.service';
import { ConversationalDiagService } from '../../services/conversational-diag.service';
import { TelemetryService, TelemetryEventNames, TimeUtilities, DiagChatResponse } from '../../../public_api';
import {ChatMessage, MessageRenderingType, MessageSource, MessageStatus} from '../../models/chatbot-models';
import { v4 as uuid } from 'uuid';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'diag-chat-container',
  templateUrl: './diag-chat-container.component.html',
  styleUrls: ['./diag-chat-container.component.scss']
})
export class DiagChatContainerComponent implements OnInit {
  constructor(public _chatContextService: ChatUIContextService, public _telemetryService: TelemetryService, private _diagChatService: ConversationalDiagService) {
    if (!this._chatContextService.messageStore.hasOwnProperty(this.chatIdentifier)) {
      this._chatContextService.messageStore[this.chatIdentifier] = [];
    }
  }

  @ViewChild('chatUIComponent') chatUIComponentRef: ChatUIComponent;

  preprocessUserMessage = (messageObj: ChatMessage): ChatMessage => {return messageObj};
  chatIdentifier: string = 'diagChatPublic';
  userInput: string = '';
  chatHeader: string = '<h3>Diag Chat Container</h3>';
  inputTextLimit: number = 500;
  chatQuerySamples: any[] = [
        {
            "key": "My application has performance issues",
            "value": "My application has performance issues"
        },
        {
            "key": "Broken connectivity to external endpoint",
            "value": "Broken connectivity to external endpoint"
        },
        {
            "key": "What is the meaning of 500.19 error?",
            "value": "What is the meaning of 500.19 error?"
        },
        {
            "key": "How to configure Virtual Network on my app?",
            "value": "How to configure Virtual Network on my app?"
        },
        {
            "key": "What are the Azure App Service resiliency features?",
            "value": "What are the Azure App Service resiliency features?"
        },
        {
            "key": "How to integrate KeyVault in Azure Function App using azure cli?",
            "value": "How to integrate KeyVault in Azure Function App using azure cli?"
        }
    ];

  ngOnInit(): void {
    this._diagChatService.establishSignalRConnection().subscribe((result: boolean) => {
      this._chatContextService.chatInputBoxDisabled = !result;
    });
  }

  postProcessSystemMessage = (messageObject: ChatMessage) => {
    messageObject.displayMessage = messageObject.message;
    this._chatContextService.chatInputBoxDisabled = false;
    this.chatUIComponentRef.scrollToBottom();
  }

  private diagChatCallSubscription: Subscription;

  sendMessageOverWSS(searchQuery: any, messageObj: ChatMessage) {  
    if (this.diagChatCallSubscription) {  
      this.diagChatCallSubscription.unsubscribe();  
    }  
    
    this.diagChatCallSubscription = this._diagChatService.onMessageReceive.subscribe((chatResponse: DiagChatResponse) => {  
      if (messageObj.status == MessageStatus.Cancelled) {  
        return;  
      }
      if (chatResponse == null){
        return;
      }  
    
      if (chatResponse != null && chatResponse != undefined) {  
        if (chatResponse.message != undefined && chatResponse.message.displayMessage != '') {  
          messageObj.status = chatResponse.message.status;  
          messageObj.message = `${messageObj.message}${chatResponse.message.displayMessage}`;  
        }  
        else{
          messageObj.message = "An error occurred.";
          messageObj.status = MessageStatus.Finished;  
        }  
      }
      else {
        messageObj.message = "An error occurred.";
        messageObj.status = MessageStatus.Finished;
      }
      if (this.postProcessSystemMessage != undefined) {
        this.postProcessSystemMessage(messageObj);
      }
    }, (err) => {  
      this._diagChatService.onMessageReceive = new BehaviorSubject<DiagChatResponse>(null);  
    }); 
    
    this._diagChatService.sendChatMessage({
      sessionId: "someSessionId",
      resourceId: "subscriptions/14300d68-d0c8-4060-82af-bf2d9b70f130/resourceGroups/bakeryapp-rg/providers/Microsoft.Web/sites/takeithomebakery",
      userId: "ajsharm",
      message: searchQuery
    }).subscribe(response => {
      console.log("Response", response);
    }, err => {
      console.log("Error", err);
    });
  }  
  

  onUserSendMessage = (messageObj: ChatMessage) => {

    if (!this._chatContextService.messageStore.hasOwnProperty(this.chatIdentifier)) {
      this._chatContextService.messageStore[this.chatIdentifier] = [];
    }

    // Invoke Pre-processing callback for message
    messageObj = this.preprocessUserMessage(messageObj);

    this.userInput = messageObj.message;
    this._chatContextService.messageStore[this.chatIdentifier].push(messageObj);
    this._telemetryService.logEvent("DiagChatUserMessageSent", { message: messageObj.message, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
    this._chatContextService.chatInputBoxDisabled = true;
    let chatMessage = {
      id: uuid(),
      message: "",
      displayMessage: "",
      messageSource: MessageSource.System,
      timestamp: new Date().getTime(),
      messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
      status: MessageStatus.InProgress,
      userFeedback: "none",
      renderingType: MessageRenderingType.Text
    };

    this._chatContextService.messageStore[this.chatIdentifier].push(chatMessage);
    //Add a little timeout here to wait for the child component to initialize well
    setTimeout(() => { this.chatUIComponentRef.scrollToBottom(); }, 200);

    this.sendMessageOverWSS(messageObj.message, chatMessage);

    /*setTimeout(() => {
      chatMessage.message = "This is a sample response from the chatbot";
      chatMessage.displayMessage = chatMessage.message;
      chatMessage.status = MessageStatus.Finished;
      this._chatContextService.chatInputBoxDisabled = false;
      this._telemetryService.logEvent("DiagChatUserMessageReceived", { message: chatMessage.message, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
      this.chatUIComponentRef.scrollToBottom();
    }, 2000);*/

  }

}