import { Component, OnInit, ViewChild } from '@angular/core';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { ApplensGlobal } from '../../../applens-global';
import { l1SideNavCollapseWidth, l1SideNavExpandWidth } from '../../../shared/components/l1-side-nav/l1-side-nav';
import { L2SideNavType } from './l2-side-nav';

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
  panelMarginTop: number = 130;
  panelStyles: IPanelProps['styles'];

  panelFocusTrapZoneProps: IPanelProps["focusTrapZoneProps"] = {
    disabled: true
  }

  constructor(private _applensGlobal: ApplensGlobal) { }

  ngOnInit() {
    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.type = type;
    });

    this._applensGlobal.showCommAlertSubject.subscribe(showCommAlert => {
      this._applensGlobal.expandL1SideNavSubject.subscribe(isExpand => {
        //const panelMarginTop = showCommAlert ? 200 : 130;
        //Use above once banner is removed
        const panelMarginTop = showCommAlert ? 240 : 170;
        const panelMarginLeft = isExpand ? l1SideNavExpandWidth : l1SideNavCollapseWidth;
        this.panelStyles = {
          root: {
            marginTop: `${panelMarginTop}px`,
            marginLeft: `${panelMarginLeft}px`,
          },
          main: {
            boxShadow: "none",
            borderRight: "1px solid #ccc"
          }
        }
      });
    });
  }

  dismissSideNav() {
    this._applensGlobal.openL2SideNavSubject.next(L2SideNavType.None);
  }

  getdatePanelStyle() {

  }

}
