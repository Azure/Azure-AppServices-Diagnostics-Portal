import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplensCopilotContainerService } from '../../services/copilot/applens-copilot-container.service';
import { ApplensDetectorCopilotService } from '../../services/copilot/applens-detector-copilot.service';
import { APIProtocol, ChatMessage, ChatModel, ChatUIContextService, MessageStatus, TelemetryService } from 'diagnostic-data';
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

  constructor(public _copilotContainerService: ApplensCopilotContainerService, public _copilotService: ApplensDetectorCopilotService,
    private _chatContextService: ChatUIContextService, private _telemetryService: TelemetryService) {
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

        // Intentionally delaying the clear chat, so that the last message if in-progress can be cancelled before its cleared.
        setTimeout(() => {
          this._chatContextService.clearChat(this._copilotService.detectorCopilotChatIdentifier);
        }, 500);
      }
    }
  }

  //#region Chat Callbacks

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = true;
    PortalUtils.logEvent(`${this._copilotService.detectorCopilotChatIdentifier}-OnMessageSent`, `${messageObj.displayMessage}, id: ${messageObj.id}`, this._telemetryService);
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = !(messageObj.status == MessageStatus.Finished || messageObj.status == MessageStatus.Cancelled);
    let completionEventName = messageObj.status == MessageStatus.Finished ? 'OnMessageReceived' :
      messageObj.status == MessageStatus.Cancelled ? 'OnMessageCancelled' : '';

    if (messageObj.status != MessageStatus.Cancelled) {
      messageObj.displayMessage = messageObj.message;
    }

    if (completionEventName != '') {
      PortalUtils.logEvent(`${this._copilotService.detectorCopilotChatIdentifier}-${completionEventName}`, '<not logging message content>', this._telemetryService);
    }

    return messageObj;
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

    this.copilotExitConfirmationHidden = true;
    this._copilotService.clearComponentSelection();
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

  //#endregion

  private getChatHeader(): string {
    return `
    <h1 class='copilot-header chatui-header-text'>
      ${this.featureTitle}
      <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    </h1>`;
  }
}
