import { Injectable } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { DetectorType, DiagnosticService, TelemetryService } from 'diagnostic-data';
import { ContentService } from '../../../shared-v2/services/content.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../startup/services/auth.service';
import { Feature } from '../../../shared-v2/models/features';
import { AppType, SupportBladeDefinitions } from '../../../shared/models/portal';
import { OperatingSystem, Site, HostingEnvironmentKind } from '../../../shared/models/site';
import { SiteFilteredItem } from '../models/site-filter';
import { Sku } from '../../../shared/models/server-farm';
import { ToolNames, ToolIds } from '../../../shared/models/tools-constants';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { WebSitesService } from './web-sites.service';
import { WebSiteFilter } from '../pipes/site-filter.pipe';
import { SiteService } from '../../../shared/services/site.service';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { VersionTestService } from '../../../fabric-ui/version-test.service';
import { ArmService } from '../../../shared/services/arm.service';
import { SubscriptionPropertiesService } from '../../../shared/services/subscription-properties.service';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { HttpResponse } from '@angular/common/http';

@Injectable()
export class SiteFeatureService extends FeatureService {

  public diagnosticTools: SiteFilteredItem<Feature>[];
  public proactiveTools: SiteFilteredItem<Feature>[];
  public supportTools: SiteFilteredItem<Feature>[];
  constructor(protected _diagnosticApiService: DiagnosticService, protected _resourceService: WebSitesService, protected _contentService: ContentService, protected _router: Router,
    protected _authService: AuthService, protected _portalActionService: PortalActionService, private _websiteFilter: WebSiteFilter, protected _logger: TelemetryService, protected armService: ArmService,
    protected subscriptionPropertiesService: SubscriptionPropertiesService, protected _siteService: SiteService, protected _categoryService: CategoryService, protected _activedRoute: ActivatedRoute, protected _versionTestService: VersionTestService) {

    super(_diagnosticApiService, _contentService, _router, _authService, _logger, _siteService, _categoryService, _activedRoute, _portalActionService, _versionTestService);
    this._featureDisplayOrder = [{
      category: "Availability and Performance",
      platform: OperatingSystem.windows,
      appType: AppType.WebApp,
      order: ['appdownanalysis', 'perfanalysis', 'webappcpu', 'memoryusage', 'webapprestart']
    }];
    this._authService.getStartupInfo().subscribe(startupInfo => {
      this.addDiagnosticTools(startupInfo.resourceId);
      this.addProactiveTools(startupInfo.resourceId);
    });
  }

  sortFeatures() {
    this._featureDisplayOrderSub.pipe(mergeMap(featureOrder => {
      return this._authService.getStartupInfo().pipe(map(startupInfo => {
        const subscriptionId = startupInfo.resourceId.split("subscriptions/")[1].split("/")[0];
        return { "subscriptionId": subscriptionId, "featureOrder": featureOrder };
      }));
    })).subscribe(res => {
      this._sortFeaturesHelper(res.featureOrder, res.subscriptionId);
    });
  }

  private _sortFeaturesHelper(displayOrder: any[], subscriptionId: string) {
    let featureDisplayOrder = displayOrder;
    let locationPlacementId = '';
    if (this.subscriptionPropertiesService && subscriptionId) {
      this.subscriptionPropertiesService.getSubscriptionProperties(subscriptionId).pipe(catchError(error => of({}))).subscribe(response => {
        locationPlacementId = (<HttpResponse<any>>response)?.body['subscriptionPolicies']['locationPlacementId'];

        // remove features not applicable
        if (locationPlacementId && locationPlacementId.toLowerCase() === 'geos_2020-01-01') {
          this._features = this._features.filter(x => {
            return x.id !== 'appchanges';
          })
        }

        featureDisplayOrder.forEach(displayOrder => {

          if (displayOrder.platform === this._resourceService.platform && this._resourceService.appType === displayOrder.appType) {
            // Add all the features for this category to a temporary array
            let categoryFeatures: Feature[] = [];
            this._features.forEach(x => {
              if (x.category != null && x.category.indexOf(displayOrder.category) > -1) {
                categoryFeatures.push(x);
              }
            });

            // Remove all the features for the sorted category
            this._features = this._features.filter(x => {
              return x.category !== displayOrder.category;
            });


            const categoryOrder = featureDisplayOrder.find(x => x.category.toLowerCase().startsWith(displayOrder.category.toLowerCase()));
            let preOrderedFeatures: Feature[] = [];
            let unOrderedFeatures: Feature[] = [];

            //Follow order array in _featureDisplayOrder.order for preordered features
            if (categoryOrder && categoryOrder.order.length > 0) {
              categoryOrder.order.forEach((id: string) => {
                const index = categoryFeatures.findIndex(f => f.id.toLowerCase() === id.toLowerCase());
                if (index > -1) {
                  preOrderedFeatures.push(categoryFeatures[index]);
                }
              });
            }

            unOrderedFeatures = categoryFeatures.filter(feature => preOrderedFeatures.findIndex(preFeature => preFeature.id === feature.id) === -1);

            this.sortFeaturesBase(unOrderedFeatures);

            // add the sorted features for this category back to the array, with pre-ordered then rest features
            this._features = this._features.concat([...preOrderedFeatures, ...unOrderedFeatures]);
          }
        });

        //For resource have no pre-defined order
        if (featureDisplayOrder.findIndex(d => d.platform === this._resourceService.platform && this._resourceService.appType === d.appType) === -1) {
          this.sortFeaturesBase(this._features);
        }

      });
    }

  }


  addProactiveTools(resourceId: string) {
    this.proactiveTools = [
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows | OperatingSystem.linux | OperatingSystem.HyperV,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.AutoHealing,
          name: ToolNames.AutoHealing,
          category: 'Proactive Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.AutoHealing, 'Proactive Tools', () => {
            // this.navigateTo(resourceId,ToolIds.AutoHealing);
            // this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/mitigate`);

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/mitigate`);
            } else {
              this.navigateToTool(resourceId, ToolIds.AutoHealing);
            }
          })
        }
      }, {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.CpuMonitoring,
          name: ToolNames.CpuMonitoring,
          category: 'Proactive Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.CpuMonitoring, 'Proactive Tools', () => {
            // this.navigateTo(resourceId,ToolIds.CpuMonitoring);
            // this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/cpumonitoring`);

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/cpumonitoring`);
            } else {
              this.navigateToTool(resourceId, ToolIds.CpuMonitoring);
            }
          })
        }
      }, {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.CrashMonitoring,
          name: ToolNames.CrashMonitoring,
          category: 'Proactive Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.CrashMonitoring, 'Proactive Tools', () => {

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/crashmonitoring`);
            } else {
              this.navigateToTool(resourceId, ToolIds.CrashMonitoring);
            }
          })
        }
      }
    ];

    this._websiteFilter.transform(this.proactiveTools).forEach(tool => {
      this._features.push(tool);
    });
  }
  addDiagnosticTools(resourceId: string) {
    this.diagnosticTools = [
      {
        appType: AppType.WebApp | AppType.FunctionApp | AppType.WorkflowApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET',
        item: {
          id: ToolIds.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
            } else {
              this.navigateToTool(resourceId, ToolIds.Profiler);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp | AppType.WorkflowApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET Core',
        item: {
          id: ToolIds.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
            } else {
              this.navigateToTool(resourceId, ToolIds.Profiler);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp | AppType.WorkflowApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.MemoryDump,
          name: ToolNames.MemoryDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.MemoryDump, 'Diagnostic Tools', () => {
            //Need remove after A/B tes
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/memorydump`);
            } else {
              this.navigateToTool(resourceId, ToolIds.MemoryDump);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.DatabaseTester,
          name: ToolNames.DatabaseTester,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.DatabaseTester, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/databasetester`);
            } else {
              this.navigateToTool(resourceId, ToolIds.DatabaseTester);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp | AppType.WorkflowApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.NetworkTrace,
          name: ToolNames.NetworkTrace,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.NetworkTrace, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/networktrace`);
            } else {
              this.navigateToTool(resourceId, ToolIds.NetworkTrace);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'Java',
        item: {
          id: ToolIds.JavaMemoryDump,
          name: ToolNames.JavaMemoryDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.JavaMemoryDump, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javamemorydump`);
            } else {
              this.navigateToTool(resourceId, ToolIds.JavaMemoryDump);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'Java',
        item: {
          id: ToolIds.JavaThreadDump,
          name: ToolNames.JavaThreadDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.JavaThreadDump, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javathreaddump`);
            } else {
              this.navigateToTool(resourceId, ToolIds.JavaThreadDump);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'Java',
        item: {
          id: ToolIds.JavaFlightRecorder,
          name: ToolNames.JavaFlightRecorder,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.JavaFlightRecorder, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javaflightrecorder`);
            } else {
              this.navigateToTool(resourceId, ToolIds.JavaFlightRecorder);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.any,
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.NetworkChecks,
          name: ToolNames.NetworkChecks,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.NetworkChecks, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/networkchecks`);
            } else {
              this.navigateToTool(resourceId, ToolIds.NetworkChecks);
            }
          })
        }
      },
      {
        appType: AppType.WorkflowApp,
        platform: OperatingSystem.any,
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.NetworkChecks,
          name: ToolNames.NetworkChecks,
          category: 'Networking',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.NetworkChecks, 'Networking', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/networkchecks`);
            } else {
              this.navigateToTool(resourceId, ToolIds.NetworkChecks, "Networking");
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.linux,
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.AdvancedAppRestart,
          name: ToolNames.AdvancedAppRestart,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction('AdvancedAppRestart', 'Support Tools', () => {
            this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
          })
        }
      }
    ];

    this.supportTools = [
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows | OperatingSystem.HyperV,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.MetricPerInstance.Identifier,
          name: ToolNames.MetricPerInstanceApp,
          category: 'Support Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.MetricPerInstance.Identifier, 'Support Tools', () => {
            this._portalActionService.openMdmMetricsV3Blade();
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows | OperatingSystem.HyperV,
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.AppServicePlanMetrics.Identifier,
          name: ToolNames.AppServicePlanMetrics,
          category: 'Support Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.AppServicePlanMetrics.Identifier, 'Support Tools', () => {
            this._portalActionService.openMdmMetricsV3Blade(this._resourceService.resource.properties.serverFarmId);
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.EventViewer.Identifier,
          name: ToolNames.EventViewer,
          category: 'Support Tools',
          description: 'View event logs(containing exceptions, errors etc) generated by your application.',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.EventViewer.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/eventviewer`);
            } else {
              this.navigateToTool(resourceId, ToolIds.EventViewer);
            }
          })
        }
      },
      {
        appType: AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.EventViewer.Identifier,
          name: ToolNames.EventViewer,
          category: 'Support Tools',
          description: 'View event logs(containing exceptions, errors etc) generated by your function app.',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.EventViewer.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/eventviewer`);
            } else {
              this.navigateToTool(resourceId, ToolIds.EventViewer);
            }
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.FREBLogs.Identifier,
          name: ToolNames.FrebViewer,
          category: 'Support Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.FREBLogs.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/frebviewer`);
            } else {
              this.navigateToTool(resourceId, ToolIds.FrebViewer);
            }
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows | OperatingSystem.HyperV,   // For Linux, there is no category called Support Tools. So this tool is part of Diagnostics Tools section
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.AdvancedAppRestart,
          name: ToolNames.AdvancedAppRestart,
          category: 'Support Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction('AdvancedAppRestart', 'Support Tools', () => {
            this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
          })
        }
      }
    ];

    this._websiteFilter.transform(this.diagnosticTools).forEach(tool => {
      this._features.push(tool);
    });

    this._websiteFilter.transform(this.supportTools).forEach(tool => {
      this._features.push(tool);
    });
  }
}
