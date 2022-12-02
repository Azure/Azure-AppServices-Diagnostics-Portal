import { Component, Input, OnInit, ViewChild } from '@angular/core';
import {
  DevelopMode,
  OnboardingFlowComponent
} from '../../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';

@Component({
  selector: 'tab-gist-develop',
  templateUrl: './tab-gist-develop.component.html',
  styleUrls: ['./tab-gist-develop.component.scss']
})
export class TabGistDevelopComponent implements OnInit {
  DevelopMode = DevelopMode;
  id: string;
  gradId: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _diagnosticApiService: ApplensDiagnosticService,
    private _applensGlobal: ApplensGlobal
  ) {}

  ngOnInit() {
    this._route.params.subscribe((params: Params) => {
      this.refresh();
    });
  }

  @ViewChild('onboardingFlow', { static: false })
  onboardingFlowComponent: OnboardingFlowComponent;

  canExit(): boolean {
    return this.onboardingFlowComponent.canExit();
  }

  refresh() {
    this.id = this._route.snapshot.params['gist'].toLowerCase();
    this.gradId = this._route.snapshot.params['gist'];
    this._diagnosticApiService.getGists().subscribe((gistList) => {
      const gist = gistList.find(
        (g) => g.id.toLowerCase() === this.id.toLowerCase()
      );
      this._applensGlobal.updateHeader(gist.name);
    });
  }
}
