import { AdalService } from 'adal-angular4';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { APIProtocol, ChatMessage, ChatModel, FeedbackOptions } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { ChatFeedbackAdditionalField, ChatFeedbackModel, FeedbackExplanationModes } from '../../../shared/models/openAIChatFeedbackModel';
import { Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { KeyValuePair } from 'dist/diagnostic-data/lib/models/common-models';
import { SiteService } from '../../../shared/services/site.service';
import { ObserverSiteInfo } from '../../../shared/models/observer';

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent {

  public apiProtocol = APIProtocol.WebSocket;
  public chatModel = ChatModel.GPT4;
  public feedbackPanelOpenState: boolean = false;
  public chatIdentifier: string = 'analyticskustocopilot';
  public feedbackExplanationMode:FeedbackExplanationModes = FeedbackExplanationModes.Explanation;

  public readonly clusterNameConst: string = '@AntaresStampKustoCluster';
  public readonly databaseNameConst: string = '@AnataresStampKustoDB';
  
  public clusterName: string = this.clusterNameConst;
  public databaseName: string = this.databaseNameConst;

  public chatMessageKustoExecuteLink: { [chatId: string] : string; } = {};



  public additionalFields: ChatFeedbackAdditionalField[] = [
    {
      id: 'clusterName',
      labelText: 'Cluster Name',
      value: this.clusterNameConst,
      defaultValue: this.clusterNameConst,
      isMultiline: false
    },
    {
      id: 'databaseName',
      labelText: 'Database Name',
      value: this.databaseNameConst,
      defaultValue: this.databaseNameConst,
      isMultiline: false
    }
  ];

  public onDismissed(feedbackModel:ChatFeedbackModel) {
    console.log('onDismissed clicked');
    console.log(this.feedbackPanelOpenState);
    this.feedbackPanelOpenState = false;
    console.log(this.feedbackPanelOpenState);
    console.log(feedbackModel);
  }

  onBeforeSubmit = (chatFeedbackModel:ChatFeedbackModel): Observable<ChatFeedbackModel> => {
    chatFeedbackModel.validationStatus.succeeded = true;
    chatFeedbackModel.validationStatus.validationStatusResponse = 'Validation succeeded';
    return of(chatFeedbackModel);
  }

  
  onFeedbackClicked = (chatMessage:ChatMessage, feedbackType:string):void => {
    if(feedbackType === FeedbackOptions.Dislike) {
      this.feedbackPanelOpenState = true;
    }
    else {
      this.feedbackPanelOpenState = false;
    }
  }


  onSystemMessageReceived = (chatMessage:ChatMessage):ChatMessage => {
    if(chatMessage) {      
      if(chatMessage.message && chatMessage.message.indexOf('Additional_Fields:') > -1 && chatMessage.message.indexOf('Explanation:') > -1) {
        let chatMessageSplit = chatMessage.message.split('\n');
        if(!chatMessage.data) {
          chatMessage.data = [] as KeyValuePair[];
          // Extract the additional fields returned in the chat response and add them to the data property of the chatMessage        
          let additionalFields = chatMessageSplit.find((line) => line.indexOf('Additional_Fields:') > -1);
          
          if(additionalFields) {
            additionalFields = additionalFields.replace('Additional_Fields:', '');
            try {
              let additionalFieldsObject = JSON.parse(additionalFields) as KeyValuePair[];
              console.log('Additional fields object');
              console.log(additionalFields);
              console.log(additionalFieldsObject);

              // If additionalFieldsObject is an Array then add each item as a key value pair to the data property of the chatMessage
              if(Array.isArray(additionalFieldsObject)) {
                additionalFieldsObject.forEach((item) => {
                  if( `${item.key }`.trim().toLowerCase() === 'clustername' && `${item.value}`.toLowerCase() == this.clusterNameConst.toLowerCase()) {
                    item.value = this.clusterName;
                  }
                  else {
                    if( `${item.key }`.trim().toLowerCase() === 'databasename' && `${item.value}`.toLowerCase() == this.databaseNameConst.toLowerCase()) {
                      item.value = this.databaseName;
                    }
                  }
                });
                chatMessage.data = additionalFieldsObject;
                this.chatMessageKustoExecuteLink[chatMessage.id] = `__Cluster:__ ${this.clusterName}\n__Database:__ ${this.databaseName}\n`;
              }
              console.log(chatMessage);
            }
            catch(e) {
              console.log('Error parsing additional fields');
              console.log(e);              
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

  constructor(private _applensGlobal:ApplensGlobal, private _diagnosticService: ApplensDiagnosticService, private _resourceService: ResourceService, private _diagnosticApiService: DiagnosticApiService)  {
    this._applensGlobal.updateHeader('KQL for Antares Analytics'); // This sets the title of the HTML page
    this._applensGlobal.updateHeader(''); // Clear the header title of the component as the chat header is being displayed in the chat UI
    this.prepareChatHeader();
    
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
        this.additionalFields[0].value = this.clusterName;
        this.additionalFields[0].defaultValue = this.clusterName;
        this.additionalFields[1].value = this.databaseName;
        this.additionalFields[1].defaultValue = this.databaseName;
      });
    }
    else {
       if(this._resourceService instanceof SiteService) {
        let siteResource = this._resourceService as SiteService;
        siteResource.getCurrentResource().subscribe((siteResource:ObserverSiteInfo) => {
          if(siteResource && siteResource.GeomasterName && siteResource.GeomasterName.indexOf('-') > 0) {
            let geoRegionName = siteResource.GeomasterName.split('-').pop().toLowerCase();
            this._diagnosticApiService.getKustoClusterForGeoRegion(geoRegionName).subscribe((kustoClusterRes) => {
              if (kustoClusterRes) {
                this.clusterName = kustoClusterRes.ClusterName || kustoClusterRes.clusterName;
                this.databaseName = 'wawsprod';
              }
            });
          }
        });
       }
    }
  }

  chatHeader = 'Kusto query generator for Antares Analytics - Preview';
  feedbackEmailAlias = 'applensv2team';

  private prepareChatHeader = () => {
  this.chatHeader = `
  <div class='copilot-header chatui-header-text'>
    <img  class='copilot-header-img' src="/assets/img/Azure-Data-Explorer-Clusters.svg" alt = ''>
    ${this.chatHeader}
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''">
    <div class = "copilot-header-secondary" >
      Queries generated can be executed against <strong>Cluster:</strong>wawsaneus.eastus <strong>Database:</strong>wawsanprod. For more information, see <a target = '_blank' href='https://msazure.visualstudio.com/Antares/_wiki/wikis/Antares.wiki/50081/Getting-started-with-Antares-Analytics-Kusto-data'>Getting started with Antares Analytics Kusto data.</a>
    </div>
  </div>
  `;
  }
}
