import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DevelopMode, OnboardingFlowComponent } from '../../onboarding-flow/onboarding-flow.component';
import { DetectorDesignerComponent } from '../../detector-designer/detector-designer.component';

@Component({
  selector: 'tab-develop',
  templateUrl: './tab-develop.component.html',
  styleUrls: ['./tab-develop.component.scss']
})
export class TabDevelopComponent implements OnInit {

  DevelopMode = DevelopMode;
  id: string;
  isWorkflow: boolean = false;
  isNoCode: boolean = false;

  constructor(private _route: ActivatedRoute, private _changeDetectorRef: ChangeDetectorRef) {
  }

  @ViewChild("onboardingFlow", { static: false }) onboardingFlowComponent: OnboardingFlowComponent;
  @ViewChild("detectorDesigner", { static: false }) detectorDesignerComponent: DetectorDesignerComponent;

  canExit(): boolean {
    this._changeDetectorRef.detectChanges();
    return this.isNoCode ? this.detectorDesignerComponent.canExit() : this.onboardingFlowComponent.canExit();
    // return this.detectorDesignerComponent.canExit();
  };

  ngOnInit() {
    if (this._route.snapshot.routeConfig.path === 'nocodeedit') {
      this.isNoCode = true;
    }
    if (this._route.parent.snapshot.params['detector']) {
      this.id = this._route.parent.snapshot.params['detector'];
      this.isWorkflow = false;
    } else if (this._route.parent.snapshot.params['workflowId']) {
      this.id = this._route.parent.snapshot.params['workflowId'];
      this.isWorkflow = true;
    }

  }
}
