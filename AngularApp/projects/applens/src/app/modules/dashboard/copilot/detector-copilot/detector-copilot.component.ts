import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplensCopilotContainerService } from '../../services/copilot/applens-copilot-container.service';
import { ApplensDetectorCopilotService } from '../../services/copilot/applens-detector-copilot.service';
import { APIProtocol, ChatMessage, ChatModel, MessageStatus } from 'diagnostic-data';

@Component({
  selector: 'detector-copilot',
  templateUrl: './detector-copilot.component.html',
  styleUrls: ['./detector-copilot.component.scss']
})
export class DetectorCopilotComponent implements OnInit, OnDestroy {

  contentDisclaimerMessage: string = "Please review the AI-Generated results for correctness. Dont send any sensitive data.";
  chatModel: ChatModel = ChatModel.GPT4;
  apiProtocol: APIProtocol = APIProtocol.WebSocket;
  chatHeader: string = '<h2>Detector Copilot</h2>';

  messageBarStyles: any = {
    root: {
        height: '40px'
        // backgroundColor: this.resolvedIssueMessageBarBGColor
    }
}
  constructor(public _copilotContainerService: ApplensCopilotContainerService, public _copilotService: ApplensDetectorCopilotService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = true;
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    this._copilotService.operationInProgress = (messageObj.status == MessageStatus.Finished || messageObj.status == MessageStatus.Cancelled);
    messageObj.displayMessage = messageObj.message;
    return messageObj;
  }

  testFn() {
    // Just used in fab command bar until I replace it with real methods
  }
}
