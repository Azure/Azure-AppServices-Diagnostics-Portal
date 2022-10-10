import { Component, OnInit, ViewChild } from '@angular/core';
import { DevelopMode, OnboardingFlowComponent } from '../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute } from '@angular/router';
import { DevelopNavigationGuardService, IDeactivateComponent } from '../develop-navigation-guard.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'gist',
  templateUrl: './gist.component.html',
  styleUrls: ['./gist.component.scss']
})
export class GistComponent implements OnInit,IDeactivateComponent {
  DevelopMode = DevelopMode;

  constructor(private _route: ActivatedRoute) {
  }

  @ViewChild("onboardingFlow",{static: true}) onboardingFlowComponent: OnboardingFlowComponent;

  canExit(): boolean {
    return this.onboardingFlowComponent.canExit();
  };

  ngOnInit() {
  }
}
