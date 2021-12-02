import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { SolutionsModule } from '../solutions/solutions.module';
import { DiagnosticDataModule } from 'diagnostic-data';
import { AvailabilityComponent } from './availability.component';
import { AppCurrentHealthComponent } from './currenthealth/app-current-health.component';
import { SolutionListComponent } from './solutions/solution-list.component';
import { DetectorViewBaseComponent } from './detector-view/detector-view-base/detector-view-base.component';
import { DetectorViewProblemComponent } from './detector-view/detector-view-problem/detector-view-problem.component';
import { DetectorViewInstanceDetailComponent } from './detector-view/detector-view-instance-detail/detector-view-instance-detail.component';
import { SiteCpuAnalysisDetectorComponent } from './detector-view/detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { SiteMemoryAnalysisDetectorComponent } from './detector-view/detectors/site-memory-analysis-detector/site-memory-analysis-detector.component';
import { ThreadDetectorComponent } from './detector-view/detectors/thread-detector/thread-detector.component';
import { FrebAnalysisDetectorComponent } from './detector-view/detectors/freb-analysis-detector/freb-analysis-detector.component';
import { PhpLogAnalyzerComponent } from './detector-view/detectors/php-log-analyzer-detector/php-log-analyzer-detector.component';
import { DockerContainerIntializationComponent } from './detector-view/detectors/docker-container-start-stop-detector/docker-container-start-stop-detector.component';
import { CommittedMemoryUsageComponent } from './detector-view/detectors/committed-memory-detector/committed-memory-detector.component';
import { PageFileOperationsComponent } from './detector-view/detectors/page-operations-detector/page-operations-detector.component';
import { ToolsMenuComponent } from './tools-menu/tools-menu.component';
import { AvailabilityAndPerformanceCategoryRouteConfig } from './availability.routeconfig';
import { AspNetCoreComponent } from "./detector-view/detectors/aspnetcore-detector/aspnetcore-detector.component";
import { AppInsightsTileComponent } from './app-insights/app-insights-tile.component';
import { AppInsightsExceptionsComponent } from './app-insights/exceptions/app-insights-exceptions.component';
import { AppInsightsDependenciesComponent } from './app-insights/dependencies/app-insights-dependencies.component';
import { DetectorLoaderComponent } from './detector-view/detector-loader/detector-loader.component';
import { AutohealingDetectorComponent } from './detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { RerouteResolver } from './reroute/reroute.resolver';

@NgModule({
    declarations: [
        AvailabilityComponent,
        DetectorViewBaseComponent,
        AppCurrentHealthComponent,
        SolutionListComponent,
        ToolsMenuComponent,
        DetectorViewInstanceDetailComponent,
        DetectorViewProblemComponent,
        SiteCpuAnalysisDetectorComponent,
        SiteMemoryAnalysisDetectorComponent,
        ThreadDetectorComponent,
        FrebAnalysisDetectorComponent,
        PhpLogAnalyzerComponent,
        DockerContainerIntializationComponent,
        CommittedMemoryUsageComponent,
        PageFileOperationsComponent,
        AspNetCoreComponent,
        AppInsightsTileComponent,
        AppInsightsExceptionsComponent,
        AppInsightsDependenciesComponent,
        DetectorLoaderComponent,
        AutohealingDetectorComponent,
    ],
    imports: [
        RouterModule.forChild(AvailabilityAndPerformanceCategoryRouteConfig),
        SharedModule,
        SolutionsModule,
        DiagnosticDataModule
    ],
    exports: [
        DetectorViewProblemComponent,
        AppInsightsTileComponent,
        AutohealingDetectorComponent,
        DetectorLoaderComponent
    ],
    providers:[RerouteResolver]
})
export class AvailabilityModule {
    constructor(
    ) { }
}
