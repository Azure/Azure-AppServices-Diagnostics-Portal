import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplensCopilotContainerService } from '../../services/copilot/applens-copilot-container.service';
import { ApplensDetectorCopilotService } from '../../services/copilot/applens-detector-copilot.service';
import { APIProtocol, ChatMessage, ChatModel, ChatUIContextService, MessageStatus } from 'diagnostic-data';
import { PortalUtils } from 'projects/applens/src/app/shared/utilities/portal-util';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnDestroy {

  contentDisclaimerMessage: string = "Please review the AI-Generated results for correctness. Dont send any sensitive data.";
  chatModel: ChatModel = ChatModel.GPT4;
  apiProtocol: APIProtocol = APIProtocol.WebSocket;
  chatHeader: string;
  stopMessageGeneration: boolean = false;
  clearChatConfirmationHidden: boolean = true;
  copilotExitConfirmationHidden: boolean = true;

  private featureTitle = 'Detector Copilot (Preview)';
  private lastMessageIdForFeedback: string = '';

  constructor(public _copilotContainerService: ApplensCopilotContainerService, public _copilotService: ApplensDetectorCopilotService,
    private _chatContextService: ChatUIContextService) {
  }

  ngOnInit(): void {
    this._copilotContainerService.copilotHeaderTitle = this.featureTitle;
    this.chatHeader = this.getChatHeader();
  }

  ngOnDestroy() {
  }

  handleCloseCopilotEvent(event: any) {
    if (event) {
      this.checkMessageStateAndExitCopilot(event.showConfirmation);
      if (event.resetCopilot) {
        this._copilotService.reset();
      }
    }
  }

  //#region Chat Callbacks

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = true;
    this.lastMessageIdForFeedback = messageObj.id;
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = !(messageObj.status == MessageStatus.Finished || messageObj.status == MessageStatus.Cancelled);
    messageObj.displayMessage = messageObj.message;
    return messageObj;
  }

  //#endregion

  //#region Settings : Clear Chat Methods

  clearChat = () => {
    this._chatContextService.clearChat(this._copilotService.detectorCopilotChatIdentifier);
    this.clearChatConfirmationHidden = true;
  }

  showClearChatDialog = (show: boolean = true) => {
    this.clearChatConfirmationHidden = !show;
  }

  //#endregion

  //#region Copilot Exit Methods

  showExitConfirmationDialog = (show: boolean = true) => {
    this.copilotExitConfirmationHidden = !show;
  }

  exitCopilot = (cancelOpenAICall: boolean = true) => {

    if (cancelOpenAICall) {
      this.cancelOpenAICall();
    }

    this._copilotService.operationInProgress = false;
    this.copilotExitConfirmationHidden = true;
    this._copilotService.selectedComponent = {};
    this._copilotContainerService.hideCopilotPanel();
  }

  checkMessageStateAndExitCopilot(showConfirmation: boolean = true) {
    if (this._copilotService.operationInProgress == true) {
      if (showConfirmation)
        this.showExitConfirmationDialog(true);
      else
        this.exitCopilot(true);
    }
    else {
      this.exitCopilot(false);
    }
  }

  //#endregion

  //#region Other Command Bar Methods

  cancelOpenAICall = () => {

    this.stopMessageGeneration = true;

    setTimeout(() => {
      this.stopMessageGeneration = false;
    }, 1000);
  }

  sendFeedback = () => {

    let newline = '%0D%0A';
    const subject = encodeURIComponent(`${this._copilotContainerService.copilotHeaderTitle} Feedback`);
    let body = encodeURIComponent('Please provide feedback here:');
    let link = "";

    var browserType = PortalUtils.getBrowserType();
    var url = window.location.href;
    let debugInfo = `${newline}============ Debug Info ============${newline}`;
    debugInfo += `Browser: ${browserType}${newline}`;
    debugInfo += `Last User Message Id: ${this.lastMessageIdForFeedback}${newline}`;
    debugInfo += `Url: ${url}${newline}`;


    body = `${body}${newline}${newline}${newline}${debugInfo}`;
    link = `mailto:detectorcopilotfeedb@microsoft.com?subject=${subject}&body=${body}`;
    window.open(link);
  }

  //#endregion

  private getChatHeader(): string {
    return `
    <h1 class='copilot-header chatui-header-text'>
      ${this.featureTitle}
      <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    </h1>`;
  }
}
