import { Injectable } from '@angular/core';
import { TelemetryService } from './telemetry/telemetry.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TelemetryEventNames } from './telemetry/telemetry.common';

const isAbsolute = new RegExp('(?:^[a-z][a-z0-9+.-]*:|//)', 'i');

@Injectable({
  providedIn: 'root'
})
export class LinkInterceptorService {
  constructor() {}

  interceptLinkClick(
    e: Event,
    router: Router,
    detector: string,
    telemetryService: TelemetryService,
    activatedRoute: ActivatedRoute
  ) {
    if (e.target && (e.target as any).tagName === 'A') {
      const el = e.target as HTMLElement;
      const linkURL = el.getAttribute && el.getAttribute('href');
      const linkText = el && el.innerText;

      // Send telemetry event for clicking hyerlink
      const linkClickedProps: { [name: string]: string } = {
        Title: linkText,
        Href: linkURL,
        Detector: detector
      };

      telemetryService.logEvent(
        TelemetryEventNames.LinkClicked,
        linkClickedProps
      );
      let navigationExtras: NavigationExtras = {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
        relativeTo: activatedRoute
      };

      if (linkURL && !isAbsolute.test(linkURL)) {
        e.preventDefault();
        router.navigate([linkURL], navigationExtras);
      } else {
        el.setAttribute('target', '_blank');
      }
    }
  }
}
