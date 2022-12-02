import {
  Component,
  Injector,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit
} from '@angular/core';
import { Router } from '@angular/router';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { OperatingSystem } from '../../../shared/models/site';
import { LoggingService } from '../../../shared/services/logging/logging.service';
import { SiteService } from '../../../shared/services/site.service';
import { CategoriesService } from '../../../shared/services/categories.service';
import { Category } from '../../../shared/models/problem-category';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { AuthService } from '../../../startup/services/auth.service';
import {
  StartupInfo,
  ResourceType,
  AppType
} from '../../../shared/models/portal';
import { IDiagnosticProperties } from '../../../shared/models/diagnosticproperties';
import { Sku } from '../../../shared/models/server-farm';

@Component({
  templateUrl: 'main-menu.component.html',
  providers: [CategoriesService],
  styleUrls: ['main-menu.component.scss']
})
export class MainMenuComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  allProblemCategories: Category[] = [];
  AppStack: string = '';
  platform: OperatingSystem = OperatingSystem.any;
  appType: AppType;
  sku: Sku;
  showToolsDropdown: boolean = false;

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  constructor(
    private _injector: Injector,
    private _router: Router,
    private _logger: LoggingService,
    private _siteService: SiteService,
    public categoryService: CategoriesService,
    private _authService: AuthService,
    private _appAnalysisService: AppAnalysisService
  ) {}

  ngOnInit(): void {
    if (this._authService.resourceType == ResourceType.Site) {
      this._siteService.currentSite.subscribe((site) => {
        if (site) {
          this.appType =
            site.kind.toLowerCase().indexOf('functionapp') >= 0
              ? AppType.FunctionApp
              : AppType.WebApp;
          this.platform =
            site.kind.toLowerCase().indexOf('linux') >= 0
              ? OperatingSystem.linux
              : OperatingSystem.windows;
          this.sku = Sku[site.sku];
          this._authService
            .getStartupInfo()
            .subscribe((startupInfo: StartupInfo) => {
              const resourceUriParts = this._siteService.parseResourceUri(
                startupInfo.resourceId
              );
              this._appAnalysisService
                .getDiagnosticProperties(
                  resourceUriParts.subscriptionId,
                  resourceUriParts.resourceGroup,
                  resourceUriParts.siteName,
                  resourceUriParts.slotName
                )
                .subscribe((data: IDiagnosticProperties) => {
                  this.AppStack =
                    data && data.appStack && data.appStack != ''
                      ? data.appStack
                      : 'ASP.Net';
                  this.categoryService.Categories.subscribe((categories) => {
                    this.allProblemCategories = categories;
                  });
                  setTimeout(() => {
                    this.onComplete.emit({ status: true });
                  }, 2000);
                });
            });
        }
      });
    } else {
      this.categoryService.Categories.subscribe((categories) => {
        this.allProblemCategories = categories;
        setTimeout(() => {
          this.onComplete.emit({ status: true });
        }, 300);
      });
    }
  }

  logCategorySelected(name: string) {
    this._logger.LogClickEvent(name, 'Home Page');
  }

  ngAfterViewInit(): void {
    this.onViewUpdate.emit();
  }

  onStackChanged(stack: string) {
    this.AppStack = stack;
    this.showToolsDropdown = false;
  }
}
