import { Injectable } from '@angular/core';
import { DetectorResponse, DetectorViewModeWithInsightInfo, DiagnosticData } from '../models/detector';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { ChatCompletionModel, ChatResponse } from '../models/openai-data-models';

@Injectable()
export class GenericDocumentationCopilotService {

  public onMessageReceive: BehaviorSubject<ChatResponse> = null;
  public isEnabled: boolean = false;

  public CheckEnabled(): Observable<boolean> {
    return of(false);
  }

  public sendChatMessage(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<{ sent: boolean, failureReason: string }> {
    return of({ sent: false, failureReason: '' });
  }

  public cancelChatMessage(messageId: string) {}

  public establishSignalRConnection(): Observable<boolean> {
    return of(false);
  }
}
