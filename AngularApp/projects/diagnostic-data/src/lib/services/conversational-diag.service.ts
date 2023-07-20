import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class ConversationalDiagService {

  constructor() { }

  public sendUserMessage(sessionId: string, message: string): Observable<any> {
    return null;
  }
}
