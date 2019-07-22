import { Injectable } from '@angular/core';
import { BehaviorSubject} from 'rxjs';
import { DiagnosticData, DataTableResponseObject } from '../models/detector';
@Injectable({
  providedIn: 'root'
})
export class ChangeAnalysisService {

  private changeGroupsData: BehaviorSubject<string> = new BehaviorSubject<string>('');
  private isAppService: boolean = true;
  private currentResourceName: string = '';

  getResourceChangeGroups = this.changeGroupsData.asObservable();

  constructor() { }

  loadResourceChangeGroups(jsonString: string) {
      this.changeGroupsData.next(jsonString);
  }

  public setAppService(resourceType: string) {
      this.isAppService = resourceType.toLowerCase() === 'microsoft.web';
  }

  public getAppService(): boolean {
      return this.isAppService;
  }

  public setCurrentResourceName(name: string) {
      this.currentResourceName = name;
  }

  public getCurrentResourceName(): string {
      return this.currentResourceName;
  }

}
