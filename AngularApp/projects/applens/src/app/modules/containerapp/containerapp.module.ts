import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContainerAppFinderComponent } from './containerapp-finder/containerapp-finder.component';
import { SharedModule } from '../../shared/shared.module';

export const ContainerAppModuleRoutes : ModuleWithProviders<ContainerAppModule> = RouterModule.forChild([
  {
    path: '',
    component: ContainerAppFinderComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    ContainerAppModuleRoutes,
    SharedModule
  ],
  declarations: [ContainerAppFinderComponent]
})
export class ContainerAppModule { }
