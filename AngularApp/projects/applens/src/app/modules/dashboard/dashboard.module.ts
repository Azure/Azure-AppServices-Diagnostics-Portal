import { NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardComponent, FormatResourceNamePipe } from './dashboard/dashboard.component';
import { SharedModule } from '../../shared/shared.module';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { RouterModule, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
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
import { TabCommonComponent } from './tabs/tab-common/tab-common.component';
import { TabDataComponent } from './tabs/tab-data/tab-data.component';
import { TabDevelopComponent } from './tabs/tab-develop/tab-develop.component';
import { ApplensDiagnosticService } from './services/applens-diagnostic.service';
import { ApplensCommsService } from './services/applens-comms.service';
import { ApplensSupportTopicService } from './services/applens-support-topic.service';
import { ApplensContentService } from './services/applens-content.service';
import { DiagnosticService, DiagnosticDataModule, CommsService, DetectorControlService, GenericSupportTopicService, GenericContentService, GenericDocumentsSearchService, GenieGlobals, SolutionOrchestratorComponent, TimePickerOptions, GenericBreadcrumbService, GenericUserSettingService } from 'diagnostic-data';
import { FabBreadcrumbModule, FabButtonModule, FabCalendarComponent, FabCalendarModule, FabCalloutModule, FabCheckboxModule, FabChoiceGroupModule, FabCommandBarModule, FabDatePickerModule, FabDetailsListModule, FabDialogModule, FabDropdownModule, FabIconModule, FabPanelModule, FabPivotModule, FabSearchBoxModule, FabTextFieldModule, FabSpinnerModule, FabMessageBarModule } from '@angular-react/fabric';
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
import { AvatarModule } from 'ngx-avatar';
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
import { ResourceInfo } from '../../shared/models/resources';
import { catchError, flatMap, map, take } from 'rxjs/operators';
import { RecentResource } from '../../shared/models/user-setting';
import { UserSettingService } from './services/user-setting.service';
import { ApplensDocsComponent } from '../../shared/components/applens-docs/applens-docs.component';
import { TabKey } from './tabs/tab-key';
import { UserActivePullrequestsComponent } from './user-active-pullrequests/user-active-pullrequests.component';
import { BreadcrumbService } from './services/breadcrumb.service';
import { FavoriteDetectorsComponent } from './favoite-detectors/favorite-detectors.component';

@Injectable()
export class InitResolver implements Resolve<Observable<ResourceInfo>>{
    constructor(private _resourceService: ResourceService, private _detectorControlService: DetectorControlService, private _userSettingService: UserSettingService) { }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ResourceInfo> {
        const startTime = route.queryParams['startTime'];
        const endTime = route.queryParams['endTime'];
        this._detectorControlService.setCustomStartEnd(startTime, endTime);
        this._detectorControlService.updateTimePickerInfo({
            selectedKey: TimePickerOptions.Custom,
            selectedText: TimePickerOptions.Custom,
            startDate: new Date(startTime),
            endDate: new Date(endTime)
        });

        //Wait for getting UserSetting and update landingPage info before going to dashboard/detector page
        let recentResource: RecentResource = null;
        return this._resourceService.waitForInitialization().pipe(map(resourceInfo => {
            const queryParams = route.queryParams;
            recentResource = {
                resourceUri: resourceInfo.resourceUri,
                kind: resourceInfo.kind,
                queryParams: queryParams
            };
            return resourceInfo;
        }), flatMap(resourceInfo => {
            return this._userSettingService.getUserSetting().pipe(take(1),catchError(_ => of(null)), map(_ => resourceInfo));
        }), flatMap(resourceInfo => {
            return this._userSettingService.updateLandingInfo(recentResource).pipe(catchError(_ => of(null)), map(_ => resourceInfo));
        }));
    }
}

export const DashboardModuleRoutes: ModuleWithProviders = RouterModule.forChild([
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
                path: 'home/:viewType',
                // component: ResourceHomeComponent,
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
            // {
            //     path: 'categories/:category',
            //     component: CategoryPageComponent,
            // },
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
                component: OnboardingFlowComponent
            },
            {
                path: 'createGist',
                component: GistComponent
            },
            {
                path: 'solutionOrchestrator',
                component: SolutionOrchestratorComponent
            },
            {
                path: 'docs',
                component: ApplensDocsComponent
            },
            {
                path: 'gists/:gist',
                component: TabGistCommonComponent,
                children: [
                    {
                        path: '',
                        component: TabGistDevelopComponent,
                        data: {
                            tabKey: TabKey.Develop
                        }
                    }, {
                        path: 'edit',
                        redirectTo: ''
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
                path: 'search',
                component: SearchResultsComponent
            },
            {
                path: 'kustoConfig',
                component: ConfigurationComponent
            },
            {
                path: 'users/:userId/activepullrequests',
                component: UserActivePullrequestsComponent
            }
        ]
    },

]);

@NgModule({
    imports: [
        AvatarModule,
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
        MarkdownModule.forRoot(),
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
        FabMessageBarModule
    ],
    providers: [
        ApplensDiagnosticService,
        SearchService,
        ApplensCommsService,
        ApplensSupportTopicService,
        ApplensContentService,
        ApplensCommandBarService,
        InitResolver,
        ApplensGlobals,
        BreadcrumbService,
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
        { provide: GenericUserSettingService, useExisting: UserSettingService }
    ],
    declarations: [DashboardComponent, SideNavComponent, ResourceMenuItemComponent, ResourceHomeComponent, OnboardingFlowComponent, SearchTermAdditionComponent,
        SearchMenuPipe, TabDataComponent, TabDevelopComponent, TabCommonComponent, TabDataSourcesComponent, TabMonitoringComponent,
        TabMonitoringDevelopComponent, TabAnalyticsDevelopComponent, TabAnalyticsDashboardComponent, GistComponent, TabGistCommonComponent,
        TabGistDevelopComponent, TabChangelistComponent, GistChangelistComponent, TabAnalysisComponent, CategoryPageComponent, SupportTopicPageComponent,
        SelfHelpContentComponent, UserDetectorsComponent, FormatResourceNamePipe, Sort, SearchResultsComponent, ConfigurationComponent, DashboardContainerComponent, L2SideNavComponent, UserActivePullrequestsComponent, FavoriteDetectorsComponent]
})
export class DashboardModule { }
