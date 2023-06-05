import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NoCodeExpressionResponse } from 'projects/applens/src/app/modules/dashboard/dynamic-node-settings/node-rendering-json-models';
import { BehaviorSubject, Observable } from 'rxjs';


@Component({
  selector: 'no-code-detector-panel',
  templateUrl: './no-code-detector-panel.component.html',
  styleUrls: ['./no-code-detector-panel.component.scss']
})
export class NoCodeDetectorPanelComponent implements OnInit {
  detectorNodesSubject = new BehaviorSubject<NoCodeExpressionResponse[]>([]);
  @Input() set detectorNodes(nodes: NoCodeExpressionResponse[]) {
    this.detectorNodesSubject.next(nodes);
    this.isOpen = nodes.length > 0;
  }
  nodeList: NoCodeExpressionResponse[] = [];
  //@Input() detectorNodes: NoCodeExpressionResponse[] = [];
  @Input() detectorJson: string = "";
  @Input() startTime: string = "";
  @Input() endTime: string = "";
  @Input() isOpenObservable: Observable<boolean>;
  isOpen: boolean = false;
  //@Output() isOpenChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit(): void {
    // this.isOpenObservable.subscribe(x => {
    //   this.isOpen = x;
    // });
    this.detectorNodesSubject.subscribe(x => {
      this.nodeList = x;
    });
  }

  publishDetector(){
    console.log("publish");
  }

  backToEditor(){
    console.log("back to editor");
  }

  openPanel(){
    this.isOpen = true;
    //this.isOpenChange.emit(true);
  }

  closePanel(){
    this.isOpen = false;
    //this.isOpenChange.emit(true);
  }

  ngOnChanges(){
    if (this.isOpen) this.openPanel();
  }

}
