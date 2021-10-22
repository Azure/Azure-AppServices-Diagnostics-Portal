import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { RouterModule } from '@angular/router';
import { ContainerAppFinderComponent } from './containerapp-finder/containerapp-finder.component';
import { SharedModule } from '../../shared/shared.module';

export const ContainerAppModuleRoutes : ModuleWithProviders = RouterModule.forChild([
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
