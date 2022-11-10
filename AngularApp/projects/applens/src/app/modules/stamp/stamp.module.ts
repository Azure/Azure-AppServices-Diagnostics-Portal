import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StampFinderComponent } from './stamp-finder/stamp-finder.component';
import { SharedModule } from '../../shared/shared.module';

export const StampModuleRoutes : ModuleWithProviders<StampModule> = RouterModule.forChild([
  {
    path: '',
    component: StampFinderComponent
  }
]);

@NgModule({
  imports: [
    CommonModule,
    StampModuleRoutes,
    SharedModule
  ],
  declarations: [StampFinderComponent]
})
export class StampModule { }
