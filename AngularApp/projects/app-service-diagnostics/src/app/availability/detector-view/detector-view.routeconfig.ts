import { Route } from '@angular/router';

import { DetectorViewBaseComponent } from './detector-view-base/detector-view-base.component';
import { SiteCpuAnalysisDetectorComponent } from './detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { SiteMemoryAnalysisDetectorComponent } from './detectors/site-memory-analysis-detector/site-memory-analysis-detector.component';
import { ThreadDetectorComponent } from './detectors/thread-detector/thread-detector.component';
import { FrebAnalysisDetectorComponent } from './detectors/freb-analysis-detector/freb-analysis-detector.component';
import { PhpLogAnalyzerComponent } from './detectors/php-log-analyzer-detector/php-log-analyzer-detector.component';
import { DockerContainerIntializationComponent } from './detectors/docker-container-start-stop-detector/docker-container-start-stop-detector.component';
import { CommittedMemoryUsageComponent } from './detectors/committed-memory-detector/committed-memory-detector.component';
import { PageFileOperationsComponent } from './detectors/page-operations-detector/page-operations-detector.component';
import { AspNetCoreComponent } from "./detectors/aspnetcore-detector/aspnetcore-detector.component";
import { DetectorLoaderComponent } from './detector-loader/detector-loader.component';
import { AutohealingDetectorComponent } from './detectors/autohealing-detector/autohealing-detector.component';

export const DetectorViewRouteConfig: Route[] = [
    {
        path: 'sitecpuanalysis',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'CPU Analysis',
            detectorComponent: SiteCpuAnalysisDetectorComponent
        }
    },
    {
        path: 'sitememoryanalysis',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Memory Analysis',
            detectorComponent: SiteMemoryAnalysisDetectorComponent
        }
    },
    {
        path: 'threadcount',
        component: DetectorLoaderComponent,
        data:{
            navigationTitle: 'Threads Usage',
            detectorComponent: ThreadDetectorComponent
        }
    },
    {
        path: 'frebanalysis',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Failed Request Traces',
            detectorComponent: FrebAnalysisDetectorComponent
        }
    },
    {
        path: 'loganalyzer',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Php Logs',
            detectorComponent: PhpLogAnalyzerComponent
        }
    },
    {
        path: 'dockercontainerstartstop',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Docker Container Intialization',
            detectorComponent: DockerContainerIntializationComponent
        }
    },
    {
        path: 'committedmemoryusage',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Committed Memory Usage',
            detectorComponent: CommittedMemoryUsageComponent
        }
    },
    {
        path: 'pagefileoperations',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Page File Operations',
            detectorComponent: PageFileOperationsComponent
        }
    },
    {
        path: 'aspnetcore',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'AspNetCore Logs',
            detectorComponent: AspNetCoreComponent
        }
    },
    {
        path: 'autoheal',
        component: DetectorLoaderComponent,
        data: {
            navigationTitle: 'Autohealing Events',
            detectorComponent: AutohealingDetectorComponent
        }
    },
    {
        path: ':detectorName',
        component: DetectorLoaderComponent,
        data:{
            navigationTitle: ':detectorName',
            detectorComponent: DetectorViewBaseComponent
        }
    }
];
