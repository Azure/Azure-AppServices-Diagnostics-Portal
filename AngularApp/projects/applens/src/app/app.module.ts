import { map } from 'rxjs/operators';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injectable, ErrorHandler } from '@angular/core';
import { RouterModule, Resolve, ActivatedRouteSnapshot, Router, UrlSerializer } from '@angular/router';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StartupService } from './shared/services/startup.service';
import { ArmResource, ResourceServiceInputs } from './shared/models/resources';
import { Observable } from 'rxjs';
import { AadAuthGuard } from './shared/auth/aad-auth-guard.service';
import { LoginComponent } from './shared/components/login/login.component';
import { AdalService, AdalGuard, AdalInterceptor } from 'adal-angular4';
import { CustomUrlSerializerService } from './shared/services/custom-url-serializer.service';
import { DiagnosticDataModule, GenericThemeService } from 'diagnostic-data';
import { UnhandledExceptionHandlerService, AppInsightsTelemetryService } from 'diagnostic-data';
import { HighchartsChartModule } from 'highcharts-angular';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { AuthRequestFailedComponent } from './shared/components/auth-request-failed/auth-request-failed.component';
import { TokenInvalidComponent } from './shared/components/tokeninvalid/tokeninvalid.component';
import { AngularReactBrowserModule } from '@angular-react/core';
import { ApplensAppinsightsTelemetryService } from './shared/services/applens-appinsights-telemetry.service';
import { ApplensThemeService } from './shared/services/applens-theme.service';
import { AppLensInterceptorService } from './shared/services/applens-http-interceptor.service';
import { FabPanelModule } from '@angular-react/fabric/lib/components/panel';
import { FabDialogModule } from '@angular-react/fabric/lib/components/dialog';
import { FabButtonModule } from '@angular-react/fabric/lib/components/button';
import { FabChoiceGroupModule } from '@angular-react/fabric/lib/components/choice-group';

@Injectable()
export class ValidResourceResolver implements Resolve<void>{
  constructor(private _startupService: StartupService, private _http: HttpClient, private _router: Router) { }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    return this._http.get<any>('assets/enabledResourceTypes.json').pipe(map(response => {
      let routePath = route.pathFromRoot
                        .map(v => v.url.map(segment => segment.toString()).join('/'))
                        .join('/');
      if (routePath.toLowerCase().includes("/stamps/")) {
        let enabledResourceTypes = <ResourceServiceInputs[]>response.enabledResourceTypes;
        let matchingResourceInputs = enabledResourceTypes.find(t => t.resourceType.toLowerCase() === "stamps");
        matchingResourceInputs.armResource = {
          subscriptionId: "",
          resourceGroup: "",
          provider: "",
          resourceTypeName: "stamps",
          resourceName: route.params["stampName"]
        }
        this._startupService.setResource(matchingResourceInputs);
        return matchingResourceInputs;
      }

      let resource = <ArmResource>route.params;
      let type = `${resource.provider}/${resource.resourceTypeName}`

      if (response && response.enabledResourceTypes.length > 0) {
        let enabledResourceTypes = <ResourceServiceInputs[]>response.enabledResourceTypes;
        let matchingResourceInputs = enabledResourceTypes.find(t => t.resourceType.toLowerCase() === type.toLowerCase());

        if (matchingResourceInputs) {
          matchingResourceInputs.armResource = resource;
          this._startupService.setResource(matchingResourceInputs);
          return matchingResourceInputs;
        }
      }

      //TODO: below does not seem to work
      this._router.navigate(['/']);
      return `Resource Type '${type}' not enabled in Applens`;
    }));
  }
}

export const Routes = RouterModule.forRoot([
    {
        path: '',
        canActivate: [AadAuthGuard],
        children: [
            {
                path: '',
                children: [
                    {
                        path: '',
                        loadChildren: () => import('./modules/main/main.module').then(m => m.MainModule)
                    },
                    {
                        path: 'sites/:site',
                        loadChildren: () => import('./modules/site/site.module').then(m => m.SiteModule)
                    },
                    {
                        path: 'containerapps/:containerapp',
                        loadChildren: () => import('./modules/containerapp/containerapp.module').then(m => m.ContainerAppModule)
                    }, {
                        path: 'staticwebapps/:staticwebapp',
                        loadChildren: () => import('./modules/staticwebapp/staticwebapp.module').then(m => m.StaticWebAppModule)
                    },
                    {
                        path: 'stampfinder/:stampName',
                        loadChildren: () => import('./modules/stamp/stamp.module').then(m => m.StampModule)
                    },
                    {
                        path: 'icm',
                        loadChildren: () => import('./modules/incidentassist/incidentassist.module').then(m => m.IncidentAssistModule)
                    },
                    {
                        path: 'surveys/:caseId',
                        loadChildren: () => import('./modules/surveys/surveys.module').then(m => m.SurveysModule)
                    },
                    {
                        path: 'hostingEnvironments/:hostingEnvironment',
                        loadChildren: () => import('./modules/ase/ase.module').then(m => m.AseModule)
                    },
                    {
                        path: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/:resourceTypeName/:resourceName',
                        redirectTo: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Microsoft.Web/:resourceTypeName/:resourceName'
                    },
                    {
                        path: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/:provider/:resourceTypeName/:resourceName',
                        loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
                        resolve: { validResources: ValidResourceResolver }
                    },
                    //For '/resourceGroup' case insensitive
                    {
                        path: 'subscriptions/:subscriptionId/resourcegroups/:resourceGroup/providers/:provider/:resourceTypeName/:resourceName',
                        redirectTo: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/:provider/:resourceTypeName/:resourceName',
                    },
                    {
                        path: 'stamps/:stampName',
                        loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule),
                        resolve: { validResources: ValidResourceResolver }
                    },
                    {
                        path: 'caseCleansing',
                        loadChildren: () => import('./modules/casecleansing/casecleansing.module').then(m => m.CasecleansingModule)
                    }
                ]
            }
        ]
    },
    {
        path: 'unauthorized',
        component: UnauthorizedComponent
    },
    {
        path: 'authRequestFailed',
        component: AuthRequestFailedComponent
    },
    {
        path: 'tokeninvalid',
        component: TokenInvalidComponent
    },
    {
        path: 'login',
        component: LoginComponent
    }
], { relativeLinkResolution: 'legacy' });

@NgModule({
  declarations: [
    AppComponent,
    UnauthorizedComponent,
    AuthRequestFailedComponent,
    TokenInvalidComponent
  ],
  imports: [
    AngularReactBrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    DiagnosticDataModule.forRoot(),
    Routes,
    SharedModule.forRoot(),
    FabPanelModule,
    FabDialogModule,
    FabButtonModule,
    FabChoiceGroupModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AppLensInterceptorService,
      multi: true
     },
    ValidResourceResolver,
    { provide: AppInsightsTelemetryService, useExisting: ApplensAppinsightsTelemetryService },
    AdalService,
    {
      provide: UrlSerializer,
      useClass: CustomUrlSerializerService
    },
    {
      provide: ErrorHandler,
      useClass: UnhandledExceptionHandlerService
    },
    { provide: GenericThemeService, useExisting: ApplensThemeService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
