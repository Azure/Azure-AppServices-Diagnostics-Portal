import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ResourceInfo } from '../../models/resources';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';

@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  resourceInfo: ResourceInfo = new ResourceInfo();
  constructor(private _adalService: AdalService, private _diagnosticApiService: DiagnosticApiService,private _activatedRoute:ActivatedRoute) { }

  ngOnInit() {
    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this.userPhotoSource = image;
    });
    if(this._activatedRoute.snapshot.data["info"]) {
      this.resourceInfo = this._activatedRoute.snapshot.data["info"];
    }
  }

  navigateToLandingPage() {
    window.location.href = "/"
  }
}
