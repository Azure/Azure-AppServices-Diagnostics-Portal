import { Injectable } from '@angular/core';
import { TelemetryService } from './telemetry/telemetry.service';
import { Router, NavigationExtras, ActivatedRoute } from '@angular/router';
import { TelemetryEventNames } from './telemetry/telemetry.common';

const isAbsolute = new RegExp('(?:^[a-z][a-z0-9+.-]*:|\/\/)', 'i');

@Injectable({
  providedIn: 'root'
})
export class LinkInterceptorService {

  constructor() { }

  interceptLinkClick(e: Event, router: Router, source: string, telemetryService: TelemetryService, activatedRoute: ActivatedRoute) {
    if (e.target && (e.target as any).tagName === 'A') {

      const el = (e.target as HTMLElement);
      const linkURL = el.getAttribute && el.getAttribute('href');
      const linkText = el && el.innerText;

      // Send telemetry event for clicking hyerlink
      const linkClickedProps: { [name: string]: string } = {
        'Title': linkText,
        'Href': linkURL,
        'SourcePage': source
      };

      if (telemetryService) {
        telemetryService.logEvent(TelemetryEventNames.LinkClicked, linkClickedProps);
      }

      let navigationExtras: NavigationExtras = {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      };

      //
      // Don't treat url as relative to the current URL if the 
      // hyper link passed contains a full resourceId
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