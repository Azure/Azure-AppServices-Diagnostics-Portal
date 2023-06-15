import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ChatMessage } from '../models/chatbot-models';
import { PanelType } from 'office-ui-fabric-react';

@Injectable({
  providedIn: 'root'
})
export class ChatUIContextService {

  constructor() {
  }

  public messageStore = {};
  public chatInputBoxDisabled: boolean = false;
  public userPhotoSource: any = "";
  public userNameInitial: string = "";
  public userId: string = "";
  
  public clearChat = (chatIdentifier: string): void => {
    if (chatIdentifier == undefined || chatIdentifier == '' || this.messageStore[chatIdentifier] == undefined)
      return;

      this.messageStore[chatIdentifier] = [];
  }
}