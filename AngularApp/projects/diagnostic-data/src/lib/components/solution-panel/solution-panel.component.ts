import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PanelType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';
import { Solution } from '../solution/solution';

@Component({
  selector: 'solution-panel',
  templateUrl: './solution-panel.component.html',
  styleUrls: ['./solution-panel.component.scss']
})
export class SolutionPanelComponent implements OnInit {

  constructor(_router:ActivatedRoute) { }

  @Input() isPanelOpenObservable: Observable<boolean>;
  @Input() solutions: Solution[] = [];
  @Input() width: string = "800px";
  @Input() solutionTitle: string = "";
  public isOpen: boolean;
  panelType: PanelType = PanelType.custom;

  ngOnInit() {
    this.isPanelOpenObservable.subscribe(isOpen => this.isOpen = isOpen);
  }

  dismissPanel() {
    this.isOpen = false;
  }
}
