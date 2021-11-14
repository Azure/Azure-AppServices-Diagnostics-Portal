import { Component, OnInit, Injector } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute, Router, NavigationExtras, NavigationEnd, Scroll, ChildActivationEnd } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { INavProps, INavLink, INav, INavStyles } from 'office-ui-fabric-react';
import { CategoriesService } from '../../../shared/services/categories.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { Feature } from '../../../shared-v2/models/features';
import { AuthService } from '../../../startup/services/auth.service';
import { DiagnosticService, DetectorMetaData, DetectorType, TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { filter, tap } from 'rxjs/operators';
import { PortalActionService } from '../../../shared/services/portal-action.service';
import { Globals } from '../../../globals';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';
import { OperatingSystem } from '../../../shared/models/site';

@Component({
    selector: 'category-summary',
    templateUrl: './category-summary.component.html',
    styleUrls: ['./category-summary.component.scss'],
    providers: [CategoryChatStateService]
})
export class CategorySummaryComponent implements OnInit {
    showChoiceGroup: boolean = true;
    currentRoutePath: string[];
    allProblemCategories: Category[] = [];
    features: Feature[];
    tiles: Tile[];

    startingKey: string;

    category: Category;
    categoryName: string;
    resourceId = "";
    baseUrl = "";
    resourceName = "";

    groups: any;
    counter: number = 0;

    initialSelectedKey: INavProps["initialSelectedKey"] = "overview";
    selectedKey: INavProps["initialSelectedKey"];

    styles: any;

    selectedCategoryIndex = "1";

    openPanel: boolean = false;
    disableGenie: boolean = false;

    closeGeniePanel() {
        this.globals.openGeniePanel = false;
        this.openPanel = false;
    }

    openGeniePanel() {
        this.globals.openGeniePanel  = true;
    }

    setCategoryIndex(event:any) {
        const categoryIndex = event.option.key;
        this.selectedCategoryIndex = categoryIndex;
      }

    public _checkIsWindowsOrLinuxApp(): boolean {
        let webSiteService = this._resourceService as WebSitesService;
        return this._resourceService && this._resourceService instanceof WebSitesService
        && (webSiteService.platform === OperatingSystem.windows || webSiteService.platform === OperatingSystem.linux)
    }

    constructor(protected _diagnosticApiService: DiagnosticService, private _route: Router, private _injector: Injector, private _activatedRoute: ActivatedRoute, private categoryService: CategoryService,
        private _chatState: CategoryChatStateService, private _featureService: FeatureService, protected _authService: AuthService, private _portalActionService: PortalActionService, private globals: Globals, private _telemetryService: TelemetryService,private _resourceService:ResourceService) {
    }

    ngOnInit() {
        if(this._resourceService.armResourceConfig){
            this.categoryService.initCategoriesForArmResource(this._resourceService.resource.id);
        }

        this.disableGenie = this._resourceService.isGenieDisabled();

        this.categoryService.categories.subscribe(categories => {
          let decodedCategoryName  = "";
          this._activatedRoute.params.subscribe(parmas => {
            decodedCategoryName = parmas.category.toLowerCase();
            this.category = categories.find(category => category.id.toLowerCase() === this._activatedRoute.snapshot.params.category.toLowerCase() ||  category.name.replace(/\s/g, '').toLowerCase() === decodedCategoryName);
            this._chatState.category = this.category;
            this.categoryName = this.category ? this.category.name : "";

            this.resourceName = this._activatedRoute.snapshot.parent.params.resourcename;
            this._portalActionService.updateDiagnoseCategoryBladeTitle(`${this.resourceName} | ` + this.categoryName);
          });
        });
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };
        this._route.navigate(path.split('/'), navigationExtras);
    }

    ngAfterViewInit() {
        this._telemetryService.logPageView(TelemetryEventNames.CategoryPageLoaded, {"category": this.categoryName});
    }
}
