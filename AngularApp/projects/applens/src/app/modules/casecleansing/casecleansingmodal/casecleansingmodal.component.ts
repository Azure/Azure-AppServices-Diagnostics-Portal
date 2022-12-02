import { Component, Input, OnChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSmartModalService } from 'ngx-smart-modal';
import {
  CaseCleansingApiService,
  CaseSimple
} from '../../../shared/services/casecleansing-api.service';

@Component({
  selector: 'casecleansingmodal',
  templateUrl: './casecleansingmodal.component.html',
  styleUrls: ['./casecleansingmodal.component.scss']
})
export class CasecleansingmodalComponent implements OnChanges {
  public caseCleansingForm = new FormGroup({
    select: new FormControl(''),
    other: new FormControl('')
  });
  public showProgress: boolean = false;
  public activeIncident: any;
  public content: any;
  public contentJSON: string;
  @Input() selectedCase: CaseSimple;

  constructor(
    private caseCleansingService: CaseCleansingApiService,
    public ngxSmartModalService: NgxSmartModalService
  ) {
    this.activeIncident = {
      title: '...',
      recommendations: ['...'],
      rules: ['...']
    };
  }

  ngOnChanges() {
    if (this.selectedCase !== undefined) {
      this.getDetails(this.selectedCase.incidentId);
    }
  }

  public async onSubmit() {
    let closeReason: string = this.caseCleansingForm.value.select;
    if (closeReason === 'other') {
      closeReason = 'Other: ' + this.caseCleansingForm.value.other;
    }
    this.showProgress = true;
    let result = await this.caseCleansingService
      .CloseCase(this.selectedCase.incidentId, closeReason)
      .toPromise();
    this.showProgress = false;
    if (result) {
      this.ngxSmartModalService.getModal('infoModal').close();
      //this.cases.splice(this.cases.indexOf(this.selectedCase), 1);
    } else {
      alert('there was an error updating this case');
    }
  }

  public async toggleDebugInformation() {
    if (!this.contentJSON) {
      this.contentJSON =
        'Rule Name: ' +
        this.activeIncident.rule +
        '\n' +
        JSON.stringify(this.content, null, 2);
    } else {
      this.contentJSON = undefined;
    }
  }

  private async getDetails(incidentID: string) {
    this.activeIncident = {
      title: '...',
      recommendations: ['...']
    };
    this.contentJSON = undefined;
    this.content = undefined;
    this.showProgress = true;
    this.caseCleansingForm.reset();
    this.caseCleansingForm.updateValueAndValidity();
    this.caseCleansingForm.controls['select'].setValue('');

    this.ngxSmartModalService.getModal('infoModal').open();

    this.content = await this.caseCleansingService
      .GetCaseDetails(this.selectedCase.incidentId)
      .toPromise();

    this.activeIncident.title = this.content.kustoData.Incidents_Title;
    this.activeIncident.recommendations = this.content.recommendations;

    this.showProgress = false;
  }

  public onSelectChange(args) {
    let selectValue = args.target.value;
    let otherControl = this.caseCleansingForm.get('other') as FormControl;
    if (selectValue === 'other') {
      otherControl.setValidators([Validators.required]);
    } else {
      otherControl.clearValidators();
    }
    otherControl.updateValueAndValidity();
  }
}
