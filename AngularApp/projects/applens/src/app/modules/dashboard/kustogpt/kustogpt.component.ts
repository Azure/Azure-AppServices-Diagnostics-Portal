import { Component } from '@angular/core';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { APIProtocol, ChatMessage, ChatModel, FeedbackOptions, StringUtilities, TelemetryService,KeyValuePair } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { ChatFeedbackAdditionalField, ChatFeedbackModel, ChatFeedbackPanelOpenParams, FeedbackExplanationModes } from '../../../shared/models/openAIChatFeedbackModel';
import { Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { SiteService } from '../../../shared/services/site.service';
import { ObserverSiteInfo } from '../../../shared/models/observer';
import { KustoUtilities } from 'projects/diagnostic-data/src/lib/utilities/kusto-utilities';
import { IDropdownOption, IDropdownProps } from 'office-ui-fabric-react';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent {

  public readonly apiProtocol = APIProtocol.WebSocket;
  public readonly chatModel = ChatModel.GPT4;
  public readonly expectedResponseLabelText:string = 'Expected response ( Kusto query only )';
  public readonly antaresAnalyticsChatIdentifier: string = 'analyticskustocopilot';
  public readonly genericKustoAssistantChatIdentifier = 'kustoqueryassistant';
  public readonly antaresClusterNamePlaceholderConst: string = '@AntaresStampKustoCluster';  
  public readonly antaresDatabaseNamePlaceholderConst: string = '@AnataresStampKustoDB';
  public readonly analyticsClusterNameConst:string = 'wawsaneus.eastus';
  public readonly analyticsDatabaseNameConst: string = 'wawsanprod';
  public readonly feedbackExplanationMode:FeedbackExplanationModes = FeedbackExplanationModes.Explanation;  
  public readonly chatIdentifierDropdownOptions: IDropdownOption[] = [
    {
      key: this.antaresAnalyticsChatIdentifier,
      text: 'Antares Analytics Kusto assistant',
      selected: true
    },
    {
      key: this.genericKustoAssistantChatIdentifier,
      text: 'Kusto assistant for this resource',
      selected: false
    }
  ];

  public readonly chatIdentifierDropdownWidth: IDropdownProps['styles'] = {
    root: {
      display:'flex'
    },
    dropdown:{
      marginLeft: '0.5em',
    },
    dropdownItemsWrapper: {
      maxHeight: '40vh',
      width: '50em'
    },
  };
  
  public feedbackPanelOpenState:ChatFeedbackPanelOpenParams = {isOpen:false, chatMessageId: null};
  public chatIdentifier:string = '';
  public clusterName: string = this.antaresClusterNamePlaceholderConst;
  public databaseName: string = this.antaresDatabaseNamePlaceholderConst;
  public antaresClusterName:string = '';
  public readonly antaresDatabaseName:string = 'wawsprod';
  public isAnalyticsCopilotAllowed = false;
  public isFeedbackSubmissionAllowed = false;
  public customInitialPrompt:string = '';
  public antaresStampName:string = '';
  private resource:any;
  public chatMessageKustoExecuteLink: { [chatId: string] : string; } = {};

  public additionalFields: ChatFeedbackAdditionalField[] = this.getAdditionalFieldsForChatFeedback(this.antaresClusterNamePlaceholderConst, this.antaresDatabaseNamePlaceholderConst); 

  public get chatQuerySamplesFileUri():string {
    return this.chatIdentifier? `assets/chatConfigs/${this.chatIdentifier}.json`: '';
  }

  public isFunctionApp:boolean = false;

  private getAdditionalFieldsForChatFeedback(clusterName:string, databaseName:string):ChatFeedbackAdditionalField[] {
    return [{
        id: 'clusterName',
        labelText: 'Cluster Name',
        value: clusterName,
        defaultValue: clusterName,
        isMultiline: false
      },
      {
        id: 'databaseName',
        labelText: 'Database Name',
        value: databaseName,
        defaultValue: databaseName,
        isMultiline: false
      }
    ];
  }

  private getUserId() {
    let alias: string = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    const userId: string = alias.replace('@microsoft.com', '');
    return userId;
  }

  private updateFeedbackSubmissionStatus(chatIdentifier:string) {
    if(chatIdentifier) {
      this._diagnosticApiService.isFeedbackSubmissionEnabled(`${this._resourceService.ArmResource.provider}`,`${this._resourceService.ArmResource.resourceTypeName}`, chatIdentifier).subscribe((isFeedbackSubmissionEnabled) => {
        this.isFeedbackSubmissionAllowed = isFeedbackSubmissionEnabled;
      }, (error) => {
        this.isFeedbackSubmissionAllowed = false;
        this._telemetryService.logException(error, 'kustogpt_updateFeedbackSubmissionStatus_isFeedbackSubmissionEnabled', {armId: this._resourceService.getCurrentResourceId(false), userId: this.getUserId(), message: 'Error getting feedback submission enablement status. Defaulting to disabled.'});
        console.error('Error getting feedback submission enablement status. Defaulting to disabled.');
      });
    }
    else {
      this.isFeedbackSubmissionAllowed = false;
    }
  }

  public updateChatIdentifierDropdownOptions(event: any) {
    this.chatIdentifier = event.option.key;
    this.prepareChatHeader();
    this.updateFeedbackSubmissionStatus(this.chatIdentifier);
    if (this.chatIdentifier == this.antaresAnalyticsChatIdentifier) {
      this.clusterName =  this.analyticsClusterNameConst;
      this.databaseName = this.analyticsDatabaseNameConst;
      this.additionalFields = this.getAdditionalFieldsForChatFeedback(this.analyticsClusterNameConst, this.analyticsDatabaseNameConst);
      this.customInitialPrompt = '';
    }
    else {
      // This dropdown is visible only for Microsoft.Web/sites resources, so it is safe to assume that the other selection is for an Antares site resource.
      this.clusterName = this.antaresClusterName? this.antaresClusterName : this.antaresClusterNamePlaceholderConst;
      this.databaseName = this.antaresClusterName? this.antaresDatabaseName : this.antaresDatabaseNamePlaceholderConst;
      this.additionalFields = this.getAdditionalFieldsForChatFeedback(this.antaresClusterNamePlaceholderConst, this.antaresDatabaseNamePlaceholderConst);
      this.customInitialPrompt = this.antaresStampName ? `EventPrimaryStampName = '${this.antaresStampName}'` : '';
    }
  }

  public onDismissed(feedbackModel:ChatFeedbackModel) {
    this.feedbackPanelOpenState = {
      isOpen: false,
      chatMessageId: null
    };
  }

  private isAntaresStampCluster(clusterName:string): boolean {
    // Might be different for NClouds
    return clusterName && ((clusterName.toLowerCase().trim() != this.analyticsClusterNameConst && clusterName.toLowerCase().trim().startsWith('waws')) || clusterName.toLowerCase().trim() == this.antaresClusterNamePlaceholderConst.toLowerCase());
  }

  private isAntaresStampDatabase(databaseName:string): boolean {
    // Might be different for NClouds
    return databaseName && ((databaseName.toLowerCase().trim() != this.analyticsDatabaseNameConst && databaseName.toLowerCase().trim().startsWith('waws')) || databaseName.toLowerCase().trim() == this.antaresDatabaseNamePlaceholderConst.toLowerCase());
  }

  onBeforeSubmit = (chatFeedbackModel:ChatFeedbackModel): Observable<ChatFeedbackModel> => {
    if(chatFeedbackModel && chatFeedbackModel.expectedResponse && !StringUtilities.IsNullOrWhiteSpace(chatFeedbackModel.expectedResponse) && chatFeedbackModel.expectedResponse.length < 5) {
      chatFeedbackModel.validationStatus.succeeded = false;
      chatFeedbackModel.validationStatus.validationStatusResponse = 'Response must be a Kusto query.';
    }
    else {
      let skipAntaresSpecificChecks:boolean = this.chatIdentifier == this.antaresAnalyticsChatIdentifier || this.isFunctionApp || 
              !(chatFeedbackModel.additionalFields && 
                chatFeedbackModel.additionalFields.some( (item) => `${item.id}`.trim().toLowerCase() === 'clustername' && ( this.isAntaresStampCluster(item.value) || (!item.value && this.isAntaresStampCluster(item.defaultValue)))) &&
                chatFeedbackModel.additionalFields.some( (item) => `${item.id}`.trim().toLowerCase() === 'databasename' && ( this.isAntaresStampDatabase(item.value) || (!item.value && this.isAntaresStampDatabase(item.defaultValue))))
              );

      let queryTextFindings = KustoUtilities.RunBestPracticeChecks(chatFeedbackModel.expectedResponse, skipAntaresSpecificChecks);
      if(queryTextFindings) {
        chatFeedbackModel.validationStatus.succeeded = false;
        chatFeedbackModel.validationStatus.validationStatusResponse = queryTextFindings;
      }
      else {
        chatFeedbackModel.validationStatus.succeeded = true;
        chatFeedbackModel.validationStatus.validationStatusResponse = 'Validation succeeded';
      }
    }
    return of(chatFeedbackModel);
  }
  
  onFeedbackClicked = (chatMessage:ChatMessage, feedbackType:string):void => {
    if(this.isFeedbackSubmissionAllowed) {
      if(feedbackType === FeedbackOptions.Dislike) {
        this.feedbackPanelOpenState = {
          isOpen: true,
          chatMessageId: chatMessage.id
        };
      }
      else {
        // We might want to store the correct response as well as a part of training data.
        this.feedbackPanelOpenState = {
          isOpen: false,
          chatMessageId: null
        };
      }
    }
  }

  onSystemMessageReceived = (chatMessage:ChatMessage):ChatMessage => {
    if(chatMessage && chatMessage.message) {
      if(chatMessage.message.indexOf('Additional_Fields:') > -1 && chatMessage.message.indexOf('Explanation:') > -1) {
        let chatMessageSplit = chatMessage.message.split('\n');
        if(!chatMessage.data) {
          chatMessage.data = [] as KeyValuePair[];
          // Extract the additional fields returned in the chat response and add them to the data property of the chatMessage        
          let additionalFields = chatMessageSplit.find((line) => line.indexOf('Additional_Fields:') > -1);
          
          if(additionalFields) {
            additionalFields = additionalFields.replace('Additional_Fields:', '');
            try {
              let additionalFieldsObject = JSON.parse(additionalFields) as KeyValuePair[];

              // If additionalFieldsObject is an Array then add each item as a key value pair to the data property of the chatMessage
              if(Array.isArray(additionalFieldsObject)) {
                additionalFieldsObject.forEach((item) => {
                  if( `${item.key }`.trim().toLowerCase() === 'clustername' && `${item.value}`.toLowerCase() == this.antaresClusterNamePlaceholderConst.toLowerCase()) {
                    item.value = this.antaresClusterName;
                  }
                  else {
                    if( `${item.key }`.trim().toLowerCase() === 'databasename' && `${item.value}`.toLowerCase() == this.antaresDatabaseNamePlaceholderConst.toLowerCase()) {
                      item.value = this.antaresDatabaseName;
                    }
                  }
                });
                chatMessage.data = additionalFieldsObject;
                if(chatMessage.data.length > 0 && chatMessage.data.some((item) => `${item.key}`.trim().toLowerCase() === 'clustername' && item.value) &&  chatMessage.data.some((item) => `${item.key}`.trim().toLowerCase() === 'databasename' && item.value)) {
                  let kustoQuery = KustoUtilities.GetKustoQueryFromMarkdown(chatMessage.message, this.clusterName, this.databaseName);
                  this.chatMessageKustoExecuteLink[chatMessage.id] = `<a target='_blank' style='padding:1em;' href='${kustoQuery.KustoDesktopUrl}'><img src='${KustoUtilities.KustoDesktopImage}' style='width:18em'></a><a target='_blank' href='${kustoQuery.Url}'><img src='${KustoUtilities.KustoWebImage}' style='width:18em'></a>\n`;
                }
                else {
                  this.chatMessageKustoExecuteLink[chatMessage.id] = '';
                }
              }
            }
            catch(e) {
              this._telemetryService.logException(e, 'kustogpt_onSystemMessageReceived_parseadditionalFields', {armId: this._resourceService.getCurrentResourceId(false), userId: this.getUserId(), message: 'Error parsing additional fields'});
              console.error('Error parsing additional fields');
              console.error(e);
            }
          }
        }
        //chatMessage.displayMessage = chatMessageSplit.filter((line) => line.indexOf('Additional_Fields:') === -1).join('\n');
        chatMessageSplit.forEach((line, index:number) => {
          if(line.indexOf('Additional_Fields:') > -1) {
            chatMessageSplit[index] = this.chatMessageKustoExecuteLink[chatMessage.id]? this.chatMessageKustoExecuteLink[chatMessage.id]: '';
          }
        });
        chatMessage.displayMessage = chatMessageSplit.join('\n');
      }
      else {
        chatMessage.displayMessage = chatMessage.message;
      }
    }
    
    return chatMessage;
  }

  constructor(private _applensGlobal:ApplensGlobal, private _diagnosticService: ApplensDiagnosticService, private _resourceService: ResourceService, private _diagnosticApiService: DiagnosticApiService, private _adalService: AdalService, private _telemetryService: TelemetryService)  {
    this._applensGlobal.updateHeader('KQL assistant'); // This sets the title of the HTML page
    this._applensGlobal.updateHeader(''); // Clear the header title of the component as the chat header is being displayed in the chat UI
    
    let resourceReady = (this._resourceService instanceof SiteService && this._resourceService.ArmResource?.resourceGroup && this._resourceService.ArmResource?.resourceName) ? this._resourceService.getCurrentResource() : of(null);
    resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;
        this.isFunctionApp = `${this.resource['Kind']}`.toLowerCase().indexOf('functionapp') > -1;
      }
    });

    this.prepareChatHeader();
    this.chatIdentifier = this.genericKustoAssistantChatIdentifier;
    this.updateFeedbackSubmissionStatus(this.chatIdentifier);

    if(`${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase() !== 'microsoft.web/sites') {
      this._diagnosticService.getKustoMappings().subscribe((response) => {
        // Find the first entry with non empty publicClusterName in the response Array
        let kustoMapping = response.find((mapping) => {
          return mapping.publicClusterName && mapping.publicClusterName.length > 0 && mapping.publicDatabaseName && mapping.publicDatabaseName.length > 0;
        });
        if(kustoMapping) {
          this.clusterName = kustoMapping.publicClusterName;
          this.databaseName = kustoMapping.publicDatabaseName;
        }
        else {
          this.clusterName = '';
          this.databaseName = '';
        }        
        this.additionalFields = this.getAdditionalFieldsForChatFeedback(this.clusterName, this.databaseName);
      });
    }
    else {
       if(this._resourceService instanceof SiteService) {
        // Check if Analytics copilot is enabled for this user
        this._diagnosticApiService.isCopilotEnabled(`${this._resourceService.ArmResource.provider}`,`${this._resourceService.ArmResource.resourceTypeName}`, this.antaresAnalyticsChatIdentifier).subscribe((isCopilotEnabled) => {
          this.isAnalyticsCopilotAllowed = isCopilotEnabled;
          if(this.isAnalyticsCopilotAllowed) {
            this.customInitialPrompt = '';
            this.chatIdentifier = this.antaresAnalyticsChatIdentifier;
            this.updateFeedbackSubmissionStatus(this.antaresAnalyticsChatIdentifier);
            this.prepareChatHeader();

            this.clusterName =  this.analyticsClusterNameConst;
            this.databaseName = this.analyticsDatabaseNameConst;
            this.additionalFields = this.getAdditionalFieldsForChatFeedback(this.analyticsClusterNameConst, this.analyticsDatabaseNameConst);
          }

          let siteResource = this._resourceService as SiteService;
          siteResource.getCurrentResource().subscribe((siteResource:ObserverSiteInfo) => {
            if(siteResource) {
              this.antaresStampName = siteResource.StampName;
              this.customInitialPrompt = this.antaresStampName && !this.isAnalyticsCopilotAllowed ? `EventPrimaryStampName = '${this.antaresStampName}'` : '';
              if(siteResource.GeomasterName && siteResource.GeomasterName.indexOf('-') > 0) {
                let geoRegionName = siteResource.GeomasterName.split('-').pop().toLowerCase();
                this._diagnosticApiService.getKustoClusterForGeoRegion(geoRegionName).subscribe((kustoClusterRes) => {
                  if (kustoClusterRes) {
                    this.antaresClusterName = kustoClusterRes.ClusterName || kustoClusterRes.clusterName;
                    if(!this.isAnalyticsCopilotAllowed) {
                      this.clusterName = this.antaresClusterName;
                      this.databaseName = this.antaresDatabaseName;
                      this.additionalFields = this.getAdditionalFieldsForChatFeedback(this.antaresClusterNamePlaceholderConst, this.antaresDatabaseNamePlaceholderConst);
                    }
                  }
                });
              }
            }
          });
        });
       }
    }
  }

  chatHeader = 'Kusto query assistant - Preview';
  feedbackEmailAlias = 'applensv2team';

  private prepareChatHeader = () => {
    if(this.chatIdentifier === this.antaresAnalyticsChatIdentifier) {
      this.chatHeader = `<div class='copilot-header chatui-header-text'>
      <img  class='copilot-header-img' src="/assets/img/Azure-Data-Explorer-Clusters.svg" alt = ''>
      Kusto query generator for Antares Analytics - Preview
      <div class = "copilot-header-secondary" >
        Queries generated can be executed against <strong>Cluster:</strong>wawsaneus.eastus <strong>Database:</strong>wawsanprod. For more information, see <a target = '_blank' href='https://msazure.visualstudio.com/Antares/_wiki/wikis/Antares.wiki/50081/Getting-started-with-Antares-Analytics-Kusto-data'>Getting started with Antares Analytics Kusto data.</a>
      </div>
    </div>`;
    }
    else {
      this.chatHeader = `<div class='copilot-header chatui-header-text'>
      <img  class='copilot-header-img' src="/assets/img/Azure-Data-Explorer-Clusters.svg" alt = ''>
      Kusto query assistant - Preview
    </div>`
    };
  
  }
}
