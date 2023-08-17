import { Injectable } from '@angular/core';
import { ChatCompletionModel, TextCompletionModel, ChatResponse } from '../models/openai-data-models';
import { Observable, of } from 'rxjs';

@Injectable()
export class GenericOpenAIChatService {
  public isEnabled: boolean = false;
  public onMessageReceive: Observable<ChatResponse> = null;

  public CheckEnabled(): Observable<boolean> {
    return of(false);
  }

  public generateTextCompletion(queryModel: TextCompletionModel, customPrompt: string = '', caching: boolean = true, insertCustomPromptAtEnd:boolean = false): Observable<ChatResponse> {
    return null;
  }

  public getChatCompletion(queryModel: ChatCompletionModel, customPrompt: string = '', autoAddResourceSpecificInfo:boolean = true): Observable<ChatResponse> {
    return null;
  }

  public sendChatMessage(queryModel: ChatCompletionModel, customPrompt: string = '', autoAddResourceSpecificInfo:boolean = true): Observable<{ sent: boolean, failureReason: string }> {
    return null;
  };

  public cancelChatMessage(messageId: string) {
  }

  public establishSignalRConnection(): Observable<boolean> {
    return Observable.of(false);
  }
}
