import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { GenieGlobals } from '../../services/genie.service';
import { ActionType, DiagSolutionBody, DiagSolutionType, Solution } from '../solution/solution';
import { SolutionService } from '../../services/solution.service';
import { Observable } from 'rxjs';
import { MockUpSolutionData } from './mockup-solution-data';
import { StringUtilities } from '../../utilities/string-utilities';
import { ChatMessage, MessageRenderingType, MessageSource, MessageStatus } from '../../models/chatbot-models';
import { TimeUtilities } from '../../utilities/time-utilities';
import { v4 as uuid } from 'uuid';

@Component({
  selector: 'diag-chat-solution',
  templateUrl: './diag-chat-solution.component.html',
  styleUrls: ['./diag-chat-solution.component.scss']
})
export class DiagChatSolutionComponent implements OnInit {
  DiagSolutionType = DiagSolutionType;
  solutionTitle: string = '';
  solutionDescription: string = '';
  solutionId: string = '';
  solutionBody: DiagSolutionBody;
  solutionType: DiagSolutionType = DiagSolutionType.Text;
  action: ActionType;

  buttonText: string = "";
  isActionLoading: boolean = false;



  @Input() set solutionString(solutionString: string) {
    this.solutionBody = <DiagSolutionBody>JSON.parse(solutionString);
    
    //For testing purposes
    //this.solutionBody = <DiagSolutionBody>JSON.parse(MockUpSolutionData.ArmApi);
    
    this.solutionType = this.solutionBody.SolutionInfo.Type;

    if (this.solutionType == DiagSolutionType.Action) {
      this.action = this.inferActionType(this.solutionBody.SolutionInfo.ActionableSolution);
    }
    this.processSolution();
  }

  @Output() OnSolutionActionFinish: EventEmitter<ChatMessage> = new EventEmitter<ChatMessage>();

  constructor(public globals: GenieGlobals, private _solutionService: SolutionService) {
  }

  ngOnInit(): void {
  }

  private processSolution() {
    switch (this.solutionType) {
      case DiagSolutionType.Text:
        this.solutionTitle = this.solutionBody.SolutionInfo.TextSolution.Title;
        this.solutionDescription = this.solutionBody.SolutionInfo.TextSolution.Description;
        this.buttonText = "";
        this.action = null;
        break;
      case DiagSolutionType.Action:
        this.solutionTitle = this.solutionBody.SolutionInfo.ActionableSolution.Title;
        this.solutionDescription = this.solutionBody.SolutionInfo.ActionableSolution.DescriptionMarkdown;
        this.action = this.inferActionType(this.solutionBody.SolutionInfo.ActionableSolution);
        this.buttonText = this.getActionButtonText(this.action);
        break;
      default:
        this.solutionTitle = '';
        this.solutionDescription = '';
        this.buttonText = "";
        this.action = null;
    }
  }

  private getActionButtonText(actionType: ActionType) {
    switch (actionType) {
      case (ActionType.ArmApi): {
        return 'Run Solution';
      }
      case (ActionType.GoToBlade): {
        return "Go to Solution";
      }
      case (ActionType.OpenTab): {
        return "Open Solution";
      }
      case (ActionType.ToggleStdoutSetting): {
        return 'Enable STDOUT Logging';
      }
      case (ActionType.Markdown):
      default: {
        return '';
      }
    }
  }


  private inferActionType(solution: Solution): ActionType {
    if (solution.ApiOptions != undefined) {
      return ActionType.ArmApi;
    }
    if (solution.BladeOptions != undefined) {
      return ActionType.GoToBlade;
    }
    if (solution.TabOptions != undefined) {
      return ActionType.OpenTab;
    }

    if (solution.OverrideOptions == undefined) {
      return ActionType.Markdown;
    }

    let overrideKeys = Object.keys(solution.OverrideOptions).map(key => key.toLowerCase());
    if (overrideKeys.indexOf('route') > -1) {
      return ActionType.ArmApi;
    }
    if (overrideKeys.indexOf('taburl') > -1) {
      return ActionType.OpenTab;
    }
    if (overrideKeys.indexOf('detailblade') > -1) {
      return ActionType.GoToBlade;
    }
    if (overrideKeys.indexOf('stdout') > -1) {
      return ActionType.ToggleStdoutSetting;
    }

    return ActionType.Markdown;
  }

  chooseAction(action: ActionType): Observable<any> {
    const resourceUri = this.solutionBody.SolutionInfo.ActionableSolution.ResourceUri;
    const overrideOptions = this.solutionBody.SolutionInfo.ActionableSolution.OverrideOptions ?? {};
    switch (action) {
      case (ActionType.ArmApi): {
        const actionOptions = this.solutionBody.SolutionInfo.ActionableSolution.ApiOptions;
        return this._solutionService.ArmApi(resourceUri, this.convertOptions(actionOptions, overrideOptions));
      }
      case (ActionType.GoToBlade): {
        const actionOptions = this.solutionBody.SolutionInfo.ActionableSolution.BladeOptions;
        return this._solutionService.GoToBlade(resourceUri, this.convertOptions(actionOptions, overrideOptions));
      }
      case (ActionType.OpenTab): {
        const actionOptions = this.solutionBody.SolutionInfo.ActionableSolution.TabOptions;
        return this._solutionService.OpenTabFromChat(resourceUri, this.convertOptions(actionOptions, overrideOptions));
      }
      case (ActionType.ToggleStdoutSetting): {
        return this._solutionService.ToggleStdoutSetting(resourceUri, overrideOptions);
      }
      default: {
        throw new Error(`ActionType ${action} does not have a corresponding action`);
      }
    }
  }

  perfSolutionAction() {
    this.isActionLoading = true;
    this.chooseAction(this.action).subscribe((result) => {
      this.isActionLoading = false;
      this.prepareSolutionFinished(true);
    }, (error) => {
      this.isActionLoading = false;
      this.prepareSolutionFinished(false, error);
    });
  }

  convertOptions(actionOptions: {}, solutionOverrideOptions: {}) {
    let overrideOptions = {};
    for (let key in actionOptions) {
      const lowerFirstCharKey = StringUtilities.LowerFirstChar(key);
      overrideOptions[lowerFirstCharKey] = actionOptions[key];
    }

    overrideOptions = { ...overrideOptions, ...solutionOverrideOptions };
    return overrideOptions;
  }

  prepareSolutionFinished(isSuccess: boolean, error: string = "") {
    let displayMessage = "";
    switch (this.action) {
      case ActionType.ArmApi:
        displayMessage = isSuccess ? `<div>Solution Ran Successfully</div>` : `<div style='color:red'>An error occurred while performing the action. Please try again.</div>`;
        break;
      case ActionType.ToggleStdoutSetting:
        displayMessage = isSuccess ? `<div>STDOUT Logging Enabled</div>` : `<div style='color:red'>An error occurred while enabling STDOUT Logging. Please try again.</div>`;
      default:
        displayMessage = "";
    }
    
    if(displayMessage != "") {
      const chatMessage: ChatMessage = {
        id: uuid(),
        message: error,
        displayMessage: displayMessage,
        messageSource: MessageSource.System,
        timestamp: new Date().getTime(),
        messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
        status: MessageStatus.Finished,
        userFeedback: "none",
        renderingType: MessageRenderingType.Markdown
      }
      this.OnSolutionActionFinish.emit(chatMessage);
    }
  }
}