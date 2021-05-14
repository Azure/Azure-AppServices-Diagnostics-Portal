import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';
import { flatMap, map } from 'rxjs/operators';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';

@Component({
  selector: 'tab-common',
  templateUrl: './tab-common.component.html',
  styleUrls: ['./tab-common.component.scss']
})
export class TabCommonComponent implements OnInit {

  contentHeight: string;
  constructor(private _activatedRoute:ActivatedRoute,private _applensGlobal:ApplensGlobal,private _applensDiagnosticService:ApplensDiagnosticService) {
    // this.contentHeight = (window.innerHeight - 112) + 'px';
  }

  ngOnInit() {
    const observable = this._activatedRoute.params.pipe(flatMap(params => {
     return this._applensDiagnosticService.getDetectorMetaDataById(params["detector"]);
    }));

    observable.subscribe(metaData => {
      this._applensGlobal.dashboardTitleSubject.next(metaData.name);
    })
  }
}
