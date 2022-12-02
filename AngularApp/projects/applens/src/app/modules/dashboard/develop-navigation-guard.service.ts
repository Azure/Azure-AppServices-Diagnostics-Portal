import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { OnboardingFlowComponent } from './onboarding-flow/onboarding-flow.component';

export interface IDeactivateComponent {
  canExit: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DevelopNavigationGuardService
  implements CanDeactivate<OnboardingFlowComponent>
{
  component: Object;
  route: ActivatedRouteSnapshot;

  constructor() {}

  canDeactivate(
    component: IDeactivateComponent,
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
    nextState: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return component.canExit ? component.canExit() : true;
  }
}
