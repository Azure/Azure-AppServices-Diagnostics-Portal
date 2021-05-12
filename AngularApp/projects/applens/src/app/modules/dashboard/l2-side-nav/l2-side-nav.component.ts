import { Component, Input, OnInit } from '@angular/core';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';

@Component({
  selector: 'l2-side-nav',
  templateUrl: './l2-side-nav.component.html',
  styleUrls: ['./l2-side-nav.component.scss']
})
export class L2SideNavComponent implements OnInit {
  @Input() openL2SideNavObservable:Observable<any>;
  panelType: PanelType = PanelType.customNear;
  openL2SideNav:boolean = false;
  panelStyles: IPanelProps['styles'] = {
    root: {
      marginLeft: "70px",
    }
  }
  constructor() { }

  ngOnInit() {
    this.openL2SideNavObservable.subscribe(s => {
      this.openL2SideNav = true;
    });
  }

}
