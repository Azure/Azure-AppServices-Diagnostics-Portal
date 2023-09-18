import { NgModule, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { RouterModule } from '@angular/router';
import { GenericSupportTopicService, GenericContentService, GenericResourceService, GenericDocumentsSearchService, ConversationalDiagService } from 'diagnostic-data';
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
import { UncategorizedDetectorsResolver } from './resolvers/uncategorized-detectors.resolver';
import { DetectorCategorizationService } from '../shared/services/detector-categorized.service';
import { MetricsPerInstanceAppServicePlanResolver, AdvanceApplicationRestartResolver, SecurityScanningResolver, MetricsPerInstanceAppsResolver, DiagnosticToolsRoutes } from '../diagnostic-tools/diagnostic-tools.routeconfig';
import { CategoryTileV4Component } from '../fabric-ui/components/category-tile-v4/category-tile-v4.component';
import { GenieModule } from '../genie/genie.module';
import { FabricModule } from '../fabric-ui/fabric.module';
import { ResourceService } from '../shared-v2/services/resource.service';
import { RiskTileComponent } from './components/risk-tile/risk-tile.component';
import { IntegratedSolutionsViewComponent } from '../shared/components/integrated-solutions-view/integrated-solutions-view.component';
import { HomeContainerComponent } from './components/home-container/home-container.component';
import { SolutionOrchestratorComponent } from "diagnostic-data";
import { FabSearchBoxModule } from '@angular-react/fabric/lib/components/search-box';
import { FabCommandBarModule } from '@angular-react/fabric/lib/components/command-bar';
import { FabSpinnerModule } from '@angular-react/fabric/lib/components/spinner';
import { DownloadReportComponent } from '../shared/components/download-report/download-report.component';
import { GenericClientScriptService } from 'projects/diagnostic-data/src/lib/services/generic-client-script.service';
import { ClientScriptService } from '../shared-v2/services/client-script.service';
import { DiagChatHomeComponent } from './diag-chat-home/diag-chat-home.component';
import { FabLinkModule } from '@angular-react/fabric/lib/components/link';
import { OpenAIArmService, GenericDocumentationCopilotService, ChatUIContextService } from 'diagnostic-data';
import { DiagDocumentationCopilotService } from '../shared-v2/services/diag-documentation-copilot.service';
import { DocumentationCopilotModule } from '../documentation-copilot/documentation-copilot.module';
import { ConversationalDiagPortalService } from '../shared-v2/services/conversational-diagnostic-portal.service';

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
                path: 'diagnosticChat',
                component: DiagChatHomeComponent,
                data: {
                    navigationTitle: 'DiagChat',
                    cacheComponent: true
                },
                //pathMatch: 'full',
                children: [
                    {
                        'path': 'tools',
                        loadChildren: () => import('../diagnostic-tools/diagnostic-tools.module').then(m => m.DiagnosticToolsModule)
                    }
                ]
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
                        path: 'workflows/:workflowId',
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
                        path: 'downloadReport/:detectorName',
                        component: DownloadReportComponent,
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
                    { path: "tools", loadChildren: () => import('../diagnostic-tools/diagnostic-tools.module').then(m => m.DiagnosticToolsModule) },
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
                        path: 'workflows/:workflowId',
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
                        path: 'analysis/:analysisId/dynamic',
                        component: GenericAnalysisComponent,
                        data: {
                            cacheComponent: true
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
                        path: 'analysis/:analysisId/dynamic/detectors',
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
                path: 'workflows/:workflowId',
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
        DocumentationCopilotModule,
        FormsModule,
        MarkdownModule.forRoot({
            sanitize: SecurityContext.STYLE
        }),
        FabSearchBoxModule,
        FabCommandBarModule,
        FabSpinnerModule,
        FabLinkModule
    ],
    declarations: [HomeContainerComponent, HomeComponent, CategoryChatComponent, CategoryTileComponent, SearchResultsComponent, SupportTopicRedirectComponent, DiagnosticsSettingsComponent, CategoryTileV4Component, RiskTileComponent, DiagChatHomeComponent],
    providers:
        [
            CategoryTabResolver,
            CategoryChatResolver,
            TimeControlResolver,
            ContentService,
            OpenAIArmService,
            UncategorizedDetectorsResolver,
            DetectorCategorizationService,
            MetricsPerInstanceAppsResolver,
            MetricsPerInstanceAppServicePlanResolver,
            AdvanceApplicationRestartResolver,
            ChatUIContextService,
            SecurityScanningResolver,
            { provide: GenericSupportTopicService, useExisting: SupportTopicService },
            { provide: GenericContentService, useExisting: ContentService },
            { provide: GenericDocumentsSearchService, useExisting: DocumentSearchService },
            { provide: CXPChatService, useExisting: CXPChatCallerService },
            { provide: GenericResourceService, useExisting: ResourceService },
            { provide: GenericClientScriptService, useExisting: ClientScriptService },
            DiagDocumentationCopilotService,
            { provide: GenericDocumentationCopilotService, useExisting: DiagDocumentationCopilotService },
            ConversationalDiagPortalService,
            { provide: ConversationalDiagService, useExisting: ConversationalDiagPortalService }
        ],
})
export class HomeModule { }
