import { Component, Inject, Input, OnInit, Output, EventEmitter, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { ChatMessage, MessageSource, ChatUIContextService} from "diagnostic-data";
import { v4 as uuid } from 'uuid';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { AdalService } from 'adal-angular4';
import { UserSettingService } from '../services/user-setting.service';
import { ResourceProviderMessages, UserChatGPTSetting } from '../../../shared/models/user-setting';
import { ResourceService } from '../../../shared/services/resource.service';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { TimeUtilities } from '../../../../../../diagnostic-data/src/public_api';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
    selector: 'applens-openai-chat',
    templateUrl: './applens-openai-chat.component.html',
    styleUrls: ['./applens-openai-chat.component.scss']
})

export class ApplensOpenAIChatComponent implements OnInit {

  userPhotoSource: string = '';
  userNameInitial: string = '';
  chatHeader: string = `<h1 class='chatui-header-text'>AppLens <img src="/assets/img/handshakelogo.png" class='chatui-center-logo'/> ChatGPT</h1>`;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router,
    private _openAIService: ApplensOpenAIChatService,
    private _diagnosticApiService: DiagnosticApiService,
    private _adalService: AdalService,
    private _userSettingService: UserSettingService,
    private _resourceService: ResourceService,
    private _telemetryService: TelemetryService,
    public _chatUIContextService: ChatUIContextService) {
  }

  // Variables to be passed down to the OpenAI Chat component
  chatComponentIdentifier: string = "AppLensChatGPT";
  showContentDisclaimer: boolean = true;
  contentDisclaimerMessage: string = "* Please do not send any sensitive data in your queries. Please verify the response before sending to customers.";

  userAlias: string = '';
  userChatGPTSetting: UserChatGPTSetting;
  
  // Variables that can be taken as input
  dailyMessageQuota: number = 20;
  messageQuotaWarningThreshold: number = 10;
  
  originalResourceProvider: string;
  currentResourceProvider: string;
  
  // Component's internal variables
  isEnabled: boolean = false;
  isEnabledChecked: boolean = false;
  displayLoader: boolean = false;
  chatgptSearchText: string = "";
    
  ngOnInit() {
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

  loadUserChat = (chatIdentifier: string) => {
    return this._userSettingService.getUserSetting(true, true).pipe(map(settings => {
      this.userChatGPTSetting = settings.userChatGPTSetting && settings.userChatGPTSetting.length>0? JSON.parse(settings.userChatGPTSetting): {
        allMessages: [],
        messageDailyCount: 0
      };
      if (this.userChatGPTSetting && this.userChatGPTSetting.allMessages && this.userChatGPTSetting.allMessages.length > 0) {
        this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.
                                  messages.forEach((m: ChatMessage) => {m.messageDisplayDate = TimeUtilities.displayMessageDate(new Date(m.timestamp)); if (m.displayMessage == undefined) {m.displayMessage = m.message;}});
        let messages = this.userChatGPTSetting.allMessages.find(rm => rm.resourceProvider==this.currentResourceProvider)?.messages??[];
        return messages;
      }
      return [];
    }));
  }

  saveUserChat = (chatIdentifier: string, chat: ChatMessage[]) => {
    let idx = this.userChatGPTSetting.allMessages.findIndex(t => t.resourceProvider == this.currentResourceProvider);
    if (idx >= 0) {
      this.userChatGPTSetting.allMessages[idx].messages = chat;
    }
    else {
      this.userChatGPTSetting.allMessages.push({resourceProvider: this.currentResourceProvider, messages: chat});
    }
    this.userChatGPTSetting.messageDailyCount = this.userChatGPTSetting.allMessages.
                                                    map((rm: ResourceProviderMessages) => rm.messages.filter((m: ChatMessage) => m.messageSource == MessageSource.User && TimeUtilities.checkSameDay(m.timestamp)).length).
                                                    reduce((partialSum, a) => partialSum + a, 0);
    return this._userSettingService.updateUserChatGPTSetting(this.userChatGPTSetting).pipe(map(settings => {
      this.userChatGPTSetting = JSON.parse(settings.userChatGPTSetting);
    }));
  }
}  
