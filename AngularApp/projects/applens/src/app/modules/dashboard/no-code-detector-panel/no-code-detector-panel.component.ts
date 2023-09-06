import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { NoCodeExpressionResponse } from 'projects/applens/src/app/modules/dashboard/dynamic-node-settings/node-rendering-json-models';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';


@Component({
  selector: 'no-code-detector-panel',
  templateUrl: './no-code-detector-panel.component.html',
  styleUrls: ['./no-code-detector-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class NoCodeDetectorPanelComponent implements OnInit {
  detectorNodesSubject = new BehaviorSubject<any>(null);
  @Input() set detectorNodes(nodes: any) {
    this.detectorNodesSubject.next(nodes);
  }
  nodeList: NoCodeExpressionResponse[] = [];
  @Input() detectorJson: string = "";
  // @Input() startTime: moment.Moment;
  // @Input() endTime: moment.Moment;
  @Input() isOpenObservable: Observable<boolean>;
  @Output() publish = new EventEmitter<any>();
  isOpen: boolean = false;
  detectorView: any;
  type: PanelType = PanelType.custom;

  constructor(private changeDetection: ChangeDetectorRef, public diagnosticApiService: ApplensDiagnosticService) { }

  ngOnInit(): void {
    this.detectorNodesSubject.subscribe(x => {
      this.detectorView = x;
      //this.isOpen = x != null;
      // this.nodeList = x;
      // this.nodeList.slice();
      // this.isOpen = x.length > 0;
    });
    this.isOpenObservable.subscribe(x => {
      this.isOpen = x;
    });
  }

  publishDetector(){
    console.log("publish");
    this.publish.emit("");
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
