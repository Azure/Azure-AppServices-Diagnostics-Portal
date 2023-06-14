import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NoCodeExpressionResponse } from '../dynamic-node-settings/node-rendering-json-models';

@Component({
  selector: 'no-code-detector-view',
  templateUrl: './no-code-detector-view.component.html',
  styleUrls: ['./no-code-detector-view.component.scss']
})
export class NoCodeDetectorViewComponent implements OnInit {
  detectorNodesSubject = new BehaviorSubject<NoCodeExpressionResponse[]>([]);
  nodeList: NoCodeExpressionResponse[] = [];
  // testArray = ["to", "be", "continued"];

  @Input() startTime: string = "";
  @Input() endTime: string = "";
  @Input() set detectorNodes(nodes: any) {
    this.showView = false;
    this.detectorNodesSubject.next(nodes);
  }
  showView: boolean = false;
  detectorView = null;

  constructor() { }

  ngOnInit(): void {
    this.detectorNodesSubject.subscribe(x => {
      //this.nodeList = x;
      setTimeout(() => {
        this.showView = true;
      }, 1000);
      
      this.detectorView = x;
    });
  }

}
