import { AdalService } from 'adal-angular4';
import { filter } from 'rxjs/operators';
import { Component, OnInit, PipeTransform, Pipe } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { ResourceService } from '../../../shared/services/resource.service';
import { CollapsibleMenuItem } from '../../../collapsible-menu/components/collapsible-menu-item/collapsible-menu-item.component';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DetectorMetaData, DetectorType, StringUtilities } from 'diagnostic-data';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';
import { environment } from '../../../../environments/environment';
import { UserSettingService } from '../services/user-setting.service';
import { BreadcrumbService } from '../services/breadcrumb.service';
import { forkJoin } from 'rxjs';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { element } from 'protractor';
import { ApplensDocumentationService } from '../services/applens-documentation.service';
import { DocumentationRepoSettings } from '../../../shared/models/documentationRepoSettings';
import { DocumentationFilesList } from './documentationFilesList';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { PortalUtils } from '../../../shared/utilities/portal-util';

@Component({
  selector: 'side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss']
})
export class SideNavComponent implements OnInit {

  userId: string = "";

  detectorsLoading: boolean = true;
  workflowsLoading: boolean = true;

  currentRoutePath: string[];

  categories: CollapsibleMenuItem[] = [];
  categoriesCopy: CollapsibleMenuItem[] = [];

  workflowCategories: CollapsibleMenuItem[] = [];
  workflowCategoriesCopy: CollapsibleMenuItem[] = [];

  gists: CollapsibleMenuItem[] = [];
  gistsCopy: CollapsibleMenuItem[] = [];

  docs: CollapsibleMenuItem[] = [];
  docsCopy: CollapsibleMenuItem[] = [];
  documentationRepoSettings: DocumentationRepoSettings;
  docsBranch = null;
  documentList: DocumentationFilesList = new DocumentationFilesList();

  favoriteDetectors: CollapsibleMenuItem[] = [];
  favoriteDetectorsCopy: CollapsibleMenuItem[] = [];

  searchValue: string = undefined;
  searchAriaLabel: string = "Filter by name or id";

  toolsCopy: CollapsibleMenuItem[] = [];

  contentHeight: string;

  getDetectorsRouteNotFound: boolean = false;
  getWorkflowsRouteNotFound: boolean = false;

  isGraduation: boolean = false;
  isProd: boolean = false;
  workflowsEnabled: boolean = false;
  showChatGPT: boolean = false;
  askAppLensEnabled: boolean = false;
  

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _adalService: AdalService,
    private _diagnosticApiService: ApplensDiagnosticService, public resourceService: ResourceService, private _telemetryService: TelemetryService,
    private _userSettingService: UserSettingService, private breadcrumbService: BreadcrumbService, private _diagnosticApi: DiagnosticApiService,
    private _documentationService: ApplensDocumentationService,
    private _openAIService: ApplensOpenAIChatService) {
    this.contentHeight = (window.innerHeight - 139) + 'px';
    if (environment.adal.enabled) {
      this.userId = this.getUserId();
    }
  }

  documentation: CollapsibleMenuItem[] = [
    {
      label: 'Online Documentation',
      id: "",
      onClick: () => { window.open('https://app-service-diagnostics-docs.azurewebsites.net/api/Diagnostics.ModelsAndUtils.Models.Response.html#extensionmethods', '_blank') },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }
  ];

  overview: CollapsibleMenuItem[] = [
    {
      label: 'Detector List',
      id: "",
      onClick: () => {
        this.navigateTo("");
      },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }];

  chatgpt: CollapsibleMenuItem[] = [
    {
      label: 'ChatGPT',
      id: "",
      onClick: () => {
        this.navigateTo("");
      },
      expanded: false,
      subItems: null,
      isSelected: null,
      icon: null
    }];

  createNew: CollapsibleMenuItem[] = [
    {
      label: 'Your Detectors',
      id: "",
      onClick: () => {
        this.navigateToUserPage();
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase().startsWith(`users`);
      },
      icon: null
    },
    {
      label: 'New Detector',
      id: "",
      onClick: () => {
        this.navigateTo('create');
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `create`.toLowerCase();
      },
      icon: null
    },
    {
      label: 'New Gist',
      id: "",
      onClick: () => {
        this.navigateTo('createGist');
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `createGist`.toLowerCase();
      },
      icon: null
    },
    {
      label: 'View Pending Changes',
      id: "",
      onClick: () => {
        this.navigateTo("deployments");
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && (this.currentRoutePath.join('/').toLowerCase().indexOf('deployments') > 0);
      },
      icon: null
    }
  ];

  configuration: CollapsibleMenuItem[] = [
    {
      label: 'Kusto Mapping',
      onClick: () => {
        this.navigateTo('kustoConfig');
      },
      id: "",
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `kustoConfig`.toLowerCase();
      },
      icon: null
    }
  ];

  tools: CollapsibleMenuItem[] = [
    {
      label: 'Network Trace Analysis',
      id: "",
      onClick: () => {
        this.navigateTo("networkTraceAnalysis");
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `networkTraceAnalysis`.toLowerCase();
      },
      icon: null
    },
    ...this.askAppLensEnabled? [{
      label: 'Ask AppLens',
      id: "askAppLens",
      onClick: () => {
        this.navigateTo("askApplens");
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `askapplens`.toLowerCase();
      },
      icon: null
    }]: [],
    {
      label: 'KQL for Antares Analytics',
      id: "kustocopilot",
      onClick: () => {
        this.navigateTo("kustoQueryGenerator");
      },
      expanded: false,
      subItems: null,
      isSelected: () => {
        return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `kustoQueryGenerator`;
      },
      icon: null,
      visible: false
    }
  ];

  ngOnInit() {
    this.checkRCAToolkitEnabled(); 
    this._openAIService.CheckEnabled().subscribe(enabled => {
      this.showChatGPT = this._openAIService.isEnabled;
      this._diagnosticApi.get<boolean>('api/openai/kustocopilot/enabled').subscribe(kustoGPTEnabledStatus => {
        this.tools.find(tool => tool.id === 'kustocopilot').visible = kustoGPTEnabledStatus && `${this.resourceService.ArmResource.provider}`.toLowerCase().indexOf('microsoft.web') > -1;
      });
    });
    this._documentationService.getDocsRepoSettings().subscribe(settings => {
      this.documentationRepoSettings = settings;
      this.initializeDetectors();
    });
    this.getCurrentRoutePath();
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      this.getCurrentRoutePath();
    });
    this.initializeFavoriteDetectors();

    this.workflowsEnabled = this.resourceService.workflowsEnabled;
    if (this.workflowsEnabled) {
      this.initializeWorkflows();
      this.createNew.push(
        {
          label: 'New Workflow',
          id: "",
          onClick: () => {
            this.navigateTo('createWorkflow');
          },
          expanded: false,
          subItems: null,
          isSelected: () => {
            return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `createWorkflow`.toLowerCase();
          },
          icon: null
        }
      );
    }

    this.toolsCopy = this.deepCopyArray(this.tools);
  }

  checkRCAToolkitEnabled(){
    //check if rca toolkit is present/enabled
    let isPresent = this.tools.find(tool => tool.label === "RCA Copilot (Preview)");
    if(isPresent){
      return; 
    }

    //if not present/enabled
    var tempResourceId = this.resourceService.getCurrentResourceId();
   
    if(tempResourceId.indexOf("Microsoft.Web/sites") != -1){

      this.tools.push(
        {
        label: 'RCA Copilot (Preview)',
        id: "",
        onClick: () => {
          PortalUtils.logEvent("rcacopilot-toolopened", "", this._telemetryService);
          this.navigateTo("communicationToolkit");
        },
        expanded: false,
        subItems: null,
        isSelected: () => {
          return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === `communicationToolkit`.toLowerCase();
        },
        icon: null
      })
    }
  }

  navigateToOverview() {
    this.navigateTo("overview");
  }

  navigateToChatGPT() {
    this.navigateTo("chatgpt");
  }

  navigateToDetectorList() {
    this.navigateTo("alldetectors");
  }

  navigateToActivePRs() {
    const userId: string = this.getUserId();
    this.navigateTo(`users/${userId}/activepullrequests`);
  }

  private getCurrentRoutePath() {
    this.currentRoutePath = this._activatedRoute.firstChild.snapshot.url.map(urlSegment => urlSegment.path);
  }

  private getUserId() {
    let alias: string = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    const userId: string = alias.replace('@microsoft.com', '');
    return userId;
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this.breadcrumbService.resetBreadCrumbSubject();
    this._router.navigate(path.split('/'), navigationExtras);
  }

  navigateToUserPage() {
    this.navigateTo(`users/${this.userId}/detectors`);
  }

  getDocCategories() {
    const categoriesObservable = this._diagnosticApiService.getDevOpsTree(`${this.documentationRepoSettings.root}`, this.docsBranch, this.documentationRepoSettings.resourceId);
    return categoriesObservable;
  }
  getDocFiles(category: string) {
    const fileObservalbe = this._diagnosticApiService.getDevOpsTree(`${this.documentationRepoSettings.root}/${category}`, this.docsBranch, this.documentationRepoSettings.resourceId);
    return fileObservalbe;
  }

  initializeWorkflows() {
    this.workflowsLoading = true;
    this._diagnosticApiService.getWorkflows().subscribe(workflowList => {
      this.workflowsLoading = false;
      if (workflowList) {
        workflowList.forEach(element => {
          this.createWorkflowMenuItem(element, this.workflowCategories);
        });

        // this.workflowCategories.push(new CollapsibleMenuItem("All workflows", "", () => { this.navigateTo("allworkflows"); }, () => { return this.currentRoutePath && this.currentRoutePath.join('/') === `allworkflows`; }, null, false, null));
        this.workflowCategories = this.workflowCategories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        this.workflowCategoriesCopy = this.deepCopyArray(this.workflowCategories);
      }

    },
      error => {
        this.workflowsLoading = false;
        // TODO: handle workflow route not found
        if (error && error.status === 404) {
          this.getWorkflowsRouteNotFound = true;
        }
      });
  }

  initializeDetectors() {
    this._diagnosticApiService.getDetectors().subscribe(detectorList => {
      if (detectorList) {
        detectorList.forEach(element => {
          this.createDetectorMenuItem(element, this.categories);
          if (element.type === DetectorType.Analysis) {
            //Make a duplicate menu item for analysis
            this.createDetectorMenuItem(element, this.categories, true);
          }
        });

        this.categories.push(new CollapsibleMenuItem("All detectors", "", () => { this.navigateTo("alldetectors"); }, () => { return this.currentRoutePath && this.currentRoutePath.join('/') === `alldetectors`; }, null, false, null));

        this.categories = this.categories.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        this.categoriesCopy = this.deepCopyArray(this.categories);
        this.detectorsLoading = false;
        this._telemetryService.logPageView(TelemetryEventNames.SideNavigationLoaded, {});
      }
    },
      error => {
        // TODO: handle detector route not found
        if (error && error.status === 404) {
          this.getDetectorsRouteNotFound = true;
        }
      });

    this._diagnosticApiService.getGists().subscribe(gistList => {
      if (gistList) {
        gistList.forEach(element => {
          let onClick = () => {
            this.navigateTo(`gists/${element.id}`);
          };

          let isSelected = () => {
            return this.currentRoutePath && this.currentRoutePath.join('/') === `gists/${element.id}`;
          };

          let category = element.category ? element.category.split(",") : ["Uncategorized"];
          let menuItem = new CollapsibleMenuItem(element.name, element.id, onClick, isSelected);

          category.forEach(c => {
            let categoryMenuItem = this.gists.find((cat: CollapsibleMenuItem) => cat.label === c);
            if (!categoryMenuItem) {
              categoryMenuItem = new CollapsibleMenuItem(c, "", null, null, null, false);
              this.gists.push(categoryMenuItem);
            }

            categoryMenuItem.subItems.push(menuItem);
          });
          this.gists = this.gists.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        });
        this.gistsCopy = this.deepCopyArray(this.gists);
      }
    },
      error => {
        // TODO: handle detector route not found
        if (error && error.status === 404) {
        }
      });

    if (this.documentationRepoSettings.isStaging) { this.docsBranch = this.documentationRepoSettings.stagingBranch; }
    this.getDocCategories().subscribe(content => {
      let categories = [];
      content.folders.forEach(element => {
        let cn = element.split('/').at(-1);
        if (cn != this.documentationRepoSettings.root && cn.at(0) != "_")
          categories.push(cn)
      });
      let fileNamesObservables = [];
      categories.forEach(cat => {
        fileNamesObservables.push(this.getDocFiles(cat));
        let catItem = new CollapsibleMenuItem(cat, "", null, null, null, false);
        this.docs.push(catItem);
      });
      forkJoin(fileNamesObservables).subscribe(files => {
        let fileNames = []
        files.forEach((f: any, filesIndex) => {
          let folderList = [];
          f.folders.forEach(element => {
            let fn = element.split('/').at(-1);
            let parent = element.split('/').at(-2);
            if ((fn != categories[filesIndex] || fn === parent) && fn.at(0) != "_")
              folderList.push(fn);
          });
          fileNames.push(folderList);
          fileNames[filesIndex].forEach(d => {
            this.documentList.addDocument(`${categories[filesIndex]}:${d}`);
            let docItem: CollapsibleMenuItem = {
              label: d,
              id: "",
              onClick: () => {
                this.navigateTo(`docs/${categories[filesIndex]}/${d}`);
              },
              expanded: false,
              subItems: null,
              isSelected: () => {
                return this.currentRoutePath && this.currentRoutePath.join('/') === `docs/${categories[filesIndex]}/${d}`;
              },
              icon: null
            };
            this.docs[this.docs.findIndex(x => { return x.label === categories[filesIndex] })].subItems.push(docItem)
          });
        });
        this.docsCopy = this.deepCopyArray(this.docs);
      });
    });
  }

  private createWorkflowMenuItem(element: DetectorMetaData, categories: CollapsibleMenuItem[]) {
    const onClick = () => {
      this._telemetryService.logEvent(TelemetryEventNames.SideNavigationItemClicked, { "elementId": element.id });
      const path = `workflows/${element.id}`;
      this.navigateTo(path);
    };

    const isSelected = () => {
      return this.currentRoutePath && this.currentRoutePath.join('/') === `workflows/${element.id}`;
    };

    let category = "Uncategorized";
    if (element.category) {
      category = element.category;
    }

    const menuItem = new CollapsibleMenuItem(element.name, element.id, onClick, isSelected, null, false, [], element.supportTopicList && element.supportTopicList.length > 0 ? element.supportTopicList.map(x => x.id).join(",") : null);
    let categoryMenuItem = this.workflowCategories.find((cat: CollapsibleMenuItem) => cat.label === category);

    //Expand for analysis or pinned detectors section
    if (!categoryMenuItem) {
      categoryMenuItem = new CollapsibleMenuItem(category, "", null, null, null, false);
      categories.push(categoryMenuItem);
    }
    categoryMenuItem.subItems.push(menuItem);
  }

  private createDetectorMenuItem(element: DetectorMetaData, categories: CollapsibleMenuItem[], isAnalysis: boolean = false, isFavoriteDetector: boolean = false) {
    const onClick = () => {
      if (isFavoriteDetector) {
        this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorClicked, { 'detectorId': element.id, 'location': 'SideNav' });
      }
      this._telemetryService.logEvent(TelemetryEventNames.SideNavigationItemClicked, { "elementId": element.id });

      const path = isAnalysis ? `analysis/${element.id}` : `detectors/${element.id}`;
      this.navigateTo(path);
    };

    const isSelected = () => {
      if (isAnalysis) {
        this.getCurrentRoutePath();
        return this.currentRoutePath && this.currentRoutePath.join('/') === `analysis/${element.id}`;
      } else {
        return this.currentRoutePath && this.currentRoutePath.join('/') === `detectors/${element.id}`;
      }
    };

    let category = "Uncategorized";
    if (isAnalysis) {
      category = "Analysis";
    } else if (element.category) {
      category = element.category;
    }

    const menuItem = new CollapsibleMenuItem(element.name, element.id, onClick, isSelected, null, false, [], element.supportTopicList && element.supportTopicList.length > 0 ? element.supportTopicList.map(x => x.id).join(",") : null);

    let categoryMenuItem = categories.find((cat: CollapsibleMenuItem) => cat.label === category);

    //Expand for analysis or pinned detectors section
    if (!categoryMenuItem) {
      categoryMenuItem = new CollapsibleMenuItem(category, "", null, null, null, isAnalysis || isFavoriteDetector);
      categories.push(categoryMenuItem);
    }
    categoryMenuItem.subItems.push(menuItem);
  }


  initializeFavoriteDetectors() {
    this._diagnosticApiService.getDetectors().subscribe(detectors => {
      this._userSettingService.getUserSetting().subscribe(userSetting => {
        this.favoriteDetectors = [];
        this.favoriteDetectorsCopy = [];
        const favoriteDetectorIds = Object.keys(userSetting.favoriteDetectors);

        const favoriteDetectorsMetaData = detectors.filter(detector => {
          return favoriteDetectorIds.indexOf(detector.id) > -1 && userSetting.favoriteDetectors[detector.id].type === detector.type;
        });
        favoriteDetectorsMetaData.forEach(element => {
          this.createDetectorMenuItem(element, this.favoriteDetectors, element.type === DetectorType.Analysis, true);
        });

        this.favoriteDetectors = this.favoriteDetectors.sort((a, b) => a.label === 'Uncategorized' ? 1 : (a.label > b.label ? 1 : -1));
        this.favoriteDetectorsCopy = this.deepCopyArray(this.favoriteDetectors);
      });
    });
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  openDocumentation() {
    window.open('https://app-service-diagnostics-docs.azurewebsites.net/api/Diagnostics.ModelsAndUtils.Models.Response.html#extensionmethods', '_blank');
  }


  isSectionHeaderSelected(path: string, matchFullPath: boolean = true) {
    if (matchFullPath)
      return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase() === path.toLowerCase();
    else
      return this.currentRoutePath && this.currentRoutePath.join('/').toLowerCase().startsWith(path.toLowerCase());
  };


  updateSearch(searchTerm: string) {
    if (searchTerm === null || searchTerm === undefined) return;
    if (searchTerm.length < 3 && searchTerm.length > 0) return;
    this.searchValue = searchTerm;
    this.categories = this.updateMenuItems(this.categoriesCopy, searchTerm);
    this.gists = this.updateMenuItems(this.gistsCopy, searchTerm);
    this.favoriteDetectors = this.updateMenuItems(this.favoriteDetectorsCopy, searchTerm);
    this.tools = this.updateMenuItems(this.toolsCopy, searchTerm);

    const subDetectorCount = this.contSubMenuItems(this.categories);
    const subGistCount = this.contSubMenuItems(this.gists);
    const foundToolsCount = this.tools.length;
    const detectorAriaLabel = `${subDetectorCount > 0 ? subDetectorCount : 'No'} ${subDetectorCount > 1 ? 'Detectors' : 'Detector'}`;
    const gistAriaLabel = `${subGistCount > 0 ? subGistCount : 'No'} ${subGistCount > 1 ? 'Gists' : 'Gist'}`;
    const toolsAriaLabel = `${foundToolsCount > 0 ? foundToolsCount : 'No'} ${foundToolsCount > 1 ? 'Tools' : 'Tool'}`;
    this.searchAriaLabel = `${detectorAriaLabel}, ${gistAriaLabel} And ${toolsAriaLabel} Found for ${this.searchValue}`;
  }

  //Only support filtering for two layer menu-item
  private updateMenuItems(items: CollapsibleMenuItem[], searchValue: string): CollapsibleMenuItem[] {
    const categories = [];
    for (const item of items) {
      const copiedItem = { ...item };
      copiedItem.expanded = false;
      if (copiedItem.subItems) {
        const subItems = [];
        for (const subItem of copiedItem.subItems) {
          if (this.checkMenuItemMatchesWithSearchTerm(subItem, searchValue)) {
            subItems.push(subItem);
          }
        }
        copiedItem.subItems = subItems;
      }
      if (this.checkMenuItemMatchesWithSearchTerm(copiedItem, searchValue) || (Array.isArray(copiedItem.subItems) && copiedItem.subItems.length > 0)) {
        if (Array.isArray(copiedItem.subItems) && copiedItem.subItems.length > 0) {
          copiedItem.expanded = true;
        }
        categories.push(copiedItem);
      }
    }
    return categories;
  }

  private deepCopyArray(items: CollapsibleMenuItem[]): CollapsibleMenuItem[] {
    if (!Array.isArray(items)) return null;
    const res = [];
    for (const item of items) {
      const copiedSubItems = this.deepCopyArray(item.subItems);
      const copiedItem = { ...item };
      copiedItem.subItems = copiedSubItems;
      res.push(copiedItem);
    }
    return res;
  }

  private checkMenuItemMatchesWithSearchTerm(item: CollapsibleMenuItem, searchValue: string) {
    if (searchValue == null || searchValue.length === 0) return true;
    return StringUtilities.IndexOf(item.label.toLowerCase(), searchValue.toLowerCase()) >= 0 || StringUtilities.IndexOf(item.id.toLowerCase(), searchValue.toLowerCase()) >= 0;
  }

  private contSubMenuItems(items: CollapsibleMenuItem[]): number {
    let count = 0;
    for (let item of items) {
      if (item.subItems && item.subItems.length > 0) {
        count = count + item.subItems.length;
      }
    }
    return count;
  }

}

@Pipe({
  name: 'search',
  pure: false
})
export class SearchMenuPipe implements PipeTransform {
  transform(items: CollapsibleMenuItem[], searchString: string) {
    return searchString && items ? items.filter(item => item.label.toLowerCase().indexOf(searchString.toLowerCase()) >= 0) : items;
  }
}
