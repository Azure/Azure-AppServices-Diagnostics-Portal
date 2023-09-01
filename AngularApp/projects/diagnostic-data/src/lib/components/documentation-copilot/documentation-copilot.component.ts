import { Component, OnInit } from '@angular/core';
import { GenericDocumentationCopilotService } from '../../services/generic-documentation-copilot.service';
import { TelemetryService, TelemetryEventNames, ChatMessage, APIProtocol, ChatModel } from '../../../public_api';
import { StringUtilities } from '../../utilities/string-utilities';
import { GenericResourceService } from '../../services/generic-resource-service';
import { ChatUIContextService } from '../../services/chatui-context.service';

@Component({
  selector: 'documentation-copilot',
  templateUrl: './documentation-copilot.component.html',
  styleUrls: ['./documentation-copilot.component.scss']
})

export class DocumentationCopilotComponent implements OnInit {
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
    private _documentationCopilotService: GenericDocumentationCopilotService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService,
    private _resourceService: GenericResourceService) { 
      this._chatUIContextService.userPhotoSource = "/assets/img/user_question_icon.svg";
      this.azureServiceName = this._resourceService?.armResourceConfig?.azureServiceName?? 'Azure';
      this.azureServiceNameLowercase = this.azureServiceName.toLowerCase().replace(/ /g,'');
      this.chatHeader = `<h1 class='chatui-header-text'><b>Documentation Copilot for ${this.azureServiceName}</b></h1>`
  }

  ngOnInit(): void {
    this._documentationCopilotService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._documentationCopilotService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent("DocumentationCopilotLoaded", { ts: new Date().getTime().toString()});
      }
    },
    (err) => {
      this.isEnabled = false;
    });
  }
}
