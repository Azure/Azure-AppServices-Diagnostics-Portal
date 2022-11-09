import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras, NavigationEnd, Scroll } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { INavProps } from 'office-ui-fabric-react';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { Feature } from '../../../shared-v2/models/features';
import { AuthService } from '../../../startup/services/auth.service';
import { DiagnosticService, DetectorMetaData, icons, TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { filter } from 'rxjs/operators';
import { CollapsibleMenuItem } from '../collapsible-menu-item/collapsible-menu-item.component';
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
    toolCategoriesFilteredByStack: any[] = [];
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
        protected _authService: AuthService, public _detectorCategorization: DetectorCategorizationService, private _webSiteService: WebSitesService,private _telemetryService:TelemetryService) { }

    detectorDataLocalCopy: DetectorMetaData[] = [];
    detectorList: CollapsibleMenuItem[] = [];
    orphanDetectorList: CollapsibleMenuItem[] = [];
    currentDetectorId: string = null;
    private getCurrentRoutePath() {
        this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
    }

    getCurrentItemId() {
        if (this._activatedRoute && this._activatedRoute.snapshot && this._activatedRoute.snapshot.params["category"] && this._route.url.split("?")[0].endsWith("/overview")) {
            this.currentDetectorId = null;
            return;
        }

        if (this._activatedRoute && this._activatedRoute.firstChild && this._activatedRoute.firstChild.snapshot) {
            if (this._activatedRoute.firstChild.snapshot.routeConfig.path.startsWith("tools/")) {
                this.currentDetectorId = this._activatedRoute.firstChild.snapshot.routeConfig.path.split("/")[1];
            }
            else if (!this._activatedRoute.firstChild.snapshot.params['analysisId']) {
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
                    let onClick = () => {
                        this.logCategoryNavClicked(tool.item.name, "Proactive Tools");
                        tool.item.clickAction();
                    }
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, onClick, isSelected, icon);
                })
            }
        });
        this.toolCategories.push(<SiteFilteredItem<any>>{
            appType: AppType.WebApp | AppType.FunctionApp | AppType.WorkflowApp,
            platform: OperatingSystem.windows | OperatingSystem.linux | OperatingSystem.HyperV,
            sku: Sku.All,
            hostingEnvironmentKind: HostingEnvironmentKind.All,
            stack: '',
            item: {
                title: 'Diagnostic Tools',
                tools: this.siteFeatureService.diagnosticTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
                    let onClick = () => {
                        this.logCategoryNavClicked(tool.item.name, "Diagnostic Tools");
                        tool.item.clickAction();
                    }
                    
                    let isSelected = () => {
                        return this.checkIsSelected(tool.item.id);
                    };
                    let icon = this.getIconImagePath(tool.item.id);
                    return new CollapsibleMenuItem(tool.item.name, onClick, isSelected, icon);
                })
            }
        });

        let supportTools = this.siteFeatureService.supportTools.filter(tool => this.stackMatchedForTools(tool)).map(tool => {
            let onClick = () => {
                this.logCategoryNavClicked(tool.item.name, "Support Tools");
                tool.item.clickAction();
            }

            let isSelected = () => {
                return this.checkIsSelected(tool.item.id);
            };
            let icon = this.getIconImagePath(tool.item.id);
            return new CollapsibleMenuItem(tool.item.name, onClick, isSelected, icon);
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

        const resourceType:string = this._activatedRoute.parent.snapshot.data.data.type;

        if (resourceType.toLowerCase() === "microsoft.web/sites") {
            this.toolCategoriesFilteredByStack = this.transform(this.toolCategories);
        } else {
            const diagnosticToolsForNonWeb = this.siteFeatureService.diagnosticToolsForNonWeb.filter(t => t.type.toLowerCase() === resourceType.toLowerCase()).map(tool => {
                let onClick = () => {
                    this.logCategoryNavClicked(tool.item.name, "Diagnostic Tools");
                    tool.item.clickAction();
                }

                let isSelected = () => {
                    return this.checkIsSelected(tool.item.id);
                };
                let icon = this.getIconImagePath(tool.item.id);
                return new CollapsibleMenuItem(tool.item.name, onClick, isSelected, icon);
            });
            this.toolCategoriesFilteredByStack = [
                { 
                    item: {
                        title: 'Diagnostic Tools',
                        tools: diagnosticToolsForNonWeb
                    } 
                    
                }
            ];
        }

        this.categoryService.categories.subscribe(categories => {
            let decodedCategoryName = "";
            this._activatedRoute.params.subscribe(params => {
                this.detectorList = [];
                decodedCategoryName = params.category.toLowerCase();
                this.category = categories.find(category => category.id.toLowerCase() === params.category.toLowerCase() || category.name.replace(/\s/g, '').toLowerCase() == decodedCategoryName);
                this._chatState.category = this.category;
                this.categoryName = this.category.name;
                this.categoryId = this.category.id;
                this.isDiagnosticTools = this.category.id.toLowerCase().startsWith("diagnostictools");

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
                                this.logCategoryNavClicked(feature.name, feature.category);
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
                            if (item && (item.category == undefined || item.category == "" || this.checkIsFromAnotherCategory(categories, item, decodedCategoryName)) && !this.detectorList.find((detector) => detector.label === item.name)) {
                                if (!this.orphanDetectorList || !this.orphanDetectorList.find((orphan) => (orphan.label) === item.name)) {
                                    let isSelected = () => {
                                        return this._route.url.includes(`detectors/${item.id}`) || this._route.url.includes(`analysis/${item.id}`);
                                    };
                                    let icon = this.getIconImagePath(item.id);
                                    let onClick = () => {
                                        this.logCategoryNavClicked(item.name, this.category.name);
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

    private logCategoryNavClicked(name: string, category: string) {
        this._telemetryService.logEvent(TelemetryEventNames.CategoryNavItemClicked,{
            'DetectorName':name,
            'CategoryName': category
        });
    }
}
