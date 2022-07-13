import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { SharedV2Module } from '../shared-v2/shared-v2.module';
import { GenericSupportTopicService, GenericContentService, GenericResourceService, GenericDocumentsSearchService } from 'diagnostic-data';
import { HomeComponent } from './components/home/home.component';
import { CategoryChatComponent } from './components/category-chat/category-chat.component';
import { CategoryTileComponent } from './components/category-tile/category-tile.component';
import { CategoryTabResolver, CategoryChatResolver } from './resolvers/category-tab.resolver';
import { SupportBotModule } from '../supportbot/supportbot.module';
import { SearchResultsComponent } from './components/search-results/search-results.component';
import { FormsModule } from '@angular/forms';
import { GenericDetectorComponent } from '../shared/components/generic-detector/generic-detector.component';
import { TabTitleResolver } from '../shared/resolvers/tab-name.resolver';
import { SupportTopicRedirectComponent } from './components/support-topic-redirect/support-topic-redirect.component';
import { TimeControlResolver } from './resolvers/time-control.resolver';
import { ContentService } from '../shared-v2/services/content.service';
import { DocumentSearchService } from '../shared-v2/services/documents-search.service';
import { DiagnosticDataModule } from 'diagnostic-data';
import { GenericAnalysisComponent } from '../shared/components/generic-analysis/generic-analysis.component';
import { CategorySummaryComponent } from '../fabric-ui/components/category-summary/category-summary.component';
import { CategoryOverviewComponent } from '../fabric-ui/components/category-overview/category-overview.component';
import { DiagnosticsSettingsComponent } from './components/diagnostics-settings/diagnostics-settings.component';
import { SupportTopicService } from '../shared-v2/services/support-topic.service';
import { MarkdownModule } from 'ngx-markdown';
import { CXPChatService } from 'diagnostic-data';
import { PortalReferrerResolverComponent } from '../shared/components/portal-referrer-resolver/portal-referrer-resolver.component';
import { CXPChatCallerService } from '../shared-v2/services/cxp-chat-caller.service';
import { FabCommandBarModule, FabSearchBoxModule, FabSpinnerModule } from '@angular-react/fabric';
import { UncategorizedDetectorsResolver } from './resolvers/uncategorized-detectors.resolver';
import { DetectorCategorizationService } from '../shared/services/detector-categorized.service';
import { ToolNames } from '../shared/models/tools-constants';
import { ProfilerToolComponent } from '../shared/components/tools/profiler-tool/profiler-tool.component';
import { NetworkCheckComponent } from '../shared/components/tools/network-checks/network-checks.component';
import { MemoryDumpToolComponent } from '../shared/components/tools/memorydump-tool/memorydump-tool.component';
import { JavaThreadDumpToolComponent } from '../shared/components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { JavaMemoryDumpToolComponent } from '../shared/components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { ConnectionDiagnoserToolComponent } from '../shared/components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { AutohealingComponent } from '../auto-healing/autohealing.component';
import { NetworkTraceToolComponent } from '../shared/components/tools/network-trace-tool/network-trace-tool.component';
import { DaasMainComponent } from '../shared/components/daas-main/daas-main.component';
import { AutohealingDetectorComponent } from '../availability/detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { CpuMonitoringToolComponent } from '../shared/components/tools/cpu-monitoring-tool/cpu-monitoring-tool.component';
import { EventViewerComponent } from '../shared/components/daas/event-viewer/event-viewer.component';
import { FrebViewerComponent } from '../shared/components/daas/freb-viewer/freb-viewer.component';
import { MetricsPerInstanceAppServicePlanResolver, AdvanceApplicationRestartResolver, SecurityScanningResolver, MetricsPerInstanceAppsResolver } from '../diagnostic-tools/diagnostic-tools.routeconfig';
import { CategoryTileV4Component } from '../fabric-ui/components/category-tile-v4/category-tile-v4.component';
import { GenieModule } from '../genie/genie.module';
import { FabricModule } from '../fabric-ui/fabric.module';
import { ResourceService } from '../shared-v2/services/resource.service';
import { JavaFlightRecorderToolComponent } from '../shared/components/tools/java-flight-recorder-tool/java-flight-recorder-tool.component';
import { CrashMonitoringComponent } from '../shared/components/tools/crash-monitoring/crash-monitoring.component';
import { RiskTileComponent } from './components/risk-tile/risk-tile.component';
import { IntegratedSolutionsViewComponent } from '../shared/components/integrated-solutions-view/integrated-solutions-view.component';
import { HomeContainerComponent } from './components/home-container/home-container.component';
import { SolutionOrchestratorComponent } from "diagnostic-data";
import { LinuxNodeHeapDumpComponent } from '../shared/components/tools/linux-node-heap-dump/linux-node-heap-dump.component';
import { LinuxNodeCpuProfilerComponent } from '../shared/components/tools/linux-node-cpu-profiler/linux-node-cpu-profiler.component';
import { LinuxPythonCpuProfilerComponent } from '../shared/components/tools/linux-python-cpu-profiler/linux-python-cpu-profiler.component';

export const HomeRoutes = RouterModule.forChild([
    {
        path: '',
        component: HomeContainerComponent,
        data: {
            cacheComponent: true
        },
        children: [
            {
                path: '',
                component: HomeComponent,
                data: {
                    navigationTitle: 'Home',
                    cacheComponent: true
                },
                pathMatch: 'full',
            },
            {
                path: 'solutionorchestrator',
                component: SolutionOrchestratorComponent,
                data: {
                    navigationTitle: 'SolOrch',
                    cacheComponent: false
                },
                children: [
                    {
                        path: 'detectors/:detectorName',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: false
                        },
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'categoriesv3/:category',
                component: CategoryChatComponent,
                data: {
                    cacheComponent: true
                },
                resolve: {
                    navigationTitle: CategoryTabResolver,
                    messageList: CategoryChatResolver
                }
            },
            {
                path: 'categories/:category',
                component: CategorySummaryComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: 'overview',
                        component: CategoryOverviewComponent,
                        data: {
                            cacheComponent: true,
                            navigationTitle: CategoryTabResolver,
                        },
                    },
                    {
                        path: '',
                        redirectTo: 'overview',
                        pathMatch: 'full',
                        data: {
                            cacheComponent: true
                        },
                    },
                    {
                        path: 'analysis/:analysisId',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: false
                        },
                        children: [
                            {
                                path: 'detectors/:detectorName',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: false
                                },
                                resolve: {
                                    time: TimeControlResolver,
                                    navigationTitle: TabTitleResolver,
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId/search',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
                        },
                        children: [
                            {
                                path: '',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: true
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'detectors/:detectorName',
                        component: GenericDetectorComponent,
                        data: {
                            cacheComponent: true
                        },
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                            uncategorizedDetector: UncategorizedDetectorsResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId/search/detectors/:detectorName',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
                        },
                        children: [
                            {
                                path: '',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: true
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'tools/profiler',
                        component: ProfilerToolComponent,
                        data: {
                            navigationTitle: ToolNames.Profiler,
                            cacheComponent: true
                        }
                    },
                    // Profiler Tool for Linux (To be shown when All Instances of a Linux App are running on ANT 98)
                    {
                        path: 'tools/profilerlinuxv2',
                        component: ProfilerToolComponent,
                        data: {
                            navigationTitle: ToolNames.Profiler,
                            cacheComponent: true,
                            allLinuxInstancesOnAnt98: true
                        }
                    },
                    // Memory Dump
                    {
                        path: 'tools/memorydump',
                        component: MemoryDumpToolComponent,
                        data: {
                            navigationTitle: ToolNames.MemoryDump,
                            cacheComponent: true
                        }
                    },
                    // Memory Dump for Linux (To be shown when All Instances of a Linux App are running on ANT 98)
                    {
                        path: 'tools/memorydumplinuxv2',
                        component: MemoryDumpToolComponent,
                        data: {
                            navigationTitle: ToolNames.MemoryDump,
                            cacheComponent: true,
                            allLinuxInstancesOnAnt98: true
                        }
                    },
                    // Java Thread Dump
                    {
                        path: 'tools/javathreaddump',
                        component: JavaThreadDumpToolComponent,
                        data: {
                            navigationTitle: ToolNames.JavaThreadDump,
                            cacheComponent: true
                        }
                    },
                    // Java Memory Dump
                    {
                        path: 'tools/javamemorydump',
                        component: JavaMemoryDumpToolComponent,
                        data: {
                            navigationTitle: ToolNames.JavaMemoryDump,
                            cacheComponent: true
                        }
                    },
                    // Java Flight Recorder
                    {
                        path: 'tools/javaflightrecorder',
                        component: JavaFlightRecorderToolComponent,
                        data: {
                            navigationTitle: ToolNames.JavaFlightRecorder,
                            cacheComponent: true
                        }
                    },
                    // Linux Node Heap Dump
                    {
                        path: 'tools/linuxnodeheapdump',
                        component: LinuxNodeHeapDumpComponent,
                        data: {
                            navigationTitle: ToolNames.LinuxNodeHeapDump,
                            cacheComponent: true
                        }
                    },
                    // Linux Node Cpu Profiler
                    {
                        path: 'tools/linuxnodecpuprofiler',
                        component: LinuxNodeCpuProfilerComponent,
                        data: {
                            navigationTitle: ToolNames.LinuxNodeCpuProfiler,
                            cacheComponent: true
                        }
                    },
                    // Linux Python CPU Profiler
                    {
                        path: 'tools/linuxpythoncpuprofiler',
                        component: LinuxPythonCpuProfilerComponent,
                        data: {
                            navigationTitle: ToolNames.LinuxPythonCpuProfiler,
                            cacheComponent: true
                        }
                    },
                    // Database Test Tool(connection string)
                    {
                        path: 'tools/databasetester',
                        component: ConnectionDiagnoserToolComponent,
                        data: {
                            navigationTitle: ToolNames.DatabaseTester,
                            cacheComponent: true
                        }
                    },
                    // CPU Monitoring tool
                    {
                        path: 'tools/cpumonitoring',
                        component: CpuMonitoringToolComponent,
                        data: {
                            navigationTitle: ToolNames.CpuMonitoring,
                            cacheComponent: true
                        }
                    },
                    // Crash Monitoring tool
                    {
                        path: 'tools/crashmonitoring',
                        component: CrashMonitoringComponent,
                        data: {
                            navigationTitle: ToolNames.CrashMonitoring,
                            cacheComponent: true
                        }
                    },
                    // Autohealing
                    {
                        path: 'tools/mitigate',
                        component: AutohealingComponent,
                        data: {
                            navigationTitle: ToolNames.AutoHealing,
                            detectorComponent: AutohealingDetectorComponent
                        }
                    },
                    // Network Trace
                    {
                        path: 'tools/networktrace',
                        component: NetworkTraceToolComponent,
                        data: {
                            navigationTitle: ToolNames.NetworkTrace,
                            cacheComponent: true
                        }
                    },
                    // Network Checks
                    {
                        path: 'tools/networkchecks',
                        component: NetworkCheckComponent,
                        data: {
                            navigationTitle: ToolNames.NetworkChecks,
                            cacheComponent: true
                        }
                    },
                    // Diagnostics
                    {
                        path: 'tools/daas',
                        component: DaasMainComponent,
                        data: {
                            navigationTitle: ToolNames.Diagnostics,
                            cacheComponent: true
                        }
                    },
                    // Event Viewer
                    {
                        path: 'tools/eventviewer',
                        component: EventViewerComponent,
                        data: {
                            navigationTitle: ToolNames.EventViewer,
                            cacheComponent: true
                        }
                    },
                    // Freb Viewer
                    {
                        // path: 'tools/frebviewer',
                        path: 'tools/freblogs',
                        component: FrebViewerComponent,
                        data: {
                            navigationTitle: ToolNames.FrebViewer,
                            cacheComponent: true
                        }
                    },
                    //Metrics per Instance (Apps)
                    {
                        // path: 'tools/metricsperinstance',
                        path: 'tools/sitemetrics',
                        resolve: {
                            reroute: MetricsPerInstanceAppsResolver
                        },
                    },
                    //Metrics per Instance (App Service Plan)
                    {
                        // path: 'tools/metricsperinstanceappserviceplan',
                        path: 'tools/appserviceplanmetrics',
                        resolve: {
                            reroute: MetricsPerInstanceAppServicePlanResolver
                        },
                    },
                    //Advanced Application Restart
                    {
                        // path: 'tools/applicationrestart',
                        path: 'tools/advancedapprestart',
                        resolve: {
                            reroute: AdvanceApplicationRestartResolver
                        },
                    },
                    //Security Scanning
                    {
                        // path: 'tools/securityscanning',
                        path: 'tools/tinfoil',
                        resolve: {
                            reroute: SecurityScanningResolver
                        },
                    },
                    // App settings page
                    {
                        path: 'settings',
                        component: DiagnosticsSettingsComponent,
                        data: {
                            navigationTitle: 'App Service Diagnostics Settings'
                        }
                    },
                ],
                resolve: {
                    navigationTitle: CategoryTabResolver,
                    // messageList: CategoryChatResolver
                }
            },
            {
                path: 'integratedSolutions',
                component: IntegratedSolutionsViewComponent,
                children: [
                    {
                        path: 'detectors/:detectorName',
                        component: GenericDetectorComponent,
                        data: {
                            cacheComponent: true
                        },
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: false
                        },
                        children: [
                            {
                                path: 'detectors/:detectorName',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: false
                                },
                                resolve: {
                                    time: TimeControlResolver,
                                    navigationTitle: TabTitleResolver,
                                }
                            },
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId/search',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
                        },
                        children: [
                            {
                                path: '',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: true
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId/search/detectors/:detectorName',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
                        },
                        children: [
                            {
                                path: '',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: true
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                    {
                        path: 'analysis/:analysisId/detectors',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
                        },
                        children: [
                            {
                                path: '',
                                component: GenericDetectorComponent,
                                data: {
                                    analysisMode: true,
                                    cacheComponent: true
                                }
                            }
                        ],
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                ]
            }
            ,
            {
                path: 'detectors/:detectorName',
                component: GenericDetectorComponent,
                data: {
                    cacheComponent: true
                },
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver
                }
            },
            {
                path: 'analysis/:analysisId',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: false
                },
                children: [
                    {
                        path: 'detectors/:detectorName',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: false
                        },
                        resolve: {
                            time: TimeControlResolver,
                            navigationTitle: TabTitleResolver,
                        }
                    },
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'analysis/:analysisId/search',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'analysis/:analysisId/search/detectors/:detectorName',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'analysis/:analysisId/detectors',
                component: GenericAnalysisComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: GenericDetectorComponent,
                        data: {
                            analysisMode: true,
                            cacheComponent: true
                        }
                    }
                ],
                resolve: {
                    time: TimeControlResolver,
                    navigationTitle: TabTitleResolver,
                }
            },
            {
                path: 'supportTopicId',
                component: SupportTopicRedirectComponent
            },
            {
                path: 'settings',
                component: DiagnosticsSettingsComponent,
                data: {
                    navigationTitle: 'App Service Diagnostics Settings'
                }
            },
            {
                path: 'portalReferrerResolver',
                component: PortalReferrerResolverComponent,
                data: {
                    cacheComponent: true
                },
                resolve: {
                    time: TimeControlResolver
                }
            }
        ]
    },
]);

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        DiagnosticDataModule,
        HomeRoutes,
        SupportBotModule,
        GenieModule,
        FabricModule,
        FormsModule,
        MarkdownModule.forRoot(),
        FabSearchBoxModule,
        FabCommandBarModule,
        FabSpinnerModule
    ],
    declarations: [HomeContainerComponent, HomeComponent, CategoryChatComponent, CategoryTileComponent, SearchResultsComponent, SupportTopicRedirectComponent, DiagnosticsSettingsComponent, CategoryTileV4Component, RiskTileComponent],
    providers:
        [
            CategoryTabResolver,
            CategoryChatResolver,
            TimeControlResolver,
            ContentService,
            UncategorizedDetectorsResolver,
            DetectorCategorizationService,
            MetricsPerInstanceAppsResolver,
            MetricsPerInstanceAppServicePlanResolver,
            AdvanceApplicationRestartResolver,
            SecurityScanningResolver,
            { provide: GenericSupportTopicService, useExisting: SupportTopicService },
            { provide: GenericContentService, useExisting: ContentService },
            { provide: GenericDocumentsSearchService, useExisting: DocumentSearchService },
            { provide: CXPChatService, useExisting: CXPChatCallerService },
            { provide: GenericResourceService, useExisting: ResourceService }
        ],
})
export class HomeModule { }
