import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DevelopMode } from '../../onboarding-flow/onboarding-flow.component';
import { ChatUIContextService, StringUtilities } from 'diagnostic-data';
import { ApplensCopilotContainerService, CopilotSupportedFeature } from './applens-copilot-container.service';

@Injectable()
export class ApplensDetectorDevelopmentCopilotService {

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
  public onCodeOperationProgressState: BehaviorSubject<{ inProgress: boolean }>;
  public chatComponentIdentifier: string = 'detectorcopilot';
  public copilotChatHeader: string;
  public chatConfigFile: string = 'assets/chatConfigs/detectorcopilot/detectordevcopilot.json';
  public logPrefix: string = 'DetectorCopilot';

  constructor(private _chatContextService: ChatUIContextService, private _copilotContainerService: ApplensCopilotContainerService) {
    this.onCodeSuggestion = new BehaviorSubject<{ code: string, append: boolean, source: string }>(null);
    this.onCodeOperationProgressState = new BehaviorSubject<{ inProgress: boolean }>(null);
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
      this._copilotContainerService.feature = CopilotSupportedFeature.GistDevelopmentTab;
      this.chatComponentIdentifier = 'gistcopilot';
      this._copilotContainerService.copilotHeaderTitle = 'Gist Copilot (Preview)';
    }
    else {
      this._copilotContainerService.feature = CopilotSupportedFeature.DetectorDevelopmentTab;
      this.chatComponentIdentifier = 'detectordevcopilot';
      this._copilotContainerService.copilotHeaderTitle = 'Detector Copilot (Preview)';
    }

    this.chatConfigFile = `assets/chatConfigs/detectorcopilot/${this.chatComponentIdentifier}.json`;
    this.logPrefix = this.chatComponentIdentifier;

    this.copilotChatHeader = `
    <h1 class='copilot-header chatui-header-text'>
      ${this._copilotContainerService.copilotHeaderTitle}
      <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    </h1>`;
  }
}