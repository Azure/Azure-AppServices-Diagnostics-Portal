import { Component, OnInit, ViewChild } from '@angular/core';
import { DevelopMode, OnboardingFlowComponent } from '../../onboarding-flow/onboarding-flow.component';

@Component({
  selector: 'workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {

  DevelopMode = DevelopMode;
  constructor() {
  }

  @ViewChild("onboardingFlow", { static: true }) onboardingFlowComponent: OnboardingFlowComponent;

  canExit(): boolean {
    return this.onboardingFlowComponent.canExit();
  };

  ngOnInit() {
  }

}
