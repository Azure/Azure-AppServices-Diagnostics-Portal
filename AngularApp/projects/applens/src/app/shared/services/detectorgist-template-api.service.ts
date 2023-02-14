import { Injectable } from '@angular/core';
import { DiagnosticApiService } from './diagnostic-api.service';
import { Observable, of } from 'rxjs';
import { Commit } from '../models/commit';
import { Dependency } from '../models/package';
import { map } from 'rxjs/operators';

@Injectable()
export class DetectorGistApiService {

  constructor(private _diagnosticApiService: DiagnosticApiService) { }

  public getTemplate(name: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/templates/${name}`, true);
  }

  public getTemplateWithExtension(name: string, fileExtension: string): Observable<string> {
    return this._diagnosticApiService.get<string>(`api/templates/${name}/${fileExtension}`, true);
  }
}
