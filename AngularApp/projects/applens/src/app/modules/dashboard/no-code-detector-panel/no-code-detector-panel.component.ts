import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { IButtonStyles, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { NoCodeExpressionResponse } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { executionState } from '../node-composer/node-composer.component';


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
  @Input() isOpenObservable: Observable<boolean>;
  executionState = executionState;
  @Input() state: executionState = this.executionState.success;
  @Input() errorMessage: string = "";
  @Output() publish = new EventEmitter<any>();
  isOpen: boolean = false;
  detectorView: any;
  type: PanelType = PanelType.custom;

  panelStyle: IPanelProps['styles'] = {
    root: {
      height: "100%",
      display: "block"
    }
  }

  constructor(private changeDetection: ChangeDetectorRef, public diagnosticApiService: ApplensDiagnosticService) { }

  ngOnInit(): void {
    this.detectorNodesSubject.subscribe(x => {
      this.detectorView = x;
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
  }

  closePanel(){
    this.isOpen = false;
  }

  ngOnChanges(changes: SimpleChanges){
  }

  trackBy(index, item) {
    return item;
  }

  nodeListObservable(){
  }

}
