import { WebSiteFilter } from './../pipes/site-filter.pipe';
import { Injectable } from '@angular/core';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { OperatingSystem, HostingEnvironmentKind } from '../../../shared/models/site';
import { AppType } from '../../../shared/models/portal';
import { SiteFilteredItem } from '../models/site-filter';
import { Sku } from '../../../shared/models/server-farm';
import { WebSitesService } from './web-sites.service';
import { ArmService } from '../../../shared/services/arm.service';

@Injectable()
export class SitesCategoryService extends CategoryService {

  private _sitesCategories: SiteFilteredItem<Category>[] = [
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.HyperV,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'AvailabilityAndPerformanceWindows',
        name: 'Availability and Performance',
        overviewDetectorId: 'AvailabilityAndPerformanceWindows',
        description: 'Check your app’s health and discover app or platform issues.',
        keywords: ['Downtime', '5xx', '4xx', 'CPU', 'Memory','SNAT'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: false,
        chatEnabled: false
      }
    },
    // Linux
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'LinuxAvailabilityAndPerformance',
        name: 'Availability and Performance',
        overviewDetectorId: 'LinuxAvailabilityAndPerformance',
        description: 'Is your app experiencing downtime or slowness? Discover issues that may impact SLA, caused by your app itself or Azure.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory','SNAT'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: false,
        chatEnabled: false
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.linux | OperatingSystem.HyperV,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'ConfigurationAndManagement',
        name: 'Configuration and Management',
        overviewDetectorId: 'ConfigurationAndManagement',
        description: 'Find out if your app service features are misconfigured.',
        keywords: ['Backups', 'Slots', 'Swaps', 'Scaling','IP Config'],
        color: 'rgb(249, 213, 180)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.HyperV,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'SSLandDomains',
        name: 'SSL and Domains',
        overviewDetectorId: 'SSLandDomains',
        description: 'Discover issues with certificates and custom domains.',
        keywords: ['4xx','Permissions','Auth','Binding','Cert Failures'],
        color: 'rgb(186, 211, 245)',
        createFlowForCategory: true,
        chatEnabled: true
      }
    },
    //Windows and Linux
    {
      appType: AppType.WebApp,
      platform: OperatingSystem.windows | OperatingSystem.linux | OperatingSystem.HyperV,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'RiskAssessments',
        name: 'Risk Assessments',
        overviewDetectorId: 'BestPractices',
        description: 'Analyze your app for optimal performance and configurations.',
        keywords: ['Autoscale','AlwaysOn','Density','ARR','Health Check'],
        color: 'rgb(208, 228, 176)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },
    // Workflow App
    {
        appType: AppType.WorkflowApp,
        platform: OperatingSystem.windows | OperatingSystem.linux,
        stack: '',
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
          id: 'AvailabilityAndPerformanceLogicApp',
          overviewDetectorId: 'appcrashesLA',
          name: 'Availability and Performance',
          description: 'Investigate performance issues or just check the health of your Logic App.',
          keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory', 'Slowness'],
          color: 'rgb(208, 175, 239)',
          createFlowForCategory: true,
          chatEnabled: false
        }
      },
      {
          appType: AppType.WorkflowApp,
          platform: OperatingSystem.windows,
          stack: '',
          sku: Sku.All,
          hostingEnvironmentKind: HostingEnvironmentKind.All,
          item: {
            id: 'SSLandDomainsLogicApp',
            name: 'SSL and Domains',
            overviewDetectorId:'SSLandDomains',
            description: 'Investigate issues with SSL and custom domains.',
            keywords: ['4xx Errors', 'SSL', 'Domains'],
            color: 'rgb(186, 211, 245)',
            createFlowForCategory: true,
            chatEnabled: true
          }
        },
      {
          appType: AppType.WorkflowApp,
          platform: OperatingSystem.windows | OperatingSystem.linux,
          stack: '',
          sku: Sku.All,
          hostingEnvironmentKind: HostingEnvironmentKind.All,
          item: {
            id: 'RunsAndTriggersLA',
            overviewDetectorId: 'la_pubgeneral_workflowapp',
            name: 'Runs and Triggers',
            description: 'Troubleshoot issues related to your run & triggers.',
            keywords: ['Runs', 'Triggers', 'Calls', 'Timeouts'],
            color: 'rgb(249, 213, 180)',
            createFlowForCategory: true,
            chatEnabled: false
          }
        },
        {
          appType: AppType.WorkflowApp,
          platform: OperatingSystem.windows,
          stack: '',
          sku: Sku.All,
          hostingEnvironmentKind: HostingEnvironmentKind.All,
          item: {
            id: 'NetworkingLA',
            name: 'Networking',
            overviewDetectorId: 'NetworkingLA',
            description: 'Troubleshoot common networking problems.',
            keywords: ['Networking', 'VNet'],
            color: 'rgb(208, 228, 176)',
            createFlowForCategory: true,
            chatEnabled: false
          }
        },
    // Function App
    {
      appType: AppType.FunctionApp,
      platform: OperatingSystem.windows | OperatingSystem.linux,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'AvailabilityAndPerformanceFunctionApp',
        overviewDetectorId: 'AvailabilityAndPerformanceFunctionApp',
        name: 'Availability and Performance',
        description: 'Investigate performance issues or just check the health of your Function App.',
        keywords: ['Downtime', '5xx Errors', '4xx Errors', 'CPU', 'Memory', 'Slowness'],
        color: 'rgb(208, 175, 239)',
        createFlowForCategory: true,
        chatEnabled: false
      }
    },
    {
        appType: AppType.FunctionApp,
        platform: OperatingSystem.windows | OperatingSystem.linux,
        stack: '',
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
          id: 'ConfigurationAndManagementFunctionApp',
          overviewDetectorId: 'functionsettings',
          name: 'Configuration and Management',
          description: 'Find out if you misconfigured Function App features/settings.',
          keywords: ['Scaling', 'Swaps', 'Failed Backups', 'IPs', 'Migration'],
          color: 'rgb(249, 213, 180)',
          createFlowForCategory: true,
          chatEnabled: false
        }
      },
      {
        appType: AppType.FunctionApp,
        platform: OperatingSystem.windows,
        stack: '',
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
          id: 'SSLandDomainsFunctionApp',
          name: 'SSL and Domains',
          overviewDetectorId:'SSLandDomainsFunctionApp',
          description: 'Investigate issues with certificates, authentication, and custom domains.',
          keywords: ['4xx Errors', 'SSL', 'Domains', 'Permissions', 'Auth', 'Cert'],
          color: 'rgb(186, 211, 245)',
          createFlowForCategory: true,
          chatEnabled: true
        }
      },
      {
        appType: AppType.FunctionApp,
        platform: OperatingSystem.windows,
        stack: '',
        sku: Sku.All,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
          id: 'RiskAssessmentsFunctionApp',
          name: 'Risk Assessments',
          overviewDetectorId: 'BestPracticesFunctionApp',
          description: 'Analyze your app for optimal performance and configuration.',
          keywords: ['BestPractices', 'AlwaysOn', 'Async Pattern', 'Deployment Settings'],
          color: 'rgb(208, 228, 176)',
          createFlowForCategory: true,
          chatEnabled: false
        }
      }
  ];

  constructor(private _resourceService: WebSitesService, private _websiteFilter: WebSiteFilter, private _armService: ArmService) {
    super();
    if(this._armService.isPublicAzure) {
      //Separate tile for Navigator for Windows Web App only when the site is on publicx Azure.
      this._sitesCategories.push(
        {
          appType: AppType.WebApp,
          platform: OperatingSystem.windows,
          stack: '',
          sku: Sku.All,
          hostingEnvironmentKind: HostingEnvironmentKind.All,
          item: {
              id: 'navigator',
              name: 'Navigator (Preview)',
              overviewDetectorId:'navigator',
              description: 'Track changes on your app and its dependencies.',
              keywords: ['Change Analysis', 'SQL', 'Dependency','Storage'],
              color: 'rgb(255, 217, 119)',
              createFlowForCategory: false,
              chatEnabled: false,
              overridePath: `resource${this._resourceService.resourceIdForRouting}/detectors/navigator`
          }
      }
      );
    }

 //   this._sitesCategories.push(this._getDiagnosticToolsCategory(this._resourceService.resourceIdForRouting));
    this._getDiagnosticToolsCategory(this._resourceService.resourceIdForRouting).forEach((diagnosticCategory) => {
        this._sitesCategories.push(diagnosticCategory);
    });

    this._addCategories(
      this._websiteFilter.transform(this._sitesCategories)
    );
  }

  private _getDiagnosticToolsCategory(siteId: string): SiteFilteredItem<Category>[] {
    return <SiteFilteredItem<Category>[]> [{
      appType: AppType.WebApp,
      platform: OperatingSystem.any,
      stack: '',
      sku: Sku.All,
      hostingEnvironmentKind: HostingEnvironmentKind.All,
      item: {
        id: 'DiagnosticTools',
        name: 'Diagnostic Tools',
        overviewDetectorId:'DiagnosticTools',
        description: 'Run proactive tools to automatically mitigate the app.',
        keywords: ['Auto-Heal'],
        color: 'rgb(170, 192, 208)',
        createFlowForCategory: false,
        overridePath: `resource${siteId}/diagnosticTools`
      }
    },
    {
        appType: AppType.FunctionApp,
        platform: OperatingSystem.linux,
        stack: '',
        sku: Sku.PaidDedicated,
        hostingEnvironmentKind: HostingEnvironmentKind.All,
        item: {
          id: 'DiagnosticTools',
          name: 'Diagnostic Tools',
          overviewDetectorId:'DiagnosticTools',
          description: 'Run proactive tools to automatically mitigate the app.',
          keywords: ['Auto-Heal'],
          color: 'rgb(170, 192, 208)',
          createFlowForCategory: false,
          overridePath: `resource${siteId}/diagnosticTools`
        }
      }];
  }

}
