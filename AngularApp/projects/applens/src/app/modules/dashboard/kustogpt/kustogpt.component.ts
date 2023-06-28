import { AdalService } from 'adal-angular4';
import { Component, OnInit } from '@angular/core';
import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';
import { DiagnosticApiService } from "../../../shared/services/diagnostic-api.service";
import { APIProtocol, ChatModel } from 'diagnostic-data';

@Component({
  selector: 'kustogpt',
  templateUrl: './kustogpt.component.html',
  styleUrls: ['./kustogpt.component.scss']
})
export class KustoGPTComponent {

  public apiProtocol = APIProtocol.WebSocket;
  public chatModel = ChatModel.GPT4;
  constructor() {
    this.prepareChatHeader();
  }

  chatHeader = 'Kusto Copilot for Analytics - Preview';
  feedbackEmailAlias = 'applensv2team';

  private prepareChatHeader = () => {
  this.chatHeader = `
  <div class='copilot-header chatui-header-text'>
    <img  class='copilot-header-img' src="/assets/img/bot_sparkle_icon.svg" alt = ''>
    ${this.chatHeader}
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''>
    <img class='copilot-header-img-secondary' src='/assets/img/rocket.png' alt=''"> 
    <div class = "copilot-header-secondary" >
      Queries generated can be executed against <strong>Cluster:</strong>wawsaneus.eastus <strong>Database:</strong>wawsprod. For more information, see <a href='https://msazure.visualstudio.com/Antares/_wiki/wikis/Antares.wiki/50081/Getting-started-with-Antares-Analytics-Kusto-data'>Getting started with Antares Analytics Kusto data.</a>
    </div>
  </div>  
  `;
}
}
