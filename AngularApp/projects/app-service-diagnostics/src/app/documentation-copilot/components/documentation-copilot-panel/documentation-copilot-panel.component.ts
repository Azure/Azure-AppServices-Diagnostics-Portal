import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import {Globals} from '../../../globals';

@Component({
    selector: 'documentation-copilot-panel',
    templateUrl: './documentation-copilot-panel.component.html',
    styleUrls: ['./documentation-copilot-panel.component.scss']
})
export class DocumentationCopilotPanelComponent implements OnInit, OnDestroy {

    type: PanelType = PanelType.custom;
    width: string = "1200px";

    constructor(public globals: Globals) {
    }

    ngOnInit() {
        this.globals.openDocumentationCopilotPanel = false;
    }

    ngOnDestroy() {
    }

    docCopilotDismissHandler() {
    this.globals.openDocumentationCopilotPanel = false;
  }
}
