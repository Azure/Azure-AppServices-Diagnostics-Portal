import { Injectable } from '@angular/core';
import { DiagnosticService, DetectorMetaData, DetectorType, TelemetryService } from 'diagnostic-data';
import { Category } from '../models/category';
import { Feature, FeatureAction } from '../models/features';
import { ContentService } from './content.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../startup/services/auth.service';
import { SiteService } from '../../shared/services/site.service';
import { CategoryService } from '../../shared-v2/services/category.service';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { StartupInfo } from '../../shared/models/portal';
import { VersionTestService } from '../../fabric-ui/version-test.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToolIds, ToolNames } from '../../shared/models/tools-constants';

const exclusiveDetectorTypes: DetectorType[] = [
  DetectorType.CategoryOverview
];

@Injectable()
export class FeatureService {

  private _detectors: DetectorMetaData[];
  protected _features: Feature[] = [];
  protected categories: Category[] = [];
  public featureSub: BehaviorSubject<Feature[]> = new BehaviorSubject<Feature[]>([]);
  protected isLegacy: boolean;
  protected _featureDisplayOrderSub: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  public diagnosticToolsForNonWeb: any[] = [];
  protected set _featureDisplayOrder(order: any[]) {
    this._featureDisplayOrderSub.next(order);
  }
  constructor(protected _diagnosticApiService: DiagnosticService, protected _contentService: ContentService, protected _router: Router, protected _authService: AuthService,
    protected _logger: TelemetryService, protected _siteService: SiteService, protected _categoryService: CategoryService, protected _activatedRoute: ActivatedRoute, protected _portalActionService: PortalActionService, protected versionTestService: VersionTestService) {
    this.versionTestService.isLegacySub.subscribe(isLegacy => {
      this.isLegacy = isLegacy;
      this._authService.getStartupInfo().subscribe(startupInfo => {
        this.addDiagnosticToolsForNonWeb(startupInfo.resourceId);
        this._diagnosticApiService.getDetectors().subscribe(detectors => {
          this._categoryService.categories.subscribe(categories => {
            this._detectors = detectors;
            if (categories.length > 0) {
              this.categories = categories;
            }
            detectors.forEach(detector => {
              if (this.validateDetectorMetadata(detector)) {
                this._rewriteCategory(detector);
                const categoryId = this.getCategoryIdByCategoryName(detector.category);
                const categoryName = this.getCategoryNameByCategoryId(categoryId);
                if (detector.type === DetectorType.Detector) {
                  this._features.push(<Feature>{
                    id: detector.id,
                    description: detector.description,
                    category: detector.category,
                    featureType: DetectorType.Detector,
                    name: detector.name,
                    clickAction: this._createFeatureAction(detector.name, categoryName, () => {
                      //Remove after A/B test
                      if (this.isLegacy) {
                        if (detector.id === 'appchanges') {
                          this._portalActionService.openChangeAnalysisBlade();
                        } else {
                          this._router.navigateByUrl(`resource${startupInfo.resourceId}/detectors/${detector.id}`);
                        }
                      } else {
                        this.navigatTo(startupInfo, categoryId, detector.id, DetectorType.Detector);
                      }
                    })
                  });
                } else if (detector.type === DetectorType.Analysis) {
                  this._features.push(<Feature>{
                    id: detector.id,
                    description: detector.description,
                    category: categoryName,
                    featureType: DetectorType.Analysis,
                    name: detector.name,
                    clickAction: this._createFeatureAction(detector.name, categoryName, () => {
                      if (this.isLegacy) {
                        this._router.navigateByUrl(`resource${startupInfo.resourceId}/analysis/${detector.id}`);
                      } else {
                        this.navigatTo(startupInfo, categoryId, detector.id, DetectorType.Analysis);
                      }
                    })
                  });
                } else if (detector.type === DetectorType.Workflow) {
                  this._features.push(<Feature>{
                    id: detector.id,
                    description: detector.description,
                    category: categoryName,
                    featureType: DetectorType.Workflow,
                    name: detector.name,
                    clickAction: this._createFeatureAction(detector.name, categoryName, () => {
                      if (this.isLegacy) {
                        this._router.navigateByUrl(`resource${startupInfo.resourceId}/workflows/${detector.id}`);
                      } else {
                        this.navigatTo(startupInfo, categoryId, detector.id, DetectorType.Workflow);
                      }
                    })
                  });
                }
              }
            });
            this.sortFeatures();
            this.featureSub.next(this._features);
          });
        });
      });

      this._contentService.getContent().subscribe(articles => {
        articles.forEach(article => {
          this._features.push(<Feature>{
            id: article.title,
            name: article.title,
            description: article.description,
            category: '',
            featureType: "Documentation",
            clickAction: this._createFeatureAction(article.title, 'Content', () => {
              window.open(article.link, '_blank');
            })
          });
        });
      });
    });
  }

  sortFeatures() {
    this.sortFeaturesBase(this._features);
  }

  public sortFeaturesBase(features: Feature[]) {
    features.sort((a, b) => {
      if (a.featureType !== b.featureType) {
        return a.featureType < b.featureType ? -2 : 2;
      } else {
        return a.name < b.name ? -1 : 1;
      }
    });
  }

  protected _createFeatureAction(name: string, category: string, func: Function): FeatureAction {
    return () => {
      const eventProperties = {
        'Name': name,
        'CategoryName': category
      }
      this._logger.logEvent('FeatureClicked', eventProperties);
      func();
    };
  }

  getFeaturesForCategory(category: Category): Feature[] {
    return this.filterFeaturesForCategory(category, this._features);
  }

  filterFeaturesForCategory(category: Category, features: Feature[]): Feature[] {
    return features.filter(feature => {
      if (feature && feature.category) {
        return feature.category.toLowerCase() === category.name.toLowerCase();
      }
      return false;
    });
  }

  getFeaturesForCategorySub(category: Category): Observable<Feature[]> {
    return this.featureSub.pipe(
      map(features => {
        return this.filterFeaturesForCategory(category, features);
      }));
  }

  getFeatures(searchValue?: string) {
    const featureUnique = this._features.filter((feature, index, array) => {
      return array.findIndex(fea => feature.name === fea.name) === index;
    })

    if (!searchValue || searchValue === '') {
      // return this._features;
      return featureUnique;
    }

    searchValue = searchValue.toLowerCase();
    return featureUnique.filter(feature => {
      //Remove after A/B Test
      if (this.isLegacy) {
        return feature.name.toLowerCase().indexOf(searchValue) != -1
          || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1)
          || (feature.description && feature.description.toLowerCase().indexOf(searchValue) != -1);
      } else {
        return feature.name.toLowerCase().indexOf(searchValue) != -1
          || (feature.category && feature.category.toLowerCase().indexOf(searchValue) != -1);
      }
    });
  }
  getCategoryIdByhDetectorId(detectorId: string): string {
    const detector = this._detectors.find(detector => detector.id === detectorId);
    return this.getCategoryIdByCategoryName(detector.category);
  }

  private getCategoryIdByCategoryName(categoryId: string) {
    const currentCategoryId = this._activatedRoute.root?.firstChild?.firstChild?.firstChild?.firstChild?.firstChild?.snapshot.params["category"];
    return this.getCategoryIdByNameAndCurrentCategory(categoryId, currentCategoryId);
  }

  getCategoryIdByNameAndCurrentCategory(name: string, currentCategoryId?: string): string {
    //Default set to "*",so it will still route to category-summary
    let categoryId: string = this.categories.length > 0 ? this.categories[0].id : "*";
    //If category name is "XXX Tools" and has Diagnostic Tools category,then should belong to Diagnostic Tool Category.For now this should be working in Windows Web App
    if ((name === "Diagnostic Tools" || name === "Support Tools" || name === "Proactive Tools") && this.categories.find(category => category.name === "Diagnostic Tools")) {
      const category = this.categories.find(category => category.name === "Diagnostic Tools");
      categoryId = category.id;
    }
    else if (name && this.categories.find(category => category.name === name)) {
      const category = this.categories.find(category => category.name === name);
      categoryId = category.id;
    }
    //In category-overview page and uncategoried detector,return current categoryId
    else if (currentCategoryId) {
      categoryId = currentCategoryId;
    }
    //In home page,no categoryId in router,return category as availability&perf
    else if (this.categories.find(category => category.name === "Availability and Performance")) {
      const category = this.categories.find(category => category.name === "Availability and Performance");
      categoryId = category.id;
    }
    return categoryId;
  }

  getCategoryNameByCategoryId(id: string): string {
    const category = this.categories.find(c => c.id.toLowerCase() === id.toLowerCase());
    return category ? category.name : "";
  }

  private navigatTo(startupInfo: StartupInfo, category: string, detector: string, type: DetectorType) {
    if (detector === 'appchanges') {
      this._portalActionService.openChangeAnalysisBlade();
      return;
    }
    const isHomepage = this._router.url.toLowerCase().endsWith(startupInfo.resourceId.toLowerCase());
    //If it's in category overview page
    if (!isHomepage) {
      if (type === DetectorType.Detector) {
        this._router.navigateByUrl(`resource${startupInfo.resourceId}/categories/${category}/detectors/${detector}`);
      } else if (type === DetectorType.Analysis) {
        this._router.navigateByUrl(`resource${startupInfo.resourceId}/categories/${category}/analysis/${detector}`);
      } else if (type === DetectorType.Workflow) {
        this._router.navigateByUrl(`resource${startupInfo.resourceId}/categories/${category}/workflows/${detector}`);
      }

    }
    //If it's in Home page,open new category page
    else {
      this._portalActionService.openBladeDiagnoseDetectorId(category, detector, type);
    }
  }

  //Temporary solution for migration from "Best Practices" to "Risk Assessments"
  private _rewriteCategory(detector: DetectorMetaData) {
    const bestPractices = "Best Practices";
    const riskAssessments = "Risk Assessments";
    //If category name is "Best Practice" and only has "Risk Assessment" category then rewrite category to "Risk Assessment"
    if (detector.category === bestPractices && !this.categories.find(category => category.name === bestPractices) && this.categories.find(category => category.name === riskAssessments)) {
      detector.category = riskAssessments;
    }
  }

  private validateDetectorMetadata(detector: DetectorMetaData): boolean {
    if (!this.isLegacy && exclusiveDetectorTypes.findIndex(type => detector.type === type) > -1) return false;
    if (this._features.findIndex(f => f.id === detector.id) > -1) return false;

    return (detector.category && detector.category.length > 0) || (detector.description && detector.description.length > 0)
  }

  protected navigateToTool(resourceId: string, toolId: string, category: string = "DiagnosticTools") {
    const isHomepage = this._router.url.endsWith(resourceId);
    //If in homepage then open second blade for Diagnostic Tool and second blade will continue to open third blade for
    if (isHomepage) {
      this._portalActionService.openBladeDiagnosticToolId(toolId, category);
    } else {
      this._router.navigateByUrl(`resource${resourceId}/categories/DiagnosticTools/tools/${toolId}`);
    }
  }
  private addDiagnosticToolsForNonWeb(resourceId: string) {
    this.diagnosticToolsForNonWeb = [
      {
        type: "microsoft.apimanagement/service",
        item: {
          id: ToolIds.NetworkChecks,
          name: ToolNames.NetworkChecks,
          category: 'Diagnostic Tools',
          description: '',
          featureType: DetectorType.DiagnosticTool,
          clickAction: this._createFeatureAction(ToolNames.NetworkChecks, 'Diagnostic Tools', () => {
            this.navigateToTool(resourceId, ToolIds.NetworkChecks);
          })
        }
      }
    ];
  }
}
