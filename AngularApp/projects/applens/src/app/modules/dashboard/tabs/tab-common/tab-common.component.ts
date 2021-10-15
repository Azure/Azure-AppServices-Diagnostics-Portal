import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DiagnosticApiService } from 'projects/applens/src/app/shared/services/diagnostic-api.service';
import { distinct } from 'rxjs-compat/operator/distinct';
import { filter } from 'rxjs/operators';
import { Tab, TabKey } from '../tab-key';

@Component({
  selector: 'tab-common',
  templateUrl: './tab-common.component.html',
  styleUrls: ['./tab-common.component.scss']
})
export class TabCommonComponent implements OnInit {

  tabs: Tab[] = [
    { headerText: "Data", itemKey: TabKey.Data }
  ];

  developTab: Tab = {
    headerText: "Develop", itemKey: TabKey.Develop 
  }

  selectedTabKey:string;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute,private _diagnosticApiService:DiagnosticApiService) {
    this._activatedRoute.firstChild.data.subscribe(data => {
      const key:string = data["tabKey"];
      this.selectedTabKey = key ? key : this.tabs[0].itemKey;
    }); 
  }

  ngOnInit() {
    this._diagnosticApiService.getEnableDetectorDevelopment().subscribe(enabledDetectorDevelopment => {
      if(enabledDetectorDevelopment) {
        this.tabs.push(this.developTab);
      }
    });
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(e => {
      const key:string = this._activatedRoute.firstChild.snapshot.data["tabKey"];
      this.selectedTabKey = key ? key : this.tabs[0].itemKey;
    }); 
  }

  navigateToData(ev: any) {
    const key: string = ev.item.props.itemKey;

    switch (key) {
      case TabKey.Data:
        this._router.navigate(["./"], {
          relativeTo: this._activatedRoute
        });
        break;
      case TabKey.Develop:
        this._router.navigate(["edit"], {
          relativeTo: this._activatedRoute
        });
        break;
    }
  }
}


