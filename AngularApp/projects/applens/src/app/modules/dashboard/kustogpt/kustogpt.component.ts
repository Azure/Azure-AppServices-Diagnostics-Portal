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

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent {

  public apiProtocol = APIProtocol.WebSocket;
  public chatModel = ChatModel.GPT4;
  public feedbackPanelVisible: boolean = false;
  public chatIdentifier: string = 'analyticskustocopilot';
  public feedbackExplanationMode:FeedbackExplanationModes = FeedbackExplanationModes.Explanation;

  public clusterName: string = '@AntaresStampKustoCluster';
  public databaseName: string = '@AnataresStampKustoDB';
  public additionalFields: ChatFeedbackAdditionalField[] = [
    {
      id: 'clusterName',
      labelText: 'Cluster Name',
      value: this.clusterName,
      defaultValue: this.clusterName,
      isMultiline: false
    },
    {
      id: 'databaseName',
      labelText: 'Database Name',
      value: this.databaseName,
      defaultValue: this.databaseName,
      isMultiline: false
    }
  ];

  public onDismissed(feedbackModel:ChatFeedbackModel) {
    console.log('onDismissed clicked');
    console.log(this.feedbackPanelVisible);
    this.feedbackPanelVisible = false;
    console.log(this.feedbackPanelVisible);
    console.log(feedbackModel);
  }

  onBeforeSubmit = (chatFeedbackModel:ChatFeedbackModel): Observable<ChatFeedbackModel> => {
    chatFeedbackModel.validationStatus.succeeded = true;
    chatFeedbackModel.validationStatus.validationStatusResponse = 'Validation succeeded';
    return of(chatFeedbackModel);
  }

  
  onFeedbackClicked = (chatMessage:ChatMessage, feedbackType:string):void => {
    if(feedbackType === FeedbackOptions.Dislike) {
      this.feedbackPanelVisible = true;
    }
    else {
      this.feedbackPanelVisible = false;
    }
  }

  constructor(private _applensGlobal:ApplensGlobal, private _diagnosticService: ApplensDiagnosticService, private _resourceService: ResourceService)  {
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
