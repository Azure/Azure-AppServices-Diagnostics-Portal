import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { ChatMessage } from '../models/chatbot-models';

@Injectable({
  providedIn: 'root'
})
export class ChatGPTContextService {

  constructor() {
  }

  public messages: ChatMessage[] = [];
  public chatInputBoxDisabled: boolean = false;
  public userPhotoSource: any = "";
  public userNameInitial: string = "";
}
