import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { NoCodeExpressionResponse } from 'projects/applens/src/app/modules/dashboard/dynamic-node-settings/node-rendering-json-models';
import { BehaviorSubject, Observable, of } from 'rxjs';


@Component({
  selector: 'no-code-detector-panel',
  templateUrl: './no-code-detector-panel.component.html',
  styleUrls: ['./no-code-detector-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class NoCodeDetectorPanelComponent implements OnInit {
  detectorNodesSubject = new BehaviorSubject<NoCodeExpressionResponse[]>([]);
  @Input() set detectorNodes(nodes: NoCodeExpressionResponse[]) {
    this.detectorNodesSubject.next(nodes);
  }
  nodeList: NoCodeExpressionResponse[] = [];
  @Input() detectorJson: string = "";
  @Input() startTime: string = "";
  @Input() endTime: string = "";
  @Input() isOpenObservable: Observable<boolean>;
  isOpen: boolean = false;

  constructor(private changeDetection: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.detectorNodesSubject.subscribe(x => {
      this.nodeList = x;
      this.nodeList.slice();
      this.isOpen = x.length > 0;
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

  ngOnChanges(changes: SimpleChanges){
    //if (this.isOpen) this.openPanel();
    //this.nodeList = changes.columns.currentValue;
  }

  trackBy(index, item) {
    return item;
  }

  nodeListObservable(){
    //return of(this.nodeList);
  }

}
