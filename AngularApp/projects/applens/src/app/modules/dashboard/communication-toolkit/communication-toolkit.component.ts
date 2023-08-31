import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { IBreadcrumbItem, IBreadcrumbProps, SpinnerSize } from 'office-ui-fabric-react';
import { delay } from 'rxjs-compat/operator/delay';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { TelemetryService, ChatUIContextService, TelemetryEventNames, ChatMessage, OpenAIChatComponent, APIProtocol, ChatModel } from 'diagnostic-data';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { UserSettingService } from '../services/user-setting.service';
import { UserChatGPTSetting } from '../../../shared/models/user-setting';
import { ClipboardService } from 'projects/diagnostic-data/src/lib/services/clipboard.service';
import { CustomCommandBarButtons } from 'projects/diagnostic-data/src/lib/models/openai-chat-container-models';
import { PortalUtils } from '../../../shared/utilities/portal-util';

@Component({
  selector: 'communication-toolkit',
  templateUrl: './communication-toolkit.component.html',
  styleUrls: ['./communication-toolkit.component.scss']
})

export class CommunicationToolkitComponent implements OnInit {
  @ViewChild('chatbot') OpenAICHATComponentRef: OpenAIChatComponent;

  userPhotoSource: string = '';
  userNameInitial: string = '';
  chatHeader: string = `<h1 class='chatui-header-text'><b>RCA Co-Pilot</b>!</h1>`;

  // Variables to be passed down to the OpenAI Chat component
  chatComponentIdentifier: string = "rcacopilot";
  showContentDisclaimer: boolean = true;
  contentDisclaimerMessage: string = "*Please VERIFY the RCA before sending to customers. I'm still learning :). Don't send any sensitive data.";

  userAlias: string = '';
  userChatGPTSetting: UserChatGPTSetting;
  
  // Variables that can be taken as input
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  
  originalResourceProvider: string;
  currentResourceProvider: string; 
  customFirstMessageEdit: string = ""; 

  chatQuerySamplesFileURIPath = "assets/chatConfigs/rcacopilot.json"; 
  apiProtocol : APIProtocol = APIProtocol.WebSocket; 
  inputTextLimit = 1000;
  showCopyOption = true; 
  chatModel: ChatModel = ChatModel.GPT4; 
  chatContainerHeight: string = '72vh';

  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  chatgptSearchText: string = "";
  
  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: ApplensOpenAIChatService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    private _userSettingService: UserSettingService,
    private _resourceService: ResourceService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService,
    private _clipboard: ClipboardService) { 

  }

  ngOnInit(): void {
    this.originalResourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    
    if (this.originalResourceProvider === 'microsoft.web/sites') {
      this.currentResourceProvider = `${this.originalResourceProvider}${this._resourceService.displayName}`;
    }
    else {
      this.currentResourceProvider = this.originalResourceProvider;
    }
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.isEnabled = this._openAIService.isEnabled;
      this.isEnabledChecked = true;
      if (this.isEnabled) {
        this._telemetryService.logEvent(TelemetryEventNames.ChatGPTLoaded, { "resourceProvider": this.currentResourceProvider, ts: new Date().getTime().toString()});
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

//custom copy method/callback 
  copyChatGPTClicked = (textToCopy: string) => {
    this._clipboard.copyAsHtml(textToCopy);
    PortalUtils.logEvent("rcacopilot-messagecopied", textToCopy, this._telemetryService); 
  }

  //windows users control c for keyboard c 
  @HostListener('window:keydown.control.c') //windows
  copyFromKeyboardClickedWithControlC(){
    PortalUtils.logEvent("rcacopilot-messagecopied", "Copied From Keyboard with Control C", this._telemetryService); 
  }

  //mac users command c for keyboard copy
  @HostListener('window:keydown.command.c') //mac users
  copyFromKeyboardClickedWithCommandC(){
    PortalUtils.logEvent("rcacopilot-messagecopied", "Copied from keyboard Command C", this._telemetryService); 
  }

}
