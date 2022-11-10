import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

const ResourceRoutes = RouterModule.forChild([

  // Web Apps
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename',
    loadChildren: () => import('./web-sites/web-sites.module').then(m => m.WebSitesModule)
  },
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename/:siteSuffix',
    loadChildren: () => import('./web-sites/web-sites.module').then(m => m.WebSitesModule)
  },
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/sites/:resourcename/slots/:slot',
    loadChildren: () => import('./web-sites/web-sites.module').then(m => m.WebSitesModule)
  },

  // App Service Environment
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/microsoft.web/hostingenvironments/:resourcename',
    loadChildren: () => import('./web-hosting-environments/web-hosting-environments.module').then(m => m.WebHostingEnvironmentsModule)
  },

  // Generic ARM Resource
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/:providerName/:resourceTypeName/:resourcename',
    loadChildren: () => import('./generic-arm-resources/generic-arm-resources.module').then(m => m.GenericArmResourcesModule)
  },

  //Generic ARM Resource with suffix
  {
    path: 'subscriptions/:subscriptionid/resourcegroups/:resourcegroup/providers/:providerName/:resourceTypeName/:resourcename/:armSuffix',
    loadChildren: () => import('./generic-arm-resources/generic-arm-resources.module').then(m => m.GenericArmResourcesModule)
  }

]);

@NgModule({
  imports: [
    CommonModule,
    ResourceRoutes
  ],
  declarations: [],
  providers: []
})
export class ResourcesModule { }
