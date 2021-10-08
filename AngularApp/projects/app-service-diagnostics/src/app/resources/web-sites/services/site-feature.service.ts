import { Injectable } from '@angular/core';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { DiagnosticService, TelemetryService } from 'diagnostic-data';
import { ContentService } from '../../../shared-v2/services/content.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../startup/services/auth.service';
import { Feature, FeatureTypes } from '../../../shared-v2/models/features';
import { AppType, SupportBladeDefinitions } from '../../../shared/models/portal';
import { OperatingSystem, Site, HostingEnvironmentKind } from '../../../shared/models/site';
import { SiteFilteredItem } from '../models/site-filter';
import { Sku } from '../../../shared/models/server-farm';
import { ToolNames, ToolIds } from '../../../shared/models/tools-constants';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { WebSitesService } from './web-sites.service';
import { WebSiteFilter } from '../pipes/site-filter.pipe';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { SiteService } from '../../../shared/services/site.service';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { VersionTestService } from '../../../fabric-ui/version-test.service';
import { ArmService } from '../../../shared/services/arm.service';
import { SubscriptionPropertiesService } from '../../../shared/services/subscription-properties.service';
import { DemoSubscriptions } from '../../../betaSubscriptions';

@Injectable()
export class SiteFeatureService extends FeatureService {

  public diagnosticTools: SiteFilteredItem<Feature>[];
  public proactiveTools: SiteFilteredItem<Feature>[];
  public supportTools: SiteFilteredItem<Feature>[];
  public subscriptionId: string;
  constructor(protected _diagnosticApiService: DiagnosticService, protected _resourceService: WebSitesService, protected _contentService: ContentService, protected _router: Router,
    protected _authService: AuthService, protected _portalActionService: PortalActionService, private _websiteFilter: WebSiteFilter, protected _logger: TelemetryService, protected armService: ArmService,
    protected subscriptionPropertiesService: SubscriptionPropertiesService, protected _siteService: SiteService, protected _categoryService: CategoryService, protected _activedRoute: ActivatedRoute, protected _versionTestService: VersionTestService) {

    super(_diagnosticApiService, _contentService, _router, _authService, _logger, _siteService, _categoryService, _activedRoute, _portalActionService, _versionTestService);
    this._featureDisplayOrder = [{
      category: "Availability and Performance",
      platform: OperatingSystem.windows,
      appType: AppType.WebApp,
      order: ['appdownanalysis', 'perfanalysis', 'webappcpu', 'memoryusage', 'webapprestart'].reverse()
    }];
    this._authService.getStartupInfo().subscribe(startupInfo => {
      this.subscriptionId = startupInfo.resourceId.split("subscriptions/")[1].split("/")[0];
      this.addDiagnosticTools(startupInfo.resourceId);
      this.addProactiveTools(startupInfo.resourceId);
    });
  }

  sortFeatures() {
    this._featureDisplayOrderSub.subscribe(featureOrder => {
      this._sortFeaturesHelper(featureOrder);
    });
  }

  private _sortFeaturesHelper(displayOrder:any[]) {
    let featureDisplayOrder = displayOrder;
    let locationPlacementId = '';
    if(this.subscriptionPropertiesService){
      this.subscriptionPropertiesService.getSubscriptionProperties(this.subscriptionId).subscribe(response => {
        locationPlacementId = response.body['subscriptionPolicies']['locationPlacementId'];
      });
    }
    // remove features not applicable
    if (locationPlacementId && locationPlacementId.toLowerCase() === 'geos_2020-01-01') {
      this._features = this._features.filter(x => {
        return x.id !== 'appchanges';
      })
    }

    featureDisplayOrder.forEach(feature => {

      if (feature.platform === this._resourceService.platform && this._resourceService.appType === feature.appType) {
        // Add all the features for this category to a temporary array
        let categoryFeatures: Feature[] = [];
        this._features.forEach(x => {
          if (x.category != null && x.category.indexOf(feature.category) > -1) {
            categoryFeatures.push(x);
          }
        });

        // Remove all the features for the sorted category
        this._features = this._features.filter(x => {
          return x.category !== feature.category;
        });

        // Sort all the features for this category
        categoryFeatures.sort(
          function (a, b) {
            let categoryOrder = featureDisplayOrder.find(x => x.category.toLowerCase().startsWith(feature.category.toLowerCase()));
            if (categoryOrder != null) {
              if (categoryOrder.order.indexOf(a.id.toLowerCase()) < categoryOrder.order.indexOf(b.id.toLowerCase())) {
                return 1;
              } else if (categoryOrder.order.indexOf(b.id.toLowerCase()) === categoryOrder.order.indexOf(a.id.toLowerCase())) {
                return 0;
              }
              else {
                return -1;
              }
            }
          }
        );

        // add the sorted features for this category back to the array
        this._features = this._features.concat(categoryFeatures);
      }
    });

  }


  getLegacyAvailabilityAndPerformanceFeatures(resourceId: string): Feature[] {
    resourceId = resourceId.startsWith('/') ? resourceId.replace('/', '') : resourceId;
    return <Feature[]>[
      {
        id: 'appanalysis',
        name: 'Web App Down',
        category: 'Availability and Performance',
        description: 'Analyze availability of web app',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('appanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/analysis`);
        })
      },
      {
        id: 'perfanalysis',
        name: 'Web App Slow',
        category: 'Availability and Performance',
        description: 'Analyze performance of web app',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('perfanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/performance/analysis`);
        })
      },
      {
        id: 'cpuanalysis',
        name: 'High CPU Usage',
        category: 'Availability and Performance',
        description: 'Analyze CPU Usage of your Web App on all instances and see breakdown of usage of all Web Apps on your server farm',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('cpuanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/detectors/sitecpuanalysis`);
        })
      },
      {
        id: 'memoryanalysis',
        name: 'High Memory Usage',
        category: 'Availability and Performance',
        description: 'Analyze Memory Usage of your Web App including physical memory, committed memory usage, and page file operations',
        featureType: FeatureTypes.Detector,
        clickAction: this._createFeatureAction('memoryanalysis', 'Availability and Performance', () => {
          this._router.navigateByUrl(`resource/${resourceId}/legacy/diagnostics/availability/memoryanalysis`);
        })
      }
    ];
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.AutoHealing, 'Proactive Tools', () => {
            // this.navigateTo(resourceId,ToolIds.AutoHealing);
            // this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/mitigate`);

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/mitigate`);
            } else {
              this.navigateTo(resourceId, ToolIds.AutoHealing);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.CpuMonitoring, 'Proactive Tools', () => {
            // this.navigateTo(resourceId,ToolIds.CpuMonitoring);
            // this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/cpumonitoring`);

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/cpumonitoring`);
            } else {
              this.navigateTo(resourceId, ToolIds.CpuMonitoring);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.CrashMonitoring, 'Proactive Tools', () => {

            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/crashmonitoring`);
            } else {
              this.navigateTo(resourceId, ToolIds.CrashMonitoring);
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
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET',
        item: {
          id: ToolIds.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
            } else {
              this.navigateTo(resourceId, ToolIds.Profiler);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.NotDynamic,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: 'ASP.NET Core',
        item: {
          id: ToolIds.Profiler,
          name: ToolNames.Profiler,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.Profiler, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/profiler`);
            } else {
              this.navigateTo(resourceId, ToolIds.Profiler);
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
          id: ToolIds.MemoryDump,
          name: ToolNames.MemoryDump,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.MemoryDump, 'Diagnostic Tools', () => {
            //Need remove after A/B tes
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/memorydump`);
            } else {
              this.navigateTo(resourceId, ToolIds.MemoryDump);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.DatabaseTester, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/databasetester`);
            } else {
              this.navigateTo(resourceId, ToolIds.DatabaseTester);
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
          id: ToolIds.NetworkTrace,
          name: ToolNames.NetworkTrace,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.NetworkTrace, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/networktrace`);
            } else {
              this.navigateTo(resourceId, ToolIds.NetworkTrace);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.JavaMemoryDump, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javamemorydump`);
            } else {
              this.navigateTo(resourceId, ToolIds.JavaMemoryDump);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.JavaThreadDump, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javathreaddump`);
            } else {
              this.navigateTo(resourceId, ToolIds.JavaThreadDump);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.JavaFlightRecorder, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/javaflightrecorder`);
            } else {
              this.navigateTo(resourceId, ToolIds.JavaFlightRecorder);
            }
          })
        }
      },
      {
        appType: AppType.WebApp | AppType.FunctionApp,
        platform: OperatingSystem.windows,
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: ToolIds.NetworkChecks,
          name: ToolNames.NetworkChecks,
          category: 'Diagnostic Tools',
          description: '',
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(ToolNames.NetworkChecks, 'Diagnostic Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/networkchecks`);
            } else {
              this.navigateTo(resourceId, ToolIds.NetworkChecks);
            }
          })
        }
      },
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.MetricPerInstance.Identifier, 'Support Tools', () => {
            this._portalActionService.openMdmMetricsV3Blade();
          })
        }
      },
      {
        appType: AppType.WebApp,
        platform: OperatingSystem.windows  | OperatingSystem.HyperV,
        sku: Sku.Paid,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        stack: '',
        item: {
          id: SupportBladeDefinitions.AppServicePlanMetrics.Identifier,
          name: ToolNames.AppServicePlanMetrics,
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.EventViewer.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/eventviewer`);
            } else {
              this.navigateTo(resourceId, ToolIds.EventViewer);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.EventViewer.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/eventviewer`);
            } else {
              this.navigateTo(resourceId, ToolIds.EventViewer);
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
          featureType: FeatureTypes.Tool,
          clickAction: this._createFeatureAction(SupportBladeDefinitions.FREBLogs.Identifier, 'Support Tools', () => {
            //Need remove after A/B test
            if (this.isLegacy) {
              this._router.navigateByUrl(`resource${resourceId}/tools/frebviewer`);
            } else {
              this.navigateTo(resourceId, ToolIds.FrebViewer);
            }
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
          id: ToolIds.AdvancedAppRestart,
          name: ToolNames.AdvancedAppRestart,
          category: 'Support Tools',
          description: '',
          featureType: FeatureTypes.Tool,
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

  private navigateTo(resourceId: string, toolId: string) {
    const isHomepage = this._router.url.endsWith(resourceId);
    //If in homepage then open second blade for Diagnostic Tool and second blade will continue to open third blade for
    if (isHomepage) {
      this._portalActionService.openBladeDiagnosticToolId(toolId);
    } else {
      this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/${toolId}`);
    }
  }
}
