import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { MyDatePickerModule } from 'mydatepicker';

import { AvailabilityComponent } from './availability.component';
import { AppCurrentHealthComponent } from './currenthealth/app-current-health.component';
import { AvailabilityGraphComponent } from './analysis/availability-graph.component';
import { ObservationsComponent } from './observations/observations.component';
import { ObservationsAvailabilityComponent } from './observations/observations-availability.component';
import { ObservationsPerformanceComponent } from './observations/observations-performance.component';
import { SolutionListComponent } from './solutions/solution-list.component';
import { AppAnalysisComponent } from './analysis/app-analysis.component';
import { PerfAnalysisComponent } from './analysis/perf-analysis.component';
import { WebAppRestartComponent } from './analysis/webapprestart/webapprestart.component';
import { MemoryAnalysisComponent } from './analysis/memory-analysis/memory-analysis.component';
import { DetectorViewBaseComponent } from './detector-view/detector-view-base/detector-view-base.component';
import { DetectorViewMainComponent } from './detector-view/detector-view-main/detector-view-main.component';
import { DetectorViewProblemComponent } from './detector-view/detector-view-problem/detector-view-problem.component';
import { DetectorViewInstanceDetailComponent } from './detector-view/detector-view-instance-detail/detector-view-instance-detail.component';
import { SiteCpuAnalysisDetectorComponent } from './detector-view/detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { SiteMemoryAnalysisDetectorComponent } from './detector-view/detectors/site-memory-analysis-detector/site-memory-analysis-detector.component';
import { ThreadDetectorComponent } from './detector-view/detectors/thread-detector/thread-detector.component';
import { FrebAnalysisDetectorComponent } from './detector-view/detectors/freb-analysis-detector/freb-analysis-detector.component';
import { PhpLogAnalyzerComponent } from './detector-view/detectors/php-log-analyzer-detector/php-log-analyzer-detector.component';
import { CommittedMemoryUsageComponent } from './detector-view/detectors/committed-memory-detector/committed-memory-detector.component';
import { PageFileOperationsComponent } from './detector-view/detectors/page-operations-detector/page-operations-detector.component';
import { ToolsMenuComponent } from './tools-menu/tools-menu.component';
import { AvailabilityAndPerformanceCategoryRouteConfig } from './availability.routeconfig';

import { UriElementsService } from '../shared/services'

@NgModule({
    declarations: [
        AvailabilityComponent,
        DetectorViewBaseComponent,
        DetectorViewMainComponent,
        AppCurrentHealthComponent,
        AvailabilityGraphComponent,
        ObservationsComponent,
        ObservationsAvailabilityComponent,
        ObservationsPerformanceComponent,
        SolutionListComponent,
        AppAnalysisComponent,
        PerfAnalysisComponent,
        WebAppRestartComponent,
        ToolsMenuComponent,
        DetectorViewInstanceDetailComponent,
        DetectorViewProblemComponent,
        SiteCpuAnalysisDetectorComponent,
        SiteMemoryAnalysisDetectorComponent,
        ThreadDetectorComponent,
        FrebAnalysisDetectorComponent,
        PhpLogAnalyzerComponent,
        MemoryAnalysisComponent,
        CommittedMemoryUsageComponent,
        PageFileOperationsComponent
    ],
    imports: [
        RouterModule.forChild(AvailabilityAndPerformanceCategoryRouteConfig),
        SharedModule,
        MyDatePickerModule 
    ],
    exports: [
        ObservationsComponent,
        ObservationsAvailabilityComponent,
        ObservationsPerformanceComponent
    ]
})
export class AvailabilityModule {
    constructor(
    ) { }
}