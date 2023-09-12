import { Component, OnInit, OnDestroy } from '@angular/core';
import { APIProtocol, ChatMessage, ChatModel, ChatUIContextService, MessageSource, MessageStatus, ResponseTokensSize, StringUtilities, TelemetryService } from 'diagnostic-data';
import { Subscription } from 'rxjs';
import { ApplensDetectorDevelopmentCopilotService } from '../../services/copilot/applens-detector-development-copilot.service';
import { ApplensCopilotContainerService } from '../../services/copilot/applens-copilot-container.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'projects/applens/src/environments/environment';
import { PortalUtils } from '../../../../shared/utilities/portal-util';

@Component({
  selector: 'detector-development-copilot',
  templateUrl: './detector-development-copilot.component.html',
  styleUrls: ['./detector-development-copilot.component.scss']
})
export class DetectorDevelopmentCopilotComponent implements OnInit, OnDestroy {

  contentDisclaimerMessage: string = "I'm biased towards coding; mention 'no code' for other help and avoid sensitive data :)";
  chatModel: ChatModel = ChatModel.GPT4;
  apiProtocol: APIProtocol = APIProtocol.WebSocket;
  responseTokenSize: ResponseTokensSize = ResponseTokensSize.Small;
  previousMessage: any;
  stopMessageGeneration: boolean = false;
  clearChatConfirmationHidden: boolean = true;
  copilotExitConfirmationHidden: boolean = true;

  private codeUsedInPrompt: string;
  private maxLinesLimitForCodeUpdate: number = 100;

  private codeProgressMessages: string[] = [];
  private codeCompleteMessages: string[] = [];
  private codeProgressMsgIndex: number = 0;
  private codeCompleteMsgIndex: number = 0;

  private lastMessageIdForFeedback: string = '';

  constructor(public _chatContextService: ChatUIContextService, public _copilotService: ApplensDetectorDevelopmentCopilotService, public _copilotContainerService: ApplensCopilotContainerService, private telemetryService: TelemetryService, private http: HttpClient) {
  }

  ngOnInit(): void {
    this.prepareCodeUpdateMessages();
    this.log('OnInit', 'initialization complete');
  }

  ngOnDestroy() {
    this.log('OnDestroy', 'ondestroy complete');
  }

  handleCloseCopilotEvent(event: any) {
    if (event) {
      this.checkMessageStateAndExitCopilot(event.showConfirmation);
      setTimeout(() => {
        if (event.resetCopilot) {
          this._copilotService.reset();
          this.log('OnClose', 'copilot reset complete');
        }
      }, 1000);
    }
  }

  //#region Chat Callback Methods

  onUserMessageSend = (messageObj: ChatMessage): ChatMessage => {

    if (this.responseTokenSize != ResponseTokensSize.Medium) {
      this.responseTokenSize = ResponseTokensSize.Medium;
    }

    messageObj.message = this.formatUserMessage(messageObj);
    this._copilotService.operationInProgress = true;

    // Save the current code in the history if there were changes
    this._copilotService.updateCodeHistory(`<$>\n${this._copilotService.detectorCode}`);

    // At this point, we dont know whether user has asked for code or not.
    // To be safe, we will disable the editor and it will get reenabled as soon as first non code response is received.
    this._copilotService.onCodeOperationProgressState.next({ inProgress: true });

    this.log('OnMessageSent', `${messageObj.displayMessage}, id: ${messageObj.id}`);
    this.lastMessageIdForFeedback = messageObj.id;
    return messageObj;
  }

  onSystemMessageReceived = (messageObj: ChatMessage): ChatMessage => {

    var deltaMessage = '';
    var append: boolean;

    if (this.responseTokenSize != ResponseTokensSize.Medium) {
      this.responseTokenSize = ResponseTokensSize.Medium;
    }

    if (this.previousMessage == undefined) {
      deltaMessage = messageObj.message;
      append = false;
    }
    else {
      deltaMessage = StringUtilities.ReplaceAll(messageObj.message, this.previousMessage.message, '');
      append = true;
    }

    let isMessageContainsCode: boolean = this._copilotService.isMessageContainsCode(messageObj.message);

    if (isMessageContainsCode && deltaMessage != '') {

      // indicate the monaco-editor to start updating the code
      this._copilotService.onCodeSuggestion.next({
        code: this._copilotService.extractCode(deltaMessage),
        append: append,
        source: 'openai'
      });

      let codeUpdateOperationInProgress = messageObj.status == MessageStatus.InProgress ? true : false;
      this._copilotService.onCodeOperationProgressState.next({ inProgress: codeUpdateOperationInProgress });
    }
    else {
      this._copilotService.onCodeOperationProgressState.next({ inProgress: false });
    }

    var displayMsg = messageObj.message;

    switch (messageObj.status) {

      case MessageStatus.InProgress: {

        if (isMessageContainsCode) {
          if (messageObj.displayMessage == undefined || messageObj.displayMessage == '') {
            // assign a new code update message
            displayMsg = `${this.codeProgressMessages[this.codeProgressMsgIndex]}\n...`;
            this.codeProgressMsgIndex = (this.codeProgressMsgIndex + 1) % this.codeProgressMessages.length;
          } else {
            // retain the previous code update message
            displayMsg = messageObj.displayMessage;
          }
        }

        this._copilotService.operationInProgress = true;
        this.previousMessage = {
          id: messageObj.id,
          status: messageObj.status,
          message: messageObj.message,
          displayMessage: displayMsg
        };

        break;
      }
      case MessageStatus.Finished: {

        if (isMessageContainsCode) {

          if (messageObj.displayMessage != undefined && messageObj.displayMessage != '') {
            displayMsg = `${messageObj.displayMessage}\n...\n${this.codeCompleteMessages[this.codeCompleteMsgIndex]}`;

          }
          else {
            displayMsg = `${this.codeCompleteMessages[this.codeCompleteMsgIndex]}`;
          }

          this.codeCompleteMsgIndex = (this.codeCompleteMsgIndex + 1) % this.codeCompleteMessages.length;
          this._copilotService.updateCodeHistory(messageObj.message);
        }

        this._copilotService.operationInProgress = false;
        this.previousMessage = undefined;
        this.responseTokenSize = ResponseTokensSize.Small;
        this.log('OnMessageReceived', `message completed. type : ${isMessageContainsCode ? 'codeupdate' : 'chatresponse'}`);

        break;
      }
      case MessageStatus.Cancelled: {

        if (isMessageContainsCode) {

          this._copilotService.updateCodeHistory(messageObj.message);
        }

        // open-ai component is already either assigning or appending  cancellation message to the existing message string. 
        displayMsg = messageObj.displayMessage;
        this._copilotService.operationInProgress = false;
        this.previousMessage = undefined;
        this.responseTokenSize = ResponseTokensSize.Small;
        this.log('OnMessageCancelled', `message cancel completed. type : ${isMessageContainsCode ? 'codeupdate' : 'chatresponse'}`);

        break;
      }
    }

    messageObj.displayMessage = displayMsg;
    return messageObj;
  }

  onPrepareChatContext = (chatContext: any): any => {

    let lastMessage: ChatMessage = this._chatContextService.messageStore[this._copilotService.chatComponentIdentifier].at(-1);
    if (lastMessage.messageSource == MessageSource.System && lastMessage.status == MessageStatus.InProgress) {
      let lastLine = lastMessage.message.split('\n').slice(-1);

      var artificialUserMsg = `Finish the previous message fully and preserve white spaces. Make sure you start the new message with characters right after where the above message ended at '${lastLine}'. Only tell me the remaining message and not the previous message again.`;

      chatContext.push({
        "role": "User",
        "content": artificialUserMsg
      });
    }

    return chatContext;
  }

  //#endregion

  //#region Settings : Clear Chat Methods

  clearChat = () => {
    this._chatContextService.clearChat(this._copilotService.chatComponentIdentifier);
    this.clearChatConfirmationHidden = true;
  }

  showClearChatDialog = (show: boolean = true) => {
    this.clearChatConfirmationHidden = !show;
  }
  //#endregion

  //#region Settings : Stop Option

  cancelOpenAICall = () => {

    this.stopMessageGeneration = true;

    setTimeout(() => {
      this.stopMessageGeneration = false;
    }, 1000);
  }

  //#endregion

  //#region Settings : Feedback option

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

  //#region Copilot Exit Methods

  showExitConfirmationDialog = (show: boolean = true) => {
    this.copilotExitConfirmationHidden = !show;
  }

  exitCopilot = (cancelOpenAICall: boolean = true) => {

    if (cancelOpenAICall) {
      this.cancelOpenAICall();
    }

    this._copilotService.operationInProgress = false;
    this._copilotService.onCodeOperationProgressState.next({ inProgress: false });
    this.copilotExitConfirmationHidden = true;
    this._copilotContainerService.hideCopilotPanel();
    this.log('OnClose', 'copilot panel closed');
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

  //#region Helper Methods

  private formatUserMessage(chatMessageObj: ChatMessage): string {

    this.codeUsedInPrompt = this._copilotService.detectorCode &&
      this._copilotService.detectorCode != '' &&
      !StringUtilities.Equals(this._copilotService.detectorCode, this._copilotService.detectorTemplate) ?
      this._copilotService.detectorCode : '';

    let message = this.codeUsedInPrompt != '' ?
      `Here is the initial ${this._copilotService.isGist ? 'gist' : 'detector'} code : \n <$>\n${this.codeUsedInPrompt}\n` : '';

    message = `${message}Action you need to take : ${chatMessageObj.message}\n`;

    if (this.codeUsedInPrompt == '') {
      // The user is writing code for first time. Pass in the service name and author
      message = `${message}This Azure service name is ${this._copilotService.azureServiceType} and author is ${this._copilotService.detectorAuthor}\n`;
    }

    let linesCountInCode = this.codeUsedInPrompt != '' ? this.codeUsedInPrompt.split("\n").length : 0;
    let rules = `1. If you are responding with code, No need to write any explanation before or after the code. Just respond with the updated code.
    2. Always start the code with '<$>' line.
    3. Dont have extra white spaces at the end of the every lines of code. Make sure the code is properly linted.`;

    if (linesCountInCode > this.maxLinesLimitForCodeUpdate) {
      rules = `1. If you are responding with code, Dont respond with the entire code. Only give the code that needs to be added, deleted or updated.
      2. Also give the correct line numbers information.
      3. The output should be rendered in markdown`;
    }

    message = `${message}Rules you have to follow :\n ${rules}`;
    return message;
  }

  private prepareCodeUpdateMessages = () => {

    this.http.get<any>(this._copilotService.chatConfigFile).subscribe(res => {
      this.codeProgressMessages = res?.codeProgressMessages?.length > 0 ?
        res.codeProgressMessages : ['Please wait while I am updating your code'];

      this.codeCompleteMessages = res?.codeCompleteMessages?.length > 0 ?
        res.codeCompleteMessages : ['code update completed'];

      this.codeProgressMessages = StringUtilities.shuffleArray<string>(this.codeProgressMessages);
      this.codeCompleteMessages = StringUtilities.shuffleArray<string>(this.codeCompleteMessages);
    });
  }

  private log = (event: string, message: string) => {

    let eventStr = `${this._copilotService.logPrefix}-${event}`;
    let time = new Date().getTime().toString();
    if (environment.production) {
      this.telemetryService.logEvent(eventStr, { message: message, ts: time });
    }
    else {
      console.log(`event: ${eventStr}, message: ${message}, ts: ${time}`);
    }
  }
  //#endregion
}
