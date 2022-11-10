import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SiteComponent } from './site/site.component';
import { RouterModule } from '@angular/router';
import { SiteFinderComponent } from './site-finder/site-finder.component';
import { SharedModule } from '../../shared/shared.module';

export const SiteModuleRoutes : ModuleWithProviders<SiteModule> = RouterModule.forChild([
  {
    path: '',
    component: SiteFinderComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SiteModuleRoutes,
    SharedModule
  ],
  declarations: [SiteComponent, SiteFinderComponent]
})
export class SiteModule { }
