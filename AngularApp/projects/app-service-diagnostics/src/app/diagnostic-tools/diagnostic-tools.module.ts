import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { AutoHealingModule } from '../auto-healing/auto-healing.module';
import { RouterModule } from '@angular/router';
import {
  DiagnosticToolsRoutes,
  MetricsPerInstanceAppServicePlanResolver,
  AdvanceApplicationRestartResolver,
  SecurityScanningResolver,
  MetricsPerInstanceAppsResolver
} from './diagnostic-tools.routeconfig';
import { AvailabilityModule } from '../availability/availability.module';

//TODO: Move all the components for diagnostic tools to this module. For now leaving in shared to avoid a lot of import updates

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    AutoHealingModule,
    AvailabilityModule,
    RouterModule.forChild(DiagnosticToolsRoutes)
  ],
  declarations: [],
  providers: [
    MetricsPerInstanceAppsResolver,
    MetricsPerInstanceAppServicePlanResolver,
    AdvanceApplicationRestartResolver,
    SecurityScanningResolver
  ]
})
export class DiagnosticToolsModule {}
