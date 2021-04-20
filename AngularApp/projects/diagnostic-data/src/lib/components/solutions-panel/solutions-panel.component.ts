import { Component, Input, OnInit,Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMessageBarProps, MessageBarType, PanelType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { Solution } from '../solution/solution';

@Component({
  selector: 'solutions-panel',
  templateUrl: './solutions-panel.component.html',
  styleUrls: ['./solutions-panel.component.scss']
})
export class SolutionsPanelComponent implements OnInit {

  constructor(private _activatedRoute:ActivatedRoute, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.isPublic = config && config.isPublic;
  }

  @Input() isPanelOpenObservable: Observable<boolean>;
  @Input() solutions: Solution[] = [];
  @Input() width: string = "800px";
  @Input() title: string = "";
  isOpen: boolean = false;
  panelType: PanelType = PanelType.custom;
  isPublic: boolean = true;
  resourceName: string = "";
  messageBarType: MessageBarType = MessageBarType.info;
  messageBarStyles: IMessageBarProps["styles"] = {
    root: {
      backgroundColor: "#F0F6FF"
    },
    icon: {
      color: "#015CDA"
    }
  };

  ngOnInit() {
    this.isPanelOpenObservable.subscribe(isOpen => this.isOpen = isOpen);
    const routeParams = this._activatedRoute.root.firstChild.firstChild.firstChild.snapshot.params;
    this.resourceName = routeParams['resourcename'] || routeParams['resourceName'] || "";
  }

  dismissPanel() {
    this.isOpen = false;
  }
}
