import { Component, OnInit } from '@angular/core';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { AdalService } from 'adal-angular4';
import { TelemetryService, ChatUIContextService, TelemetryEventNames, ChatMessage, APIProtocol, ChatModel } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { StringUtilities } from '../../../../../../diagnostic-data/src/public_api';

@Component({
  selector: 'applens-docs-copilot',
  templateUrl: './applens-docs-copilot.component.html',
  styleUrls: ['./applens-docs-copilot.component.scss']
})

export class ApplensDocsCopilotComponent implements OnInit {
  userPhotoSource: string = '';
  userNameInitial: string = '';
  chatHeader: string = `<h1 class='chatui-header-text'><b>Ask AppLens</b></h1>`;

  // Variables to be passed down to the OpenAI Chat component
  chatComponentIdentifier: string = "applensdocscopilot";
  showContentDisclaimer: boolean = true;
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries...I'm still learning :)";

  userAlias: string = '';
  // Variables that can be taken as input
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  
  customFirstMessageEdit: string = ""; 

  chatQuerySamplesFileURIPath = "assets/chatConfigs/applensdocscopilot.json"; 
  apiProtocol : APIProtocol = APIProtocol.WebSocket; 
  inputTextLimit = 1000;
  showCopyOption = true; 
  chatModel: ChatModel = ChatModel.GPT4; 

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  chatgptSearchText: string = "";

  postProcessingLinks = (chatMessage: ChatMessage) => {
    chatMessage.displayMessage = StringUtilities.markdownToHtmlWithTargetBlank(chatMessage.message);
    return chatMessage;
  }
  
  constructor(
    private _openAIService: ApplensOpenAIChatService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService) { 

  }

  ngOnInit(): void {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent("ApplensDocsCopilotLoaded", { ts: new Date().getTime().toString()});
      }
    });
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this.userAlias = userId;
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this._chatUIContextService.userPhotoSource = image;
    });

    if (this._adalService.userInfo.profile) {
      const familyName: string = this._adalService.userInfo.profile.family_name;
      const givenName: string = this._adalService.userInfo.profile.given_name;
      this._chatUIContextService.userNameInitial = `${givenName.charAt(0).toLocaleUpperCase()}${familyName.charAt(0).toLocaleUpperCase()}`;
    }
  }
}
