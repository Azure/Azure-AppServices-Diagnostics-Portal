import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedV2Module } from '../../shared-v2/shared-v2.module';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { ResourceResolver } from '../../home/resolvers/resource.resolver';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../shared-v2/services/category.service';
import { ContentService } from '../../shared-v2/services/content.service';
import { FeatureService } from '../../shared-v2/services/feature.service';
import { LoggingV2Service } from '../../shared-v2/services/logging-v2.service';
import { SupportTopicService } from '../../shared-v2/services/support-topic.service';
import { CXPChatCallerService } from '../../shared-v2/services/cxp-chat-caller.service';

const ResourceRoutes = RouterModule.forChild([
  {
    path: '',
    loadChildren: () => import('../../home/home.module').then(m => m.HomeModule),
    resolve: { data: ResourceResolver }
  }
]);



@NgModule({
  imports: [
    CommonModule,
    SharedV2Module,
    ResourceRoutes
  ],
  declarations: [],
  providers: [
    // ContentService,
    FeatureService,
    LoggingV2Service,
    CXPChatCallerService,
    ResourceService,
    CategoryService,
    SupportTopicService,
    ResourceResolver
  ]
})
export class GenericArmResourcesModule { }
