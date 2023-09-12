import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ApplensCopilotContainerService, CopilotSupportedFeature } from '../../services/copilot/applens-copilot-container.service';
import { DetectorDevelopmentCopilotComponent } from '../detector-development-copilot/detector-development-copilot.component';
import { Subscription } from 'rxjs';
import { DetectorCopilotComponent } from '../detector-copilot/detector-copilot.component';

@Component({
  selector: 'copilot-container',
  templateUrl: './copilot-container.component.html',
  styleUrls: ['./copilot-container.component.scss']
})
export class CopilotContainerComponent implements OnInit, OnDestroy {

  @ViewChild(DetectorDevelopmentCopilotComponent) detectorDevelopmentCopilotComponent: DetectorDevelopmentCopilotComponent;
  @ViewChild(DetectorCopilotComponent) detectorCopilotComponent: DetectorCopilotComponent;

  public CopilotSupportedFeature: any;
  private closeEventObservable: Subscription;

  constructor(public _copilotContainerService: ApplensCopilotContainerService) {
    this.CopilotSupportedFeature = CopilotSupportedFeature;
  }

  ngOnInit(): void {

    this.closeEventObservable = this._copilotContainerService.onCloseCopilotPanelEvent.subscribe(event => {

      // Detector Develop Copilot needs to override the default close event behaviour
      if (this.detectorDevelopmentCopilotComponent && this.detectorDevelopmentCopilotComponent.handleCloseCopilotEvent) {
        this.detectorDevelopmentCopilotComponent.handleCloseCopilotEvent(event);
      }
      else if (this.detectorCopilotComponent && this.detectorCopilotComponent.handleCloseCopilotEvent) {
        this.detectorCopilotComponent.handleCloseCopilotEvent(event);
      }
      else {
        this.handleCloseCopilotEvent(event);
      }
    });
  }

  ngOnDestroy() {
    if (this.closeEventObservable) {
      this.closeEventObservable.unsubscribe();
    }
  }

  handleCloseCopilotEvent(event: any) {
    this._copilotContainerService.hideCopilotPanel();
  }
}
