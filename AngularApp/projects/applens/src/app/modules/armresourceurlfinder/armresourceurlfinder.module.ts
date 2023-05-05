import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ArmResourceUrlFinder } from './armresourceurlfinder.component';
import { SharedModule } from '../../shared/shared.module';

export const ArmResourceUrlFinderRoutes : ModuleWithProviders<ArmResourceUrlFinderModule> = RouterModule.forChild([
  {
    path: '',
    component: ArmResourceUrlFinder
  }
]);

@NgModule({
  imports: [
    CommonModule,
    ArmResourceUrlFinderRoutes,
    SharedModule
  ],
  declarations: [ArmResourceUrlFinder]
})
export class ArmResourceUrlFinderModule { }
