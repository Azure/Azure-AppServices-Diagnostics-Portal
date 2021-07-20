import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { DiagnosticService } from 'diagnostic-data';
import { ApplensGlobal } from '../../../applens-global';
import { ApplensDiagnosticService } from '../../../modules/dashboard/services/applens-diagnostic.service';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';

@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  constructor(private _adalService:AdalService,private _diagnosticApiService:DiagnosticApiService, private _injector: Injector,private _activatedRoute:ActivatedRoute) { }

  ngOnInit() {
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
      this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
        this.userPhotoSource = image;
    });
  }

  getAppName():string{
    const parms = this._activatedRoute.snapshot.params;
    // const _applensDiagnosticService = this._injector.get(ApplensGlobal);
    return "App Name";
  }
}
