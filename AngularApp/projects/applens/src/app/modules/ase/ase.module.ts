import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AseFinderComponent } from './ase-finder/ase-finder.component';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';

export const AseModuleRoutes : ModuleWithProviders<AseModule> = RouterModule.forChild([
  {
    path: '',
    component: AseFinderComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    AseModuleRoutes,
    SharedModule
  ],
  declarations: [AseFinderComponent]
})
export class AseModule { }
