import { Injectable } from '@angular/core';
import { TextCompletionModel, OpenAIAPIResponse } from '../models/openai-data-models';
import { Observable, of} from 'rxjs';

@Injectable()
export class GenericOpenAIChatService {
  public isEnabled: boolean = false;
  
  public CheckEnabled(): Observable<boolean> {
    return of(false);
  }

  public generateTextCompletion(queryModel: TextCompletionModel, caching: boolean = true): Observable<OpenAIAPIResponse> {
    return null;
  }
}
