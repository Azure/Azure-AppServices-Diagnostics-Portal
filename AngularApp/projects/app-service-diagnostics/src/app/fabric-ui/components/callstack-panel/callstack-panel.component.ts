import { Component, OnInit } from '@angular/core';
import { Globals } from '../../../globals';
import { PanelType } from 'office-ui-fabric-react';

@Component({
  selector: 'callstack-panel',
  templateUrl: './callstack-panel.component.html',
  styleUrls: ['./callstack-panel.component.scss']
})
export class CallstackPanelComponent implements OnInit {
  type: PanelType = PanelType.custom;
  width: string = '850px';

  constructor(public globals: Globals) {}

  ngOnInit() {}

  dismissedHandler() {
    this.globals.openCallStackPanel = false;
    this.globals.callStackDetails.callStack = '';
    this.globals.callStackDetails.managedException = '';
  }
}
