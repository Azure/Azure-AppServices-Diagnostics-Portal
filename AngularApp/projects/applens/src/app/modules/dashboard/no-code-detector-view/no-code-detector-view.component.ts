import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { NoCodeExpressionResponse } from '../dynamic-node-settings/node-rendering-json-models';
import { DetectorControlService } from 'diagnostic-data';

@Component({
  selector: 'no-code-detector-view',
  templateUrl: './no-code-detector-view.component.html',
  styleUrls: ['./no-code-detector-view.component.scss']
})
export class NoCodeDetectorViewComponent implements OnInit {
  detectorNodesSubject = new BehaviorSubject<NoCodeExpressionResponse[]>([]);
  nodeList: NoCodeExpressionResponse[] = [];
  // testArray = ["to", "be", "continued"];

  //@Input() startTime: moment.Moment;
  //@Input() endTime: moment.Moment;
  @Input() set detectorNodes(nodes: any) {
    // this.showView = false;
    this.detectorNodesSubject.next(nodes);
  }
  showView: boolean = true;
  detectorView = null;
  startTime: moment.Moment;
  endTime: moment.Moment;
  pivotKey: string = "data";

  constructor(private _detectorControlService: DetectorControlService) { }

  ngOnInit(): void {
    this.startTime = this._detectorControlService.startTime;
    this.endTime = this._detectorControlService.endTime;
    this.detectorNodesSubject.subscribe(x => {
      //this.nodeList = x;
      // setTimeout(() => {
      //   this.showView = true;
      // }, 1000);
      
      this.detectorView = x;
    });
  }

  changeTab(ev: any){
    this.pivotKey = ev.item.props.itemKey;
  }

}
