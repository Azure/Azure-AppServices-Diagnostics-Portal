import { Injectable } from '@angular/core';
import { CategoryService } from './category.service';
import { DiagnosticService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { Category } from '../models/category';

const isAbsolute = new RegExp('(?:^[a-z][a-z0-9+.-]*:|\/\/)', 'i');

@Injectable()
export class LinkInterceptorService {

  protected categories: Category[] = [];
  protected detectorCategoryMapping: any[] = [];

  constructor(private _diagnosticService: DiagnosticService, private _categoryService: CategoryService) {

    this._diagnosticService.getDetectors().subscribe(detectors => {
      this._categoryService.categories.subscribe(categories => {
        if (categories.length > 0) {
          this.categories = categories;
          detectors.forEach(detector => {
            let categoryId = this.getCategoryId(detector.category);
            if (categoryId && detector.id) {
              this.detectorCategoryMapping.push({ detectorId: detector.id, categoryId: categoryId });
            }
          });
        }
      });
    });
  }

  interceptLinkClick(e: Event, router: Router, detector: string, telemetryService: TelemetryService, activatedRoute: ActivatedRoute) {
    if (e.target && (e.target as any).tagName === 'A') {

      this.detectorCategoryMapping.forEach(element => {
        console.log(JSON.stringify(element));
      })

      const el = (e.target as HTMLElement);
      let linkURL = el.getAttribute && el.getAttribute('href');
      const linkText = el && el.innerText;

      // Send telemetry event for clicking hyerlink
      const linkClickedProps: { [name: string]: string } = {
        'Title': linkText,
        'Href': linkURL,
        'Detector': detector
      };

      telemetryService.logEvent(TelemetryEventNames.LinkClicked, linkClickedProps);
      let navigationExtras: NavigationExtras = {
        queryParamsHandling: 'preserve',
        preserveFragment: true
      };

      //
      // Don't treat url as relative to the current URL if the 
      // hyper link passed contains a full resourceId
      //

      if (linkURL.toLowerCase().indexOf('subscriptions/') === -1
        && linkURL.toLowerCase().indexOf('/resourcegroups/') === -1) {
        navigationExtras.relativeTo = activatedRoute;
      }

      linkURL = this.addCategoryIdIfNeeded(linkURL);

      if (linkURL && (!isAbsolute.test(linkURL) || linkURL.startsWith('./') || linkURL.startsWith('../'))) {
        e.preventDefault();
        router.navigate([linkURL], navigationExtras);
      } else {
        el.setAttribute('target', '_blank');
      }
    }
  }

  getCategoryId(categoryName: string): string {
    let category = this.categories.find(x => x.name === categoryName);
    if (category) {
      return category.id;
    }
  }

  addCategoryIdIfNeeded(linkURL: string) {
    let entity = this.getEntityIdAndPathFromUrl(linkURL);
    if (entity && entity.detectorId && entity.urlPath) {
      let mapping = this.detectorCategoryMapping.find(x => x.detectorId === entity.detectorId);
      if (mapping && mapping.categoryId) {
        let matchingCategoryId = mapping.categoryId;
        linkURL = linkURL.replace(entity.urlPath, "/categories/" + matchingCategoryId + entity.urlPath);
      }
    }

    return linkURL;
  }

  getEntityIdAndPathFromUrl(linkURL: string): any {
    let retVal = { detectorId: '', urlPath: '' };
    if (linkURL.indexOf('/detectors/') > -1) {
      retVal.detectorId = linkURL.split('/detectors/')[1];
      retVal.urlPath = "/detectors/" + linkURL.split('/detectors/')[1];
    } else if (linkURL.indexOf('/analysis/') > -1) {
      retVal.detectorId = linkURL.split('/analysis/')[1];
      retVal.urlPath = "/analysis/" + linkURL.split('/analysis/')[1];
    } else if (linkURL.indexOf('/workflows/') > -1) {
      retVal.detectorId = linkURL.split('/workflows/')[1];
      retVal.urlPath = "/workflows/" + linkURL.split('/workflows/')[1];
    }

    return retVal;
  }

}
