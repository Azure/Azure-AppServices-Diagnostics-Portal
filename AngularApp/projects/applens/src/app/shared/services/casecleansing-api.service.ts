import { Injectable } from '@angular/core';
import { DiagnosticApiService } from './diagnostic-api.service';
import { Package } from '../models/package';
import { Observable } from 'rxjs';

@Injectable()
export class CaseCleansingApiService {
  constructor(private _diagnosticApiService: DiagnosticApiService) {}

  public GetAllCases(): Observable<CaseSimple[]> {
    return this._diagnosticApiService.get<CaseSimple[]>(
      'api/casecleansing/getallcases',
      true
    );
  }

  public GetCaseDetails(incidentId: string): Observable<object> {
    return this._diagnosticApiService.get<object>(
      `api/casecleansing/getcase/${incidentId}`,
      true
    );
  }

  public CloseCase(
    incidentId: string,
    closeReason: string
  ): Observable<Boolean> {
    return this._diagnosticApiService.get<Boolean>(
      `api/casecleansing/closecase/${incidentId}/${closeReason}`,
      true
    );
  }
}

export class CaseSimple {
  incidentId: string;
  time: String;
  status: String;
  assignedTo: String;
  closedTime: String;
  id: number;
  recommendationCount: number;
  title: string;
}
