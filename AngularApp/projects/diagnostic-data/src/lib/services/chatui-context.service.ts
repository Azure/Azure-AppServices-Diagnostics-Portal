import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ChatMessage } from '../models/chatbot-models';

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
}