import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';

@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  constructor(private _adalService:AdalService,private _diagnosticApiService:DiagnosticApiService) { }

  ngOnInit() {
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
      this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
        this.userPhotoSource = image;
    });
  }

}
