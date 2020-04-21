import { Component, OnInit, Input} from '@angular/core';
import { CXPChatService } from '../../services/cxp-chat.service';

@Component({
  selector: 'cxp-chat-launcher',
  templateUrl: './cxp-chat-launcher.component.html',
  styleUrls: ['./cxp-chat-launcher.component.scss']
})
export class CxpChatLauncherComponent implements OnInit {

  @Input() trackingId: string;
  @Input() chatUrl: string;
  public chatConfDialogOpenedAtleastOnce = false;
  public showChatConfDialog: boolean = false;
  public firstTimeCheck: boolean = true;
  public diagnosticLogsConsent:boolean = true;
  public chatWelcomeMessage:string = "";
  public showChatButtons:boolean = true;
  public showDiagnosticsConsentOption:boolean = true;
  public completeChatUrl:string = '';
  public readonly windowFeatures: string = 'menubar=no,location=no,resizable=no,scrollbars=no,status=no,height=550,width=450';

  constructor(private _cxpChatService: CXPChatService) {
    this.chatWelcomeMessage =  "I'd love to help you out with your issue and connect you with our quick help chat team.";
  }

  
  ngOnInit() {
    window.setTimeout(()=> {
      if(!this.chatConfDialogOpenedAtleastOnce && !this.showChatConfDialog) {
        this.showChatConfDialog = true;
        this.chatConfDialogOpenedAtleastOnce = true;
        this._cxpChatService.logUserActionOnChat('ChatConfDialogShownBySystem', this.trackingId, this.chatUrl);
      }      
    }, 10000);
  }

  public showChatOpenedMessage() {
    this.showChatButtons = false;
    this.showDiagnosticsConsentOption = false;

    let browserUrl = (window.location != window.parent.location) ? document.referrer : document.location.href;
    let portalUrl = 'https://portal.azure.com';

    if (browserUrl.includes("azure.cn")){
      portalUrl = 'https://portal.azure.cn';
    }
    else if(browserUrl.includes("azure.us")){
      portalUrl = 'https://portal.azure.us';
    } else if(browserUrl.includes("azure.de")) {
      portalUrl = 'https://portal.azure.de';
    }

    this.chatWelcomeMessage = `A support request has been created. You can view the case <strong><a role="link" aria-label="Click to view your support requests" title="Support requests." style='color:skyblue' target = '_blank' href='${portalUrl}/#blade/Microsoft_Azure_Support/HelpAndSupportBlade/managesupportrequest'>here</a></strong>.


In case chat did not start in a pop up window, disable your popup blocker and click <strong><a role="link" aria-label="Click to launch chat popup" title="Launch chat popup."  style='color:skyblue' href="javascript:window.open('${this.completeChatUrl}', 'AzureSupportCaseChat', '${this.windowFeatures}');">here</a></strong> to launch chat again.`;
  }

  public isComponentInitialized(): boolean {
    let initializedTestResult:boolean = this.chatUrl && this.chatUrl != '' && this.trackingId && this.trackingId != '';

    //Have to check for first time due to the way our components are structured.
    //This gets called multiple times for each detector, specifically for child detectors that are collapsed and then expanded later.
    //This will also avoid telemetry noise.
    if(!initializedTestResult && this.firstTimeCheck) {      
      this._cxpChatService.logUserActionOnChat('ChatBubbleNotShown', this.trackingId, this.chatUrl);
    }
    else if(initializedTestResult && this.firstTimeCheck) {
      this._cxpChatService.logUserActionOnChat('ChatBubbleShown', this.trackingId, this.chatUrl);
    }
    this.firstTimeCheck = false;
    
    return  initializedTestResult;
  }

  public toggleChatConfDialog(): void {
    this.showChatConfDialog = !this.showChatConfDialog;
    if (this.showChatConfDialog) {
      this.chatConfDialogOpenedAtleastOnce = true;
      this._cxpChatService.logUserActionOnChat('ChatConfDialogShown', this.trackingId, this.chatUrl);
    }
    else {
      this._cxpChatService.logUserActionOnChat('ChatConfDialogDismissed', this.trackingId, this.chatUrl);
    }
  }

  public hideChatConfDialog(isUserInitiated: boolean, source:string): void {
    if (isUserInitiated) {
      this._cxpChatService.logUserActionOnChat(`ChatConfDialogCancelFrom${source.replace(' ','')}`, this.trackingId, this.chatUrl);
    }
    this.showChatConfDialog = false;
  }

  public openChatPopup(): void {
    if (this.chatUrl != '') {
      this.completeChatUrl = `${this.chatUrl}&diagnosticsConsent=${this.diagnosticLogsConsent}`;      
      window.open(this.completeChatUrl, '_blank', this.windowFeatures, false);
      this._cxpChatService.logUserActionOnChat('ChatUrlOpened', this.trackingId, this.completeChatUrl);
      this.showChatOpenedMessage();
    }
  }
}
