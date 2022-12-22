import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'create-experience-picker',
  templateUrl: './create-experience-picker.component.html',
  styleUrls: ['./create-experience-picker.component.scss']
})

export class CreateExperiencePicker {
  public pickerOptionsRepository:Array<KeyValuePair> = [
    {
      key:'detector',
      value:[
        {
          iconName:'LightningBolt',
          displayText:'Quick Create',
          navigatePath: 'design'
        },
        {
          iconName:'Code',
          displayText:'Write Code',
          navigatePath: 'create'
        }
      ]
    },
    {
      key:'gist',
      value:[
        {
          iconName:'Code',
          displayText:'Write Code',
          navigatePath: 'createGist'
        }
      ]
    }
  ];

  public createPickerFor:string = '';  
  public pickerOptions:any;

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _router: Router ) {
    this._applensGlobal.updateHeader('');
    this.createPickerFor = !this._activatedRoute.snapshot.data["creationFor"]? 'detector': this._activatedRoute.snapshot.data["creationFor"].toLowerCase();
    this.pickerOptions = this.pickerOptionsRepository.find(option=>option.key.toLowerCase() === this.createPickerFor).value;
    if(this.pickerOptions.length == 1   ) {
      this._router.navigate([`../${this.pickerOptions[0].navigatePath}`], {
        relativeTo: this._activatedRoute,
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  public chooseCreateExperience(selectedExperience:any) {
    this._router.navigate([`../${selectedExperience.navigatePath}`], {
      relativeTo: this._activatedRoute,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }  
}