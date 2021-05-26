import { Component, OnInit } from '@angular/core';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'l2-side-nav',
  templateUrl: './l2-side-nav.component.html',
  styleUrls: ['./l2-side-nav.component.scss']
})
export class L2SideNavComponent implements OnInit {
  panelType: PanelType = PanelType.customNear;
  type: L2SideNavType = L2SideNavType.None;
  get isSideNavOpen():boolean {
    return this.type !== L2SideNavType.None;
  }
  openL2SideNav: boolean = false;
  panelStyles: IPanelProps['styles'] = {
    root: {
      marginLeft: "70px",
      marginTop: "130px"
    }
  }

  panelFocusTrapZoneProps: IPanelProps["focusTrapZoneProps"] = {
    disabled: true
  }
  constructor(private _applensGlobal: ApplensGlobal) { }

  ngOnInit() {
    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.type = type;
    });
  }

  dismissSideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }

}

export enum L2SideNavType {
  None,
  Detectors,
  Develop
}
