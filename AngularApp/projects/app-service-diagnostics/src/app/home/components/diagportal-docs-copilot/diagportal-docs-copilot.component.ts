import { Component, OnInit } from '@angular/core';
import { DiagPortalOpenAIService } from '../../../shared-v2/services/diagportal-openai-chat.service';
import { TelemetryService, ChatUIContextService, TelemetryEventNames, ChatMessage, APIProtocol, ChatModel } from 'diagnostic-data';
import { StringUtilities } from '../../../../../../diagnostic-data/src/public_api';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Component({
  selector: 'diagportal-docs-copilot',
  templateUrl: './diagportal-docs-copilot.component.html',
  styleUrls: ['./diagportal-docs-copilot.component.scss']
})

export class DiagPortalDocsCopilotComponent implements OnInit {
  userNameInitial: string = 'JD';
  chatHeader: string = '';

  // Variables to be passed down to the OpenAI Chat component
  chatComponentIdentifier: string = "docscopilot";
  showContentDisclaimer: boolean = true;
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries...I'm still learning :)";

  // Variables that can be taken as input
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  
  customFirstMessageEdit: string = ""; 

  chatQuerySamplesFileURIPath = "assets/chatConfigs/docscopilot.json"; 
  apiProtocol : APIProtocol = APIProtocol.WebSocket; 
  inputTextLimit = 1000;
  showCopyOption = true; 
  chatModel: ChatModel = ChatModel.GPT4; 

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  chatgptSearchText: string = "";
  azureServiceName: string = '';
  azureServiceNameLowercase: string = '';

  postProcessingLinks = (chatMessage: ChatMessage) => {
    chatMessage.displayMessage = StringUtilities.markdownToHtmlWithTargetBlank(chatMessage.message);
    return chatMessage;
  }
  
  constructor(
    private _openAIService: DiagPortalOpenAIService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService,
    private _resourceService: ResourceService) { 
      this.azureServiceName = this._resourceService.azureServiceName;
      this.azureServiceNameLowercase = this.azureServiceName.toLowerCase().replace(/ /g,'');
      this.chatHeader = `<h1 class='chatui-header-text'><b>Documentation Copilot for ${this.azureServiceName}</b></h1>`
  }

  ngOnInit(): void {
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent("DiagPortalDocsCopilotLoaded", { ts: new Date().getTime().toString()});
      }
    },
    (err) => {
      this.isEnabled = false;
    });
  }
}
