import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Query } from '../models/documents-search-models';

@Injectable()
export class GenericDocumentsSearchService {
  public IsEnabled(pesId: string): Observable<boolean> {
    return null;
  }
  public Search(query: Query): Observable<any> {
    return null;
  }

  public searchWeb(query: Query): Observable<any> {
    return null;
  }
}
