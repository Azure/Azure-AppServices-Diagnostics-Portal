import { NgModule } from '@angular/core';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
import { SharedModule } from '../../shared/shared.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../shared-v2/services/category.service';
import { SitesCategoryService } from './services/sites-category.service';
import { SiteFeatureService } from './services/site-feature.service';
import { FeatureService } from '../../shared-v2/services/feature.service';
import { SupportTopicService } from '../../shared-v2/services/support-topic.service';
import { SiteSupportTopicService } from './services/site-support-topic.service';
import { WebSiteFilter } from './pipes/site-filter.pipe';
import { DiagnosticToolsComponent } from './components/diagnostic-tools/diagnostic-tools.component';
import { ContentService } from '../../shared-v2/services/content.service';
import { WebSitesService } from './services/web-sites.service';
import { LoggingV2Service } from '../../shared-v2/services/logging-v2.service';
import { CXPChatCallerService } from '../../shared-v2/services/cxp-chat-caller.service';
import { QuickLinkService } from '../../shared-v2/services/quick-link.service';
import { SiteQuickLinkService } from './services/site-quick-link.service';
import { RiskAlertService } from '../../shared-v2/services/risk-alert.service';
import { SiteRiskAlertService } from './services/site-risk-alert.service';
import { DiagnosticDataModule } from 'diagnostic-data';

const ResourceRoutes = RouterModule.forChild([
  {
    path: '',
    loadChildren: () => import('../../home/home.module').then(m => m.HomeModule),
    resolve: { data: ResourceResolver }
  },
  {
    path: 'diagnosticTools',
    component: DiagnosticToolsComponent,
    data: {
      navigationTitle: 'Diagnostic Tools',
      cacheComponent: true
    }
  },
  {
    path: 'legacy',
    loadChildren: () => import('../../availability/availability.module').then(m => m.AvailabilityModule)
  },
  {
    path: 'tools',
    loadChildren: () => import('../../diagnostic-tools/diagnostic-tools.module').then(m => m.DiagnosticToolsModule)
  }
]);

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    SharedV2Module,
    ResourceRoutes,
    DiagnosticDataModule
  ],
  declarations: [
    DiagnosticToolsComponent,
    WebSiteFilter
  ],
  providers: [
    ContentService,
    SiteFeatureService,
    LoggingV2Service,
    CXPChatCallerService,
    { provide: ResourceService, useExisting: WebSitesService },
    { provide: CategoryService, useClass: SitesCategoryService },
    { provide: FeatureService, useExisting: SiteFeatureService },
    { provide: SupportTopicService, useClass: SiteSupportTopicService },
    ResourceResolver,
    WebSiteFilter,
    { provide: QuickLinkService, useExisting: SiteQuickLinkService },
    { provide: RiskAlertService, useExisting: SiteRiskAlertService }
  ]
})
export class WebSitesModule { }
