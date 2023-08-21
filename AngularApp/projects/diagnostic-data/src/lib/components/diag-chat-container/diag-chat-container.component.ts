import { Component, OnInit, ViewChild } from '@angular/core';
import { ChatUIComponent } from '../chat-ui/chat-ui.component';
import { ChatUIContextService } from '../../services/chatui-context.service';
import { ConversationalDiagService } from '../../services/conversational-diag.service';
import { ChatMessage, MessageRenderingType, MessageSource, MessageStatus } from '../../models/chatbot-models';
import { v4 as uuid } from 'uuid';
import { BehaviorSubject, Subscription } from 'rxjs';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DiagChatResponse, QueryResponseStatus } from '../../models/openai-data-models';
import { TimeUtilities } from '../../utilities/time-utilities';
import { DiagnosticService } from '../../services/diagnostic.service';
import { GenieGlobals } from '../../services/genie.service';
import { PanelType } from 'office-ui-fabric-react';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'diag-chat-container',
  templateUrl: './diag-chat-container.component.html',
  styleUrls: ['./diag-chat-container.component.scss']
})
export class DiagChatContainerComponent implements OnInit {
  constructor(public _chatContextService: ChatUIContextService, public _telemetryService: TelemetryService, private _diagChatService: ConversationalDiagService, private _diagnosticService: DiagnosticService, public globals: GenieGlobals, private _router: Router, private _route: ActivatedRoute) {
    if (!this._chatContextService.messageStore.hasOwnProperty(this.chatIdentifier)) {
      this._chatContextService.messageStore[this.chatIdentifier] = [];
    }
  }

  @ViewChild('chatUIComponent') chatUIComponentRef: ChatUIComponent;

  preprocessUserMessage = (messageObj: ChatMessage): ChatMessage => { return messageObj };
  chatIdentifier: string = 'diagChatPublic';
  userInput: string = '';
  chatHeader: string = '<h2><b>Conversational Diagnostics for App Service</b></h2>';
  inputTextLimit: number = 500;
  responseInProgress: boolean = false;
  private diagChatCallSubscription: Subscription;
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
  panelType: PanelType = PanelType.custom;

  ngOnInit(): void {
    this.globals.openDiagChatSolutionPanel = false;
    this._diagChatService.establishSignalRConnection().subscribe((result: boolean) => {
      this._chatContextService.chatInputBoxDisabled = !result;
    });
  }

  postProcessSystemMessage = (messageObject: ChatMessage) => {
    messageObject.displayMessage = messageObject.message;
    this._chatContextService.chatInputBoxDisabled = false;
    this.chatUIComponentRef.scrollToBottom();
  }

  sendMessageOverWSS(searchQuery: any) {
    if (this.diagChatCallSubscription) {
      this.diagChatCallSubscription.unsubscribe();
    }

    this.responseInProgress = true;

    this.diagChatCallSubscription = this._diagChatService.onMessageReceive.subscribe((chatResponse: DiagChatResponse) => {
      if (chatResponse == null) {
        this.responseInProgress = false;
        return;
      }

      let isMessageEmptyOrError = false;

      if (chatResponse != null && chatResponse != undefined) {
        if (chatResponse.message != undefined && chatResponse.message.message != '') {
          let messageObj = this.pushEmptySystemMessage();
          messageObj.renderingType = chatResponse.message.renderingType;
          messageObj.status = chatResponse.message.status;
          messageObj.message = chatResponse.message.message;
          if (this.postProcessSystemMessage != undefined) {
            this.postProcessSystemMessage(messageObj);
          }
        }
        else {
          isMessageEmptyOrError = true;
        }
      }
      else {
        isMessageEmptyOrError = true;
      }
      if (isMessageEmptyOrError) {
        let messageObj = this.pushEmptySystemMessage();
        messageObj.message = "An error occurred.";
        messageObj.status = MessageStatus.Finished;
        if (this.postProcessSystemMessage != undefined) {
          this.postProcessSystemMessage(messageObj);
        }
      }
      if (chatResponse.responseStatus == QueryResponseStatus.InProgress) {
        this.responseInProgress = true;
      }
      else {
        this.responseInProgress = false;
      }
    }, (err) => {
      this._diagChatService.onMessageReceive = new BehaviorSubject<DiagChatResponse>(null);
    });

    //Need to be replaced with actual session id and userId
    const resourceId = this._diagnosticService.resourceId.startsWith('/') ? this._diagnosticService.resourceId.substring(1) : this._diagnosticService.resourceId;
    this._diagChatService.sendChatMessage({
      sessionId: "someSessionId",
      resourceId: resourceId,
      userId: "ajsharm",
      message: searchQuery
    }).subscribe(response => {
    }, err => {
      console.log("Error", err);
    });
  }

  pushEmptySystemMessage = (): ChatMessage => {
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
    return chatMessage;
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

    //Add a little timeout here to wait for the child component to initialize well
    setTimeout(() => { this.chatUIComponentRef.scrollToBottom(); }, 200);

    this.sendMessageOverWSS(messageObj.message);
  }

  closePanel() {
    this.globals.openDiagChatSolutionPanel = false;
    this._router.navigate([`../../`], { relativeTo: this._route, skipLocationChange: true });
  }
}
