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
              this.detectorCategoryMapping.push({ detectorId: detector.id.toLowerCase(), categoryId: categoryId.toLowerCase() });
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
      const linkURL = el.getAttribute && el.getAttribute('href');
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
      // Don't treat the url as relative to the current URL if the 
      // hyper link passed is a full resourceId
      //

      if (linkURL.toLowerCase().indexOf('subscriptions/') === -1
        && linkURL.toLowerCase().indexOf('/resourcegroups/') === -1) {
        navigationExtras.relativeTo = activatedRoute;
      }

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
}
