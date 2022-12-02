import { NgModule, ModuleWithProviders } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';

import { SolutionsWidgetComponent } from './components/common/solutions-widget/solutions-widget.component';
import { DynamicSolutionPlaceHolderDirective } from './directives/dynamic-solution-placeholder.directive';
import { SiteRestartComponent } from './components/specific-solutions/site-restart-solution/site-restart-solution.component';
import { DynamicSolutionComponent } from './components/common/dynamic-solution/dynamic-solution.component';
import { ScaleUpSolutionComponent } from './components/specific-solutions/scale-up-solution/scale-up-solution.component';
import { DefaultSolutionTemplateComponent } from './components/common/default-solution-template/default-solution-template.component';
import { SolutionOperationComponent } from './components/common/solution-operation/solution-operation.component';
import { ScaleOutSolutionComponent } from './components/specific-solutions/scale-out-solution/scale-out-solution.component';
import { SplitSitesIntoDifferentServerFarmsSolutionComponent } from './components/specific-solutions/split-sites-serverfarms-solution/split-sites-serverfarms-solution.component';
import { SolutionFeedbackComponent } from './components/common/solution-feedback/solution-feedback.component';
import { RevertDeploymentComponent } from './components/specific-solutions/revert-deployment-solution/revert-deployment-solution.component';
import { DiagnosticDataModule } from 'diagnostic-data';

@NgModule({
  declarations: [
    DynamicSolutionPlaceHolderDirective,
    DynamicSolutionComponent,
    SolutionsWidgetComponent,
    SiteRestartComponent,
    ScaleUpSolutionComponent,
    ScaleOutSolutionComponent,
    DefaultSolutionTemplateComponent,
    SolutionOperationComponent,
    SplitSitesIntoDifferentServerFarmsSolutionComponent,
    SolutionFeedbackComponent,
    RevertDeploymentComponent
  ],
  imports: [SharedModule, DiagnosticDataModule],
  exports: [SolutionsWidgetComponent],
  providers: []
})
export class SolutionsModule {}
