import { Component, OnInit, Input, ViewChild, Renderer2 } from '@angular/core';
import { CXPChatService } from '../../services/cxp-chat.service';

@Component({
  selector: 'cxp-chat-launcher',
  templateUrl: './cxp-chat-launcher.component.html',
  styleUrls: ['./cxp-chat-launcher.component.scss']
})
export class CxpChatLauncherComponent implements OnInit {

  @Input() trackingId: string;
  @Input() chatUrl: string;
  public showChatConfDialog: boolean = false;
  public firstTimeCheck: boolean = true;

  @ViewChild('chatComponentContainer') chatComponentContainer;

  constructor(private _cxpChatService: CXPChatService, private renderer: Renderer2) {
  }

  ngOnInit() {
    this.renderer.listen('window', 'click', (e: Event) => {
      /**
       * Only run when the current chat component is not clicked
       * If we don't check this, all clicks (even on the chat component div) gets into this section.
       * As a  result we will never see the confirmation box open       
       */

      if (!this.chatComponentContainer.nativeElement.contains(e.target)) {
        if(this.showChatConfDialog) {
          this.hideChatConfDialog(true, 'ClickOutsideComponent');
        }
      }
    });
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

    //Always return false right now since we are merely collecting telemetry. Remove '&& false' below once we are ready to go live.
    return  initializedTestResult && false;
  }

  public toggleChatConfDialog(): void {
    this.showChatConfDialog = !this.showChatConfDialog;
    if (this.showChatConfDialog) {
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
      const windowFeatures: string = 'menubar=no,location=no,resizable=no,scrollbars=no,status=no,height=550,width=450';
      window.open(this.chatUrl, '_blank', windowFeatures, false);

      this._cxpChatService.logUserActionOnChat('ChatUrlOpened', this.trackingId, this.chatUrl);

      this.hideChatConfDialog(false,'AutohideAfterChatLaunch');
    }
  }


}
