import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { DiagnosticService, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { CategoryService } from '../../shared-v2/services/category.service';
import { Category } from '../../shared-v2/models/category';
import { ResourceService } from '../../shared-v2/services/resource.service';

const isAbsolute = new RegExp('(?:^[a-z][a-z0-9+.-]*:|\/\/)', 'i');

@Injectable()
export class LinkInterceptorService {

  private categories: Category[] = [];
  constructor(private _diagnosticService: DiagnosticService, private _categoryService: CategoryService, private _resourceService: ResourceService) {
    this._diagnosticService.getDetectors().subscribe(detectors => {
      detectors.forEach(d => {
        console.log(d.id + ' = ' + d.category);
      });
    });

    this._categoryService.categories.subscribe(categories => {
      if (categories.length > 0) {
        this.categories = categories;
        this.categories.forEach(c => { console.log(c.name + " ---- " + c.id) });
      }
    });
  }

  interceptLinkClick(e: Event, router: Router, detector: string, telemetryService: TelemetryService, activatedRoute: ActivatedRoute) {
    if (e.target && (e.target as any).tagName === 'A') {

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
}
