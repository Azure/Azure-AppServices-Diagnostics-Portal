import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { distinct } from 'rxjs-compat/operator/distinct';

@Component({
  selector: 'tab-common',
  templateUrl: './tab-common.component.html',
  styleUrls: ['./tab-common.component.scss']
})
export class TabCommonComponent implements OnInit {

  tabs: { headerText: string, itemKey: string }[] = [
    { headerText: "Data", itemKey: TabKey.Data },
    { headerText: "Develop", itemKey: TabKey.Develop }
  ];

  defaultTabKey:string;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    const key:string = this._activatedRoute.firstChild.snapshot.data["tabKey"];
    this.defaultTabKey = key ? key : this.tabs[0].itemKey;
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

export enum TabKey {
  Data = "Data",
  Develop = "Develop"
}
