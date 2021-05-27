
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
import { DiagnosticDataModule } from 'diagnostic-data';
import { UnhandledExceptionHandlerService, AppInsightsTelemetryService } from 'diagnostic-data';
import { CustomMaterialModule } from './material-module';
import { HighchartsChartModule } from 'highcharts-angular';
import { UnauthorizedComponent } from './shared/components/unauthorized/unauthorized.component';
import { AuthRequestFailedComponent } from './shared/components/auth-request-failed/auth-request-failed.component';
import { TokenInvalidComponent } from './shared/components/tokeninvalid/tokeninvalid.component';
import { AngularReactBrowserModule } from '@angular-react/core';
import { ApplensAppinsightsTelemetryService } from './shared/services/applens-appinsights-telemetry.service';
import { ApplensHeaderComponent } from './shared/components/applens-header/applens-header.component';
import { FabButtonModule, FabDialogModule, FabPanelModule } from '@angular-react/fabric';

@Injectable()
export class ValidResourceResolver implements Resolve<void>{
  constructor(private _startupService: StartupService, private _http: HttpClient, private _router: Router) { }

  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    return this._http.get<any>('assets/enabledResourceTypes.json').pipe(map(response => {
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
            loadChildren: './modules/main/main.module#MainModule'
          },
          {
            path: 'sites/:site',
            loadChildren: './modules/site/site.module#SiteModule'
          },
          {
            path: 'workerapps/:workerapp',
            loadChildren: './modules/workerapp/workerapp.module#WorkerAppModule'
          },
          {
            path: 'icm/:incidentId',
            loadChildren: './modules/incidentassist/incidentassist.module#IncidentAssistModule'
          },
          {
            path: 'surveys/:caseId',
            loadChildren: './modules/surveys/surveys.module#SurveysModule'
          },
          {
            path: 'hostingEnvironments/:hostingEnvironment',
            loadChildren: './modules/ase/ase.module#AseModule'
          },
          {
            path: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/:resourceTypeName/:resourceName',
            redirectTo: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/Microsoft.Web/:resourceTypeName/:resourceName'
          },
          {
            path: 'subscriptions/:subscriptionId/resourceGroups/:resourceGroup/providers/:provider/:resourceTypeName/:resourceName',
            loadChildren: './modules/dashboard/dashboard.module#DashboardModule',
            resolve: { validResources: ValidResourceResolver }
          },
          {
            path: 'caseCleansing',
            loadChildren: './modules/casecleansing/casecleansing.module#CasecleansingModule'
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
]
);

@NgModule({
  declarations: [
    AppComponent,
    UnauthorizedComponent,
    AuthRequestFailedComponent,
    TokenInvalidComponent,
    ApplensHeaderComponent
  ],
  imports: [
    AngularReactBrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    DiagnosticDataModule.forRoot(),
    Routes,
    SharedModule.forRoot(),
    CustomMaterialModule,
    FabPanelModule,
    FabDialogModule,
    FabButtonModule
  ],
  providers: [
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
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
