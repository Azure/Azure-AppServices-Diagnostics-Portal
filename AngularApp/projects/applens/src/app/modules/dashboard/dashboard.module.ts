import { NgModule, Injectable, SecurityContext, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent, FormatResourceNamePipe } from './dashboard/dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AngularSplitModule } from 'angular-split-ng6';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { NgxSmartModalModule } from 'ngx-smart-modal';
import { MarkdownModule } from 'ngx-markdown';
import { StartupService } from '../../shared/services/startup.service';
import { Observable, of } from 'rxjs';
import { SideNavComponent, SearchMenuPipe } from './side-nav/side-nav.component';
import { ResourceMenuItemComponent } from './resource-menu-item/resource-menu-item.component';
import { DiagnosticApiService } from '../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../shared/services/resource.service';
import { ResourceServiceFactory } from '../../shared/providers/resource.service.provider';
import { ResourceHomeComponent } from './resource-home/resource-home.component';
import { OnboardingFlowComponent } from './onboarding-flow/onboarding-flow.component';
import { DetectorCopilotComponent } from './detector-copilot/detector-copilot.component';
import { TabCommonComponent } from './tabs/tab-common/tab-common.component';
import { TabDataComponent } from './tabs/tab-data/tab-data.component';
import { TabDevelopComponent } from './tabs/tab-develop/tab-develop.component';
import { ApplensDiagnosticService } from './services/applens-diagnostic.service';
import { ApplensCommsService } from './services/applens-comms.service';
import { ApplensSupportTopicService } from './services/applens-support-topic.service';
import { ApplensContentService } from './services/applens-content.service';
import { DiagnosticService, DiagnosticDataModule, CommsService, DetectorControlService, GenericSupportTopicService, GenericContentService, GenericDocumentsSearchService, GenieGlobals, SolutionOrchestratorComponent, TimePickerOptions, GenericBreadcrumbService, GenericUserSettingService } from 'diagnostic-data';
import { CollapsibleMenuModule } from '../../collapsible-menu/collapsible-menu.module';
import { ObserverService } from '../../shared/services/observer.service';
import { TabDataSourcesComponent } from './tabs/tab-data-sources/tab-data-sources.component';
import { TabMonitoringComponent } from './tabs/tab-monitoring/tab-monitoring.component';
import { TabMonitoringDevelopComponent } from './tabs/tab-monitoring-develop/tab-monitoring-develop.component';
import { TabAnalyticsDevelopComponent } from './tabs/tab-analytics-develop/tab-analytics-develop.component';
import { TabAnalyticsDashboardComponent } from './tabs/tab-analytics-dashboard/tab-analytics-dashboard.component';
import { DiagnosticSiteService, GenericResourceService } from 'diagnostic-data';
import { SolutionService } from 'diagnostic-data';
import { GenericSolutionService } from '../../shared/services/generic-solution.service';
import { GistComponent } from './gist/gist.component';
import { TabGistCommonComponent } from './tabs/tab-gist-common/tab-gist-common.component';
import { TabGistDevelopComponent } from './tabs/tab-gist-develop/tab-gist-develop.component';
import { TabChangelistComponent } from './tabs/tab-changelist/tab-changelist.component';
import { GistChangelistComponent } from './gist-changelist/gist-changelist.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { TabAnalysisComponent } from './tabs/tab-analysis/tab-analysis.component';
import { CategoryPageComponent } from './category-page/category-page.component';
import { SupportTopicPageComponent } from './support-topic-page/support-topic-page.component';
import { SelfHelpContentComponent } from './self-help-content/self-help-content.component';
import { UserDetectorsComponent } from './user-detectors/user-detectors.component';
import { SearchTermAdditionComponent } from './search-term-addition/search-term-addition.component';
import { SearchResultsComponent } from './search-results/search-results.component';
import { Sort } from '../../shared/pipes/sort.pipe';
import { SearchService } from './services/search.service';
import { HighchartsChartModule } from 'highcharts-angular';
import { ConfigurationComponent } from './configuration/configuration.component';
import { ApplensDocumentsSearchService } from './services/applens-documents-search.service';
import { DashboardContainerComponent } from './dashboard-container/dashboard-container.component';
import { L2SideNavComponent } from './l2-side-nav/l2-side-nav.component';
import { ApplensCommandBarService } from './services/applens-command-bar.service';
import { ApplensGlobal as ApplensGlobals } from '../../applens-global';
import { ResourceError, ResourceInfo } from '../../shared/models/resources';
import { catchError, map, mergeMap, take } from 'rxjs/operators';
import { RecentResource } from '../../shared/models/user-setting';
import { UserSettingService } from './services/user-setting.service';
import { ApplensDocsComponent } from './applens-docs/applens-docs.component';
import { TabKey } from './tabs/tab-key';
import { UserActivePullrequestsComponent } from './user-active-pullrequests/user-active-pullrequests.component';
import { BreadcrumbService } from './services/breadcrumb.service';
import { FavoriteDetectorsComponent } from './favoite-detectors/favorite-detectors.component';
import { ApplensDocSectionComponent } from './applens-doc-section/applens-doc-section.component';
import { DevelopNavigationGuardService } from './develop-navigation-guard.service';
import { FabSpinnerModule } from '@angular-react/fabric/lib/components/spinner';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabCommandBarModule } from '@angular-react/fabric/lib/components/command-bar';
import { FabIconModule } from '@angular-react/fabric/lib/components/icon';
import { FabTextFieldModule } from '@angular-react/fabric/lib/components/text-field';
import { FabSearchBoxModule } from '@angular-react/fabric/lib/components/search-box';
import { FabDetailsListModule } from '@angular-react/fabric/lib/components/details-list';
import { FabDialogModule } from '@angular-react/fabric/lib/components/dialog';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabCalloutModule } from '@angular-react/fabric/lib/components/callout';
import { FabCheckboxModule } from '@angular-react/fabric/lib/components/checkbox';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';
import { FabPivotModule } from '@angular-react/fabric/lib/components/pivot';
import { FabDatePickerModule } from '@angular-react/fabric/lib/components/date-picker';
import { FabCalendarModule } from '@angular-react/fabric/lib/components/calendar';
import { FabDropdownModule } from '@angular-react/fabric/lib/components/dropdown';
import { FabBreadcrumbModule } from '@angular-react/fabric/lib/components/breadcrumb';
import { FabMessageBarModule } from '@angular-react/fabric/lib/components/message-bar';
import { CreateWorkflowComponent } from './workflow/create-workflow/create-workflow.component';
import { NgFlowchartModule } from 'projects/ng-flowchart/dist';
import { GenericClientScriptService } from 'projects/diagnostic-data/src/lib/services/generic-client-script.service';
import { ClientScriptService } from './services/client-script.service';
import { UpdateDetectorReferencesComponent } from './update-detector-references/update-detector-references.component';
import { ApplensDocumentationService } from './services/applens-documentation.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AngularMarkdownEditorModule } from 'angular-markdown-editor';
import { WorkflowService } from './workflow/services/workflow.service';
import { IfElseConditionStepComponent } from './workflow/ifelse-condition-step/ifelse-condition-step.component';
import { ConditionIftrueStepComponent } from './workflow/condition-iftrue-step/condition-iftrue-step.component';
import { ConditionIffalseStepComponent } from './workflow/condition-iffalse-step/condition-iffalse-step.component';
import { SwitchStepComponent } from './workflow/switch-step/switch-step.component';
import { SwitchCaseStepComponent } from './workflow/switch-case-step/switch-case-step.component';
import { NodeActionsComponent } from './workflow/node-actions/node-actions.component';
import { MarkdownNodeComponent } from './workflow/markdown-node/markdown-node.component';
import { KustoNodeComponent } from './workflow/kusto-node/kusto-node.component';
import { DetectorNodeComponent } from './workflow/detector-node/detector-node.component';
import { KustoQueryDialogComponent } from './workflow/kusto-query-dialog/kusto-query-dialog.component';
import { NodeTitleComponent } from './workflow/node-title/node-title.component';
import { ErrorMessageComponent } from './workflow/error-message/error-message.component';
import { SwitchCaseDefaultStepComponent } from './workflow/switch-case-default-step/switch-case-default-step.component';
import { CommonNodePropertiesComponent } from './workflow/common-node-properties/common-node-properties.component';
import { ConfigureVariablesComponent } from './workflow/configure-variables/configure-variables.component';
import { MarkdownQueryDialogComponent } from './workflow/markdown-query-dialog/markdown-query-dialog.component';
import { WorkflowComponent } from './workflow/workflow/workflow.component';
import { WorkflowRunDialogComponent } from './workflow/workflow-run-dialog/workflow-run-dialog.component';
import { WorkflowRootNodeComponent } from './workflow/workflow-root-node/workflow-root-node.component';
import { ApplensOpenAIChatService } from '../../shared/services/applens-openai-chat.service';
import { GenericOpenAIChatService } from '../../../../../diagnostic-data/src/public_api';
import { OpenAIArmService } from '../../../../../diagnostic-data/src/public_api';
import { ChatUIContextService } from 'diagnostic-data';
import { DevopsDeploymentsComponent } from './devops-deployments/devops-deployments.component';
import { ForeachNodeComponent } from './workflow/foreach-node/foreach-node.component';
import { WorkflowUserAccessComponent } from './workflow/workflow-user-access/workflow-user-access.component';
import { InputNodeComponent } from './workflow/input-node/input-node.component';
import { NetworkTraceAnalysisComponent } from './network-trace-analysis/network-trace-analysis.component';
import { KustoGPTComponent } from './kustogpt/kustogpt.component';
import * as moment from 'moment';
import { ApplensOpenAIChatComponent } from './applens-openai-chat/applens-openai-chat.component';
import { CommunicationToolkitComponent } from './communication-toolkit/communication-toolkit.component';
import { DetectorCopilotService } from 'projects/applens/src/app/modules/dashboard/services/detector-copilot.service';
import { ApplensDocsCopilotComponent } from './applens-docs-copilot/applens-docs-copilot.component';

@Injectable()
export class InitResolver implements Resolve<Observable<ResourceInfo>>{
    constructor(private _resourceService: ResourceService, private _detectorControlService: DetectorControlService, private _userSettingService: UserSettingService, private _router: Router) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ResourceInfo> {
        const startTime = route.queryParams['startTime'];
        const endTime = route.queryParams['endTime'];
        this._detectorControlService.setCustomStartEnd(startTime, endTime);
        this._detectorControlService.updateTimePickerInfo({
            selectedKey: TimePickerOptions.Custom,
            selectedText: TimePickerOptions.Custom,
            startMoment: moment.utc(this._detectorControlService.startTimeString),
            endMoment: moment.utc(this._detectorControlService.endTimeString)
        });

        //Wait for getting UserSetting and update landingPage info before going to dashboard/detector page
        let recentResource: RecentResource = null;
        return this._resourceService.waitForInitialization().pipe(catchError(err => {
            const resourceError: ResourceError = {
                error: JSON.stringify(err),
                resource: route.params["resourceName"]
            }
            this._router.navigate(["resourceError"], { state: { resourceError } });
            throw err;
        }), map(resourceInfo => {
            const queryParams = this._userSettingService.excludeQueryParams(route.queryParams);
            recentResource = {
                resourceUri: resourceInfo.resourceUri,
                kind: resourceInfo.kind,
                queryParams: queryParams
            };
            return resourceInfo;
        }), mergeMap(resourceInfo => {
            return this._userSettingService.getUserSetting().pipe(take(1), catchError(_ => of(null)), map(_ => resourceInfo));
        }), mergeMap(resourceInfo => {
            return this._userSettingService.updateLandingInfo(recentResource).pipe(catchError(_ => of(null)), map(_ => resourceInfo));
        }));
    }
}

export const DashboardModuleRoutes: ModuleWithProviders<DashboardModule> = RouterModule.forChild([
    {
        path: '',
        component: DashboardComponent,
        resolve: { info: InitResolver },
        children: [
            {
                path: '',
                component: DashboardContainerComponent
            },
            {
                path: 'overview',
                redirectTo: '',
                pathMatch: 'full'
            },
            {
                path: 'chatgpt',
                pathMatch: 'full'
            },
            {
                path: 'home/:viewType',
                redirectTo: '',
                pathMatch: 'full'
            },
            {
                path: 'users/:userId',
                children: [
                    {
                        path: 'detectors',
                        component: UserDetectorsComponent,
                        data: {
                            isDetector: true,
                            allItems: false
                        }
                    },
                    {
                        path: 'gists',
                        component: UserDetectorsComponent,
                        data: {
                            isDetector: false,
                            allItems: false
                        }
                    }
                ]
            },
            {
                path: 'supportTopics/:supportTopic',
                component: SupportTopicPageComponent,
            },
            {
                path: 'pesId/:pesId/supportTopics/:supportTopicId',
                component: SelfHelpContentComponent,
            },
            {
                path: 'create',
                component: OnboardingFlowComponent,
                canDeactivate: [DevelopNavigationGuardService]
            },
            {
                path: 'createGist',
                component: GistComponent,
                canDeactivate: [DevelopNavigationGuardService]
            },
            {
                path: 'createWorkflow',
                component: WorkflowComponent,
                canDeactivate: [DevelopNavigationGuardService]
            },
            {
                path: 'addworkflowuser',
                component: WorkflowUserAccessComponent
            },
            {
                path: 'solutionOrchestrator',
                component: SolutionOrchestratorComponent
            },
            {
                path: 'docs/:category/:doc',
                component: ApplensDocsComponent
            },
            {
                path: 'gists/:gist',
                component: TabGistCommonComponent,
                children: [
                    {
                        path: '',
                        component: TabGistDevelopComponent,
                        canDeactivate: [DevelopNavigationGuardService],
                        data: {
                            tabKey: TabKey.Develop
                        }
                    }, {
                        path: 'edit',
                        redirectTo: '',
                        canDeactivate: [DevelopNavigationGuardService]
                    }, {
                        path: 'changelist',
                        component: TabChangelistComponent,
                        data: {
                            tabKey: TabKey.CommitHistory
                        }
                    }, {
                        path: 'changelist/:sha',
                        component: TabChangelistComponent,
                        data: {
                            tabKey: TabKey.CommitHistory
                        }
                    }
                ]
            },
            {
                path: 'analysis/:analysisId/popout/:detector',
                component: TabCommonComponent,
                children: [
                    {
                        path: '',
                        component: TabDataComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'data',
                        redirectTo: ''
                    },
                    {
                        path: 'edit',
                        component: TabDevelopComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'changelist',
                        component: TabChangelistComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'datasource',
                        component: TabDataSourcesComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'monitoring',
                        component: TabMonitoringComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'analytics',
                        component: TabAnalyticsDashboardComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'monitoring/edit',
                        component: TabMonitoringDevelopComponent,
                        data: {
                            analysisMode: true
                        },
                    },
                    {
                        path: 'analytics/edit',
                        component: TabAnalyticsDevelopComponent,
                        data: {
                            analysisMode: true
                        },
                    }
                ]
            },
            {
                path: 'alldetectors',
                component: UserDetectorsComponent,
                data: {
                    isDetector: true,
                    allItems: true
                }
            },
            {
                path: 'detectors/:detector',
                component: TabCommonComponent,
                data: {
                    cacheComponent: true
                },
                children: [
                    {
                        path: '',
                        component: TabDataComponent,
                        data: {
                            tabKey: TabKey.Data
                        }
                    },
                    {
                        path: 'data',
                        redirectTo: ''
                    },
                    {
                        path: 'edit',
                        component: TabDevelopComponent,
                        canDeactivate: [DevelopNavigationGuardService],
                        data: {
                            tabKey: TabKey.Develop
                        }
                    }, {
                        path: 'changelist',
                        component: TabChangelistComponent,
                        data: {
                            tabKey: TabKey.CommitHistory
                        }
                    },
                    {
                        path: 'datasource',
                        component: TabDataSourcesComponent,
                        data: {
                            tabKey: TabKey.DataSources
                        }
                    },
                    {
                        path: 'monitoring',
                        component: TabMonitoringComponent,
                        data: {
                            tabKey: TabKey.Monitoring
                        }
                    },
                    {
                        path: 'analytics',
                        component: TabAnalyticsDashboardComponent,
                        data: {
                            tabKey: TabKey.Analytics
                        }
                    },
                    {
                        path: 'monitoring/edit',
                        component: TabMonitoringDevelopComponent
                    },
                    {
                        path: 'analytics/edit',
                        component: TabAnalyticsDevelopComponent
                    }
                ]
            },
            {
                path: 'analysis/:analysisId',
                component: TabAnalysisComponent,
                children: [
                    {
                        path: 'detectors/:detector',
                        component: TabDataComponent,
                        data: {
                            analysisMode: true
                        },
                        children: [
                            {
                                path: 'data',
                                redirectTo: ''
                            },
                            {
                                path: 'datasource',
                                component: TabDataSourcesComponent
                            }
                        ]
                    },
                    {
                        path: 'data',
                        redirectTo: ''
                    },
                    {
                        path: 'datasource',
                        component: TabDataSourcesComponent
                    }
                ]
            },
            {
                path: 'workflows/:workflowId',
                component: TabCommonComponent,
                data: {
                    cacheComponent: true,
                    isWorkflow: true
                },
                children: [
                    {
                        path: '',
                        component: TabDataComponent,
                        data: {
                            tabKey: TabKey.Data
                        }
                    },
                    {
                        path: 'data',
                        redirectTo: ''
                    },
                    {
                        path: 'edit',
                        component: TabDevelopComponent,
                        canDeactivate: [DevelopNavigationGuardService],
                        data: {
                            tabKey: TabKey.Develop
                        }
                    }
                ]
            },
            {
                path: 'search',
                component: SearchResultsComponent
            },
            {
                path: 'kustoConfig',
                component: ConfigurationComponent
            },
            {
                path: 'deployments',
                component: DevopsDeploymentsComponent
            },
            {
                path: 'networkTraceAnalysis',
                component: NetworkTraceAnalysisComponent
            },
            {
                path: 'kustoQueryGenerator',
                component: KustoGPTComponent
            },
            { 
                path: 'communicationToolkit',
                component: CommunicationToolkitComponent
            },
            {
                path: 'askApplens',
                component: ApplensDocsCopilotComponent
            }
        ]
    },

]);

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DashboardModuleRoutes,
        DiagnosticDataModule,
        SharedModule,
        MonacoEditorModule.forRoot(),
        AngularSplitModule,
        CollapsibleMenuModule,
        NgxSmartModalModule.forRoot(),
        NgSelectModule,
        MarkdownModule.forRoot({
            sanitize: SecurityContext.STYLE
        }),
        HighchartsChartModule,
        FabSpinnerModule,
        FabPanelModule,
        FabCommandBarModule,
        FabIconModule,
        FabTextFieldModule,
        FabSearchBoxModule,
        FabDetailsListModule,
        DiagnosticDataModule,
        FabDialogModule,
        FabButtonModule,
        FabCalloutModule,
        FabCheckboxModule,
        FabChoiceGroupModule,
        FabPivotModule,
        FabDatePickerModule,
        FabCalendarModule,
        FabDropdownModule,
        FabBreadcrumbModule,
        FabMessageBarModule,
        NgFlowchartModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        MatButtonModule,
        MatExpansionModule,
        MatCardModule,
        MatDividerModule,
        MatSelectModule,
        MatMenuModule,
        MatButtonToggleModule,
        MatTableModule,
        MatAutocompleteModule,
        AngularMarkdownEditorModule.forRoot({
            // add any Global Options/Config you might want
            // to avoid passing the same options over and over in each components of your App
            iconlibrary: 'glyph'
        }),
        MonacoEditorModule.forRoot() // use forRoot() in main app module only.
    ],
    providers: [
        ApplensDiagnosticService,
        SearchService,
        ApplensCommsService,
        ApplensSupportTopicService,
        ApplensContentService,
        ApplensCommandBarService,
        ApplensDocumentationService,
        InitResolver,
        ApplensGlobals,
        ApplensOpenAIChatService,
        ChatUIContextService,
        OpenAIArmService,
        BreadcrumbService,
        ClientScriptService,
        WorkflowService,
        DetectorCopilotService,
        {
            provide: ResourceService,
            useFactory: ResourceServiceFactory,
            deps: [StartupService, ObserverService, DiagnosticApiService, DetectorControlService]
        },
        { provide: DiagnosticService, useExisting: ApplensDiagnosticService },
        { provide: GenericSupportTopicService, useExisting: ApplensSupportTopicService },
        { provide: GenericContentService, useExisting: ApplensContentService },
        { provide: GenericDocumentsSearchService, useExisting: ApplensDocumentsSearchService },
        { provide: CommsService, useExisting: ApplensCommsService },
        { provide: DiagnosticSiteService, useExisting: ResourceService },
        { provide: GenericResourceService, useExisting: ResourceService },
        { provide: SolutionService, useExisting: GenericSolutionService },
        { provide: GenieGlobals, useExisting: ApplensGlobals },
        { provide: GenericBreadcrumbService, useExisting: BreadcrumbService },
        { provide: GenericUserSettingService, useExisting: UserSettingService },
        { provide: GenericClientScriptService, useExisting: ClientScriptService },
        { provide: GenericOpenAIChatService, useExisting: ApplensOpenAIChatService }
    ],
    declarations: [DashboardComponent, SideNavComponent, ResourceMenuItemComponent, ResourceHomeComponent, OnboardingFlowComponent, DetectorCopilotComponent, SearchTermAdditionComponent,
        SearchMenuPipe, TabDataComponent, TabDevelopComponent, TabCommonComponent, TabDataSourcesComponent, TabMonitoringComponent,
        TabMonitoringDevelopComponent, TabAnalyticsDevelopComponent, TabAnalyticsDashboardComponent, GistComponent, TabGistCommonComponent,
        TabGistDevelopComponent, TabChangelistComponent, GistChangelistComponent, TabAnalysisComponent, CategoryPageComponent, SupportTopicPageComponent,
        SelfHelpContentComponent, UserDetectorsComponent, FormatResourceNamePipe, Sort, SearchResultsComponent, ConfigurationComponent, DashboardContainerComponent,
        L2SideNavComponent, UserActivePullrequestsComponent, FavoriteDetectorsComponent, ApplensDocsComponent, ApplensDocSectionComponent, CreateWorkflowComponent,
        IfElseConditionStepComponent, ConditionIftrueStepComponent, ConditionIffalseStepComponent, SwitchStepComponent, SwitchCaseStepComponent, SwitchCaseDefaultStepComponent,
        KustoQueryDialogComponent, DetectorNodeComponent, KustoNodeComponent, MarkdownNodeComponent, NodeActionsComponent, ConfigureVariablesComponent, CommonNodePropertiesComponent,
        NodeTitleComponent, ErrorMessageComponent, MarkdownQueryDialogComponent, WorkflowComponent, WorkflowRunDialogComponent, UpdateDetectorReferencesComponent, WorkflowRootNodeComponent,
        WorkflowUserAccessComponent, ForeachNodeComponent, DevopsDeploymentsComponent, InputNodeComponent, NetworkTraceAnalysisComponent,
        ApplensOpenAIChatComponent, KustoGPTComponent, CommunicationToolkitComponent, ApplensDocsCopilotComponent]
})
export class DashboardModule { }
