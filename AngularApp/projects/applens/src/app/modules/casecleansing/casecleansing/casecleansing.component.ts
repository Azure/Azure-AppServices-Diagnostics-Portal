import { Component } from '@angular/core';
import {
  CaseCleansingApiService,
  CaseSimple
} from '../../../shared/services/casecleansing-api.service';
import { FormControl, FormGroup } from '@angular/forms';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'casecleansing',
  templateUrl: './casecleansing.component.html',
  styleUrls: ['./casecleansing.component.scss']
})
export class CaseCleansingComponent {
  public cases: CaseSimple[];
  public filteredCases: CaseSimple[];
  public selectedCase: CaseSimple;

  public filterForm = new FormGroup({
    filterTitle: new FormControl(''),
    filterIncidentID: new FormControl(''),
    filterStatus: new FormControl(''),
    filterAssignedTo: new FormControl(''),
    filterRecommendation: new FormControl('')
  });

  private filterDays: Date;
  public filterDaysButton: number;

  constructor(private caseCleansingService: CaseCleansingApiService) {
    this.getAllCases();
    this.filterTime(30);
  }

  private async getAllCases() {
    this.cases = await this.caseCleansingService.GetAllCases().toPromise();
    this.filter();
  }

  public onSelect(caseIn: CaseSimple) {
    this.selectedCase = caseIn;
  }

  public filter() {
    let titleFilter: string = this.filterForm.value.filterTitle;
    let idFilter: string = this.filterForm.value.filterIncidentID;
    let statusFilter: string = this.filterForm.value.filterStatus;
    let assignedToFilter: string = this.filterForm.value.filterAssignedTo;
    let recommendationFilter: string =
      this.filterForm.value.filterRecommendation;
    this.filteredCases = [];
    for (const i of this.cases) {
      if (
        i.title.toLowerCase().indexOf(titleFilter.toLowerCase()) !== -1 &&
        i.incidentId.toLowerCase().indexOf(idFilter.toLowerCase()) !== -1 &&
        i.status.toLowerCase().indexOf(statusFilter.toLowerCase()) !== -1 &&
        i.assignedTo.toLowerCase().indexOf(assignedToFilter.toLowerCase()) !==
          -1 &&
        i.recommendationCount
          .toString()
          .toLowerCase()
          .indexOf(recommendationFilter.toLowerCase()) !== -1 &&
        i.closedTime > this.filterDays.toJSON()
      ) {
        this.filteredCases.push(i);
      }
    }
  }

  public filterTitleChanged(): void {
    this.filter();
  }

  public filterIncidentIDChanged(): void {
    this.filter();
  }

  public filterStatusChanged(): void {
    this.filter();
  }

  public filterAssignedToChanged(): void {
    this.filter();
  }

  public filterRecommendationChanged(): void {
    this.filter();
  }

  public filterTime(days: number): void {
    this.filterDays = new Date();
    this.filterDays.setDate(this.filterDays.getDate() - days);
    if (this.cases) {
      this.filter();
    }
    this.filterDaysButton = days;
  }
}
