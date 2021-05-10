import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeViewComponent } from './components/tree-view/tree-view.component';
import { DiagnosticApiService } from './services/diagnostic-api.service';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { HttpClientModule } from '@angular/common/http';
import { SiteService } from './services/site.service';
import { WorkerAppService } from "./services/workerapp.service";
import { FormsModule } from '@angular/forms';
import { StartupService } from './services/startup.service';
import { ObserverService } from './services/observer.service';
import { GithubApiService } from './services/github-api.service';
import { AseService } from './services/ase.service';
import { CacheService } from './services/cache.service';
import { ResourceService } from './services/resource.service';
import { AadAuthGuard } from './auth/aad-auth-guard.service';
import { LoginComponent } from './components/login/login.component';
import { RouterModule } from '@angular/router';
import { CaseCleansingApiService } from './services/casecleansing-api.service';
import { ApplensHeaderComponent } from './components/applens-header/applens-header.component';
import { ApplensDiagnosticService } from '../modules/dashboard/services/applens-diagnostic.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FormsModule,
    RouterModule,
  ],
  declarations: [TreeViewComponent, LoginComponent, ApplensHeaderComponent],
  exports: [TreeViewComponent,ApplensHeaderComponent]
})
export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: [
        ApplensDiagnosticService,
        DiagnosticApiService,
        ResourceService,
        SiteService,
        WorkerAppService,
        AseService,
        StartupService,
        ObserverService,
        GithubApiService,
        CacheService,
        AadAuthGuard,
        CaseCleansingApiService
      ]
    }
  }
}
