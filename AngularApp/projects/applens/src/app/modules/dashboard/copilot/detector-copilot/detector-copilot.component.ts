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

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = true;
    this.lastMessageIdForFeedback = messageObj.id;
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = !(messageObj.status == MessageStatus.Finished || messageObj.status == MessageStatus.Cancelled);
    if (this._copilotService.operationInProgress === false) {
      console.log('Operation Complete');
    }
    messageObj.displayMessage = messageObj.message;
    return messageObj;
  }

  //#region Command Bar Methods

  clearChat() {
    this._chatContextService.clearChat(this._copilotService.detectorCopilotChatIdentifier);
  }

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
