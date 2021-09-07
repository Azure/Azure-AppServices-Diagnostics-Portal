import { Component, OnInit, Injector, Pipe, PipeTransform } from '@angular/core';
import { MessageProcessor } from '../../../supportbot/message-processor.service';
import { ActivatedRoute, Router, NavigationExtras, NavigationEnd, Scroll } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { INavProps, INavLink, INav, autobind, INavStyles } from 'office-ui-fabric-react';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { Feature } from '../../../shared-v2/models/features';
import { AuthService } from '../../../startup/services/auth.service';
import { DiagnosticService, DetectorMetaData, icons } from 'diagnostic-data';
import { filter } from 'rxjs/operators';
import { CollapsibleMenuItem, CollapsibleMenuItemComponent } from '../collapsible-menu-item/collapsible-menu-item.component';
import { DetectorCategorizationService } from '../../../shared/services/detector-categorized.service';
import { SiteFeatureService } from '../../../resources/web-sites/services/site-feature.service';
import { SiteFilteredItem } from '../../../resources/web-sites/models/site-filter';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { AppType } from '../../../shared/models/portal';
import { OperatingSystem, HostingEnvironmentKind } from '../../../shared/models/site';
import { Sku } from '../../../shared/models/server-farm';

@Component({
    selector: 'category-nav',
    templateUrl: './category-nav.component.html',
    styleUrls: ['./category-nav.component.scss']
})
export class CategoryNavComponent implements OnInit {
    imageRootPath = '../../../../assets/img/detectors';
    toolCategories: SiteFilteredItem<any>[] = [];
    toolCategoriesFilteredByStack: SiteFilteredItem<any>[] = [];
    currentRoutePath: string[];
    allProblemCategories: Category[] = [];
    features: Feature[];
    tiles: Tile[];

    startingKey: string;

    category: Category;
    categoryName: string;
    resourceId = "";
    baseUrl = "";
    selectedId = "";
    groups: any;
    isDiagnosticTools: boolean = false;
    categoryId: string = "";

    initialSelectedKey: INavProps["initialSelectedKey"] = "overview";
    selectedKey: INavProps["initialSelectedKey"];

    styles: any;
    collapsible: any = false;
    hasUncategorizedDetectors: boolean = false;

    tempCategoriesArray: any[] = [];
    tempToolsArray: any[] = [];
    tempArray = [];
    transform(siteFilteredItems: SiteFilteredItem<any>[]): any[] {
        this.tempArray = [];
        return siteFilteredItems
            .filter(item =>
                (item.appType & this._webSiteService.appType) > 0 &&
                (item.platform & this._webSiteService.platform) > 0 &&
                (item.sku === Sku.All || item.sku === Sku.NotDynamic && this._webSiteService.sku != Sku.Dynamic || item.sku & this._webSiteService.sku) > 0 &&
                (item.hostingEnvironmentKind & this._webSiteService.hostingEnvironmentKind) > 0 &&
                (item.stack === '' || item.stack.toLowerCase().indexOf('all') >= 0) &&
                (!this.alreadyAdded(item.item)))
            .map(item => item);
    }

    alreadyAdded(item: any): boolean {
        if (item.title && this.tempArray.indexOf(item.title) > -1) {
            return true;
        }
        this.tempArray.push(item.title);
        return false;
    }

    toolsAlreadyAdded(item: any): boolean {
        if (item.name && this.tempToolsArray.indexOf(item.name) > -1) {
            return true;
        }
        this.tempToolsArray.push(item.name);
        return false;
    }

    constructor(public siteFeatureService: SiteFeatureService, protected _diagnosticApiService: DiagnosticService, private _route: Router, private _activatedRoute: ActivatedRoute, private categoryService: CategoryService,
        private _chatState: CategoryChatStateService,
        protected _authService: AuthService, public _detectorCategorization: DetectorCategorizationService, private _webSiteService: WebSitesService) { }

    detectorDataLocalCopy: DetectorMetaData[] = [];
    detectorList: CollapsibleMenuItem[] = [];
    orphanDetectorList: CollapsibleMenuItem[] = [];
    currentDetectorId: string = null;
    private getCurrentRoutePath() {
        this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
    }

    getCurrentItemId() {
        if (this._activatedRoute && this._activatedRoute.firstChild && this._activatedRoute.firstChild.snapshot) {
            if (!this._activatedRoute.firstChild.snapshot.params['analysisId']) {
                if (this._activatedRoute.firstChild.snapshot.params['detectorName']) {
                    this.currentDetectorId = this._activatedRoute.firstChild.snapshot.params['detectorName'];
                }
            }
            else {
                this.currentDetectorId = this._activatedRoute.firstChild.snapshot.params['analysisId'];
            }
        }
    }

    ngOnInit() {
        this.hasUncategorizedDetectors = false;
        this._route.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
            this.getCurrentItemId();
            this.getCurrentRoutePath();
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp | AppType.FunctionApp,
            platform: OperatingSystem.windows | OperatingSystem.HyperV | OperatingSystem.linux,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Proactive Tools',
                tools: this.siteFeatureService.proactiveTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let isSelected = () => {
                        return this.checkIsSelected(tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });
        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp | AppType.FunctionApp,
            platform: OperatingSystem.windows,
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Diagnostic Tools',
                tools: this.siteFeatureService.diagnosticTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let isSelected = () => {
                        return this.checkIsSelected(tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
                })
            }
        });

        let supportTools = this.siteFeatureService.supportTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
            let isSelected = () => {
                return this.checkIsSelected(tool.item.id);
            };
            let icon = this.getIconImagePath(tool.item.id);
            return new CollapsibleMenuItem(tool.item.name, tool.item.clickAction, isSelected, icon);
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp,
            platform: OperatingSystem.windows | OperatingSystem.HyperV,
            sku: Sku.NotDynamic,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Support Tools',
                tools: supportTools
            }
        });

        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.FunctionApp,
            platform: OperatingSystem.windows,
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Support Tools',
                tools: supportTools
            }
        });

        this.toolCategoriesFilteredByStack = this.transform(this.toolCategories);

        this.categoryService.categories.subscribe(categories => {
            let decodedCategoryName = "";
            this._activatedRoute.params.subscribe(params => {
                this.detectorList = [];
                decodedCategoryName = params.category.toLowerCase();
                this.category = categories.find(category => category.id.toLowerCase() === params.category.toLowerCase() || category.name.replace(/\s/g, '').toLowerCase() == decodedCategoryName);
                this._chatState.category = this.category;
                this.categoryName = this.category.name;
                this.categoryId = this.category.id;
                this.isDiagnosticTools = this.category.id === "DiagnosticTools";

                this.orphanDetectorList = this._detectorCategorization.detectorlistCategories[this.category.id] ? this._detectorCategorization.detectorlistCategories[this.category.id] : [];

                this._authService.getStartupInfo().subscribe(startupInfo => {
                    this.resourceId = startupInfo.resourceId;
                    this.baseUrl = `resource${this.resourceId}/categories/${this.category.id}/`;
                });

                // Get all the detector list under this category
                this.siteFeatureService.getFeaturesForCategorySub(this.category).subscribe(features => {
                    if (!this.isDiagnosticTools) {
                        features.forEach(feature => {
                            let onClick = () => {
                                feature.clickAction();
                            }
                            let isSelected = () => {
                                this.getCurrentItemId();
                                return this.currentDetectorId === feature.id;
                            }
                            let icon = this.getIconImagePath(feature.id);
                            let menuItem = new CollapsibleMenuItem(feature.name, onClick, isSelected, icon);
                            this.detectorList.push(menuItem);
                        });
                    }
                });

                this._diagnosticApiService.getDetectors().subscribe(detectors => {
                    this.detectorDataLocalCopy = detectors;
                });

                this._route.events.subscribe((evt) => {
                    if (evt instanceof NavigationEnd) {
                        let itemId = "";
                        let routePath: any = "detectors";
                        if (!(evt.url.split("/").length > 14 && evt.url.split("/")[12].toLowerCase() === "analysis" && (evt.url.split("/")[14].toLowerCase() === "detectors" || evt.url.split("/")[14].toLowerCase() === "analysis"))) {
                            if (evt.url.split("/").length > 12) {
                                if (evt.url.split("/")[12].toLowerCase() === "detectors") {
                                    itemId = decodeURI(evt.url.split("detectors/")[1].split("?")[0]);
                                }
                                else if (evt.url.split("/")[12].toLowerCase() === "analysis") {
                                    itemId = decodeURI(evt.url.split("analysis/")[1].split("?")[0]);
                                    routePath = "analysis";
                                }
                            }

                            let item = this.detectorDataLocalCopy.find(metadata => metadata.id.toLowerCase() === itemId.toLowerCase());
                            //If navigate to detector which is not belong to current category, we will also add it into orphanDetectorList 
                            if (item && (item.category == undefined || item.category == "" || this.checkIsFromAnotherCategory(categories, item, decodedCategoryName)) && !this.detectorList.find((detector) => detector.label === item.id)) {
                                if (!this.orphanDetectorList || !this.orphanDetectorList.find((orphan) => (orphan.label) === item.name)) {
                                    let isSelected = () => {
                                        return this._route.url.includes(`detectors/${item.id}`) || this._route.url.includes(`analysis/${item.id}`);
                                    };
                                    let icon = this.getIconImagePath(item.id);
                                    let onClick = () => {
                                        let dest1 = `resource${this.resourceId}/categories/${this.categoryId}/${routePath}/${item.id}`;
                                        this._route.navigate([dest1]);
                                    };
                                    let orphanMenuItem = new CollapsibleMenuItem(item.name, onClick, isSelected, icon);
                                    if (!this.orphanDetectorList || !this.orphanDetectorList.find((item1 => item1.label === orphanMenuItem.label))) {
                                        this._detectorCategorization.detectorlistCategories[this.category.id].push(orphanMenuItem);
                                    }
                                    this.orphanDetectorList = this._detectorCategorization.detectorlistCategories[this.category.id];
                                }
                            }

                        }
                    }
                });
            });
        });
    }

    private getIconImagePath(name: string) {
        const fileName = icons.has(name) ? name : 'default';
        return `${this.imageRootPath}/${fileName}.svg`;
    }

    private stackMatchedForTools(item: SiteFilteredItem<any>): boolean {
        return (item.appType & this._webSiteService.appType) > 0 &&
            (item.platform & this._webSiteService.platform) > 0 &&
            (item.sku & this._webSiteService.sku) > 0 &&
            (item.hostingEnvironmentKind & this._webSiteService.hostingEnvironmentKind) > 0 &&
            (!this.toolsAlreadyAdded(item.item));
    }

    private checkIsSelected(id: string) {
        //check if base url is ends with id
        const url = this._route.url;
        const baseUrl = url.split('?')[0];
        return baseUrl.endsWith('/' + id);
    }

    private checkIsFromAnotherCategory(categories: Category[], detector: DetectorMetaData, currentCategoryId: string): boolean {
        const detectorCategory = categories.find(c => c.name.toLowerCase() === detector.category.toLowerCase());
        return detectorCategory === undefined || detectorCategory.id.toLowerCase() !== currentCategoryId.toLowerCase();
    }
}
