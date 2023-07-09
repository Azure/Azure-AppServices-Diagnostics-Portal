import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PanelType } from 'office-ui-fabric-react';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';
import { ChatUIContextService, StringUtilities } from 'diagnostic-data';

@Injectable({
  providedIn: 'root'
})
export class DetectorCopilotService {

  public openPanel: boolean;
  public panelType: PanelType = PanelType.custom;
  public panelWidth: string = "720px";
  public isGist: boolean = false;
  public detectorCode: string = '';
  public detectorTemplate: string = '';
  public detectorDevelopMode: DevelopMode;
  public azureServiceType: string;
  public detectorAuthor: string;
  public operationInProgress: boolean = false;
  public codeHistory: string[] = [];
  public codeHistoryNavigator: number = -1;
  public onCodeSuggestion: BehaviorSubject<{ code: string, append: boolean, source: string }>;
  public onCloseCopilotPanelEvent: BehaviorSubject<{ showConfirmation: boolean, resetCopilot: boolean }>;
  public onCodeOperationProgressState: BehaviorSubject<{ inProgress: boolean }>;
  public chatComponentIdentifier: string = 'detectorcopilot';
  public copilotHeaderTitle: string;
  public copilotChatHeader: string;
  public chatConfigFile: string = 'assets/chatConfigs/detectorcopilot.json';

  constructor(private _chatContextService: ChatUIContextService) {
    this.onCodeSuggestion = new BehaviorSubject<{ code: string, append: boolean, source: string }>(null);
    this.onCloseCopilotPanelEvent = new BehaviorSubject<{ showConfirmation: boolean, resetCopilot: boolean }>(null);
    this.onCodeOperationProgressState = new BehaviorSubject<{ inProgress: boolean }>(null);
  }

  hideCopilotPanel() {
    this.openPanel = false;
  }

  showCopilotPanel() {
    this.openPanel = true;
  }

  reset() {
    this.onCodeSuggestion = new BehaviorSubject<{ code: string, append: boolean, source: string }>(null);
    this.onCodeOperationProgressState = new BehaviorSubject<{ inProgress: boolean }>(null);
    this.clearCodeHistory();
    this._chatContextService.clearChat(this.chatComponentIdentifier);
  }

  navigateCodeHistory = (moveLeft: boolean): void => {

    if ((moveLeft && this.codeHistoryNavigator <= 0) || (!moveLeft && this.codeHistoryNavigator >= this.codeHistory.length - 1))
      return;

    // Save the current code in the history if there were changes
    this.updateCodeHistory(`<code>\n${this.detectorCode}\n</code>`);

    moveLeft ? this.codeHistoryNavigator-- : this.codeHistoryNavigator++;

    this.onCodeSuggestion.next({
      code: this.codeHistory[this.codeHistoryNavigator],
      append: false,
      source: 'historynavigator'
    });
  }

  updateCodeHistory = (messageString: string) => {

    if (this.isMessageContainsCode(messageString)) {
      let codeToAdd = this.extractCode(messageString);
      let codeExistsInHistoryIndex = this.codeHistory.findIndex(p => StringUtilities.Equals(p, codeToAdd));
      if (codeExistsInHistoryIndex == -1) {
        this.codeHistory.push(codeToAdd);
        this.codeHistoryNavigator = this.codeHistory.length - 1;
      }
    }
  }

  clearCodeHistory = () => {
    this.codeHistory = [];
    this.codeHistoryNavigator = -1;
  }

  isMessageContainsCode(message: string): boolean {
    return message && message != '' && (message.toLowerCase().startsWith('<$>'));
  }

  extractCode(message: string): string {
    let stringsToRemove = ['<$>\n', '<$>'];
    let outputMessage = message;
    stringsToRemove.forEach(p => {
      outputMessage = StringUtilities.ReplaceAll(outputMessage, p, '');
    });

    return outputMessage;
  }

  initializeMembers(isGistMode: boolean) {

    this.isGist = isGistMode;
    
    if (isGistMode) {
      this.chatComponentIdentifier = 'gistcopilot';
      this.copilotHeaderTitle = 'Gist Copilot (Preview)';
      this.chatConfigFile = 'assets/chatConfigs/gistcopilot.json';
    }
    else {
      this.chatComponentIdentifier = 'detectorcopilot';
      this.copilotHeaderTitle = 'Detector Copilot (Preview)';
      this.chatConfigFile = 'assets/chatConfigs/detectorcopilot.json';
    }

    this.copilotChatHeader = `
    <h1 class='copilot-header chatui-header-text'>
      <!--<i data-icon-name="robot" aria-hidden="true" class="ms-Icon root-89 css-229 ms-Button-icon"></i>-->
      <img  class='copilot-header-img' src="/assets/img/bot_sparkle_icon.svg" alt = ''>
      ${this.copilotHeaderTitle}
      <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
      <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''">
    </h1>`;
  }
}