import { Injectable } from '@angular/core';
import { Query } from '../models/documents-search-models';
import { Observable } from 'rxjs';

@Injectable()
export class GenericContentService {
  public getContent(searchString?: string): Observable<any[]> {
    return null;
  }

  public searchWeb(
    questionString: string,
    resultsCount: string = '3',
    useStack: boolean = true,
    preferredSites: string[] = [],
    excludedSites: string[] = []
  ): Observable<any> {
    return null;
  }

  public constructQueryParameters(
    questionString: string,
    useStack: boolean,
    preferredSites: string[],
    excludedSites: string[]
  ): string {
    return null;
  }

  public IsDeepSearchEnabled(
    pesId: string,
    supportTopicId: string
  ): Observable<boolean> {
    return null;
  }
  public fetchResultsFromDeepSearch(query: Query): Observable<any> {
    return null;
  }
}
