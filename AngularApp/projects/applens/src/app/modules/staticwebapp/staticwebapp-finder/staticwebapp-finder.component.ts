import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ObserverStaticWebAppInfo } from '../../../shared/models/observer';
import { ObserverService } from '../../../shared/services/observer.service';
import { StartupService } from '../../../shared/services/startup.service';

@Component({
  selector: 'staticwebapp-finder',
  templateUrl: './staticwebapp-finder.component.html',
  styleUrls: ['./staticwebapp-finder.component.scss']
})
export class StaticWebAppFinderComponent implements OnInit {
  defaultHostNameOrAppName: string;
  loading: boolean = true;
  error: string;

  matchingSites: ObserverStaticWebAppInfo[] = [];

  contentHeight: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _observerService: ObserverService
  ) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.defaultHostNameOrAppName = this._route.snapshot.params['staticwebapp'];

    this._observerService
      .getStaticWebApp(this.defaultHostNameOrAppName)
      .subscribe(
        (observerStaticWebAppResponse) => {
          if (
            observerStaticWebAppResponse.details.toString() ==
            'Unable to fetch data from Observer API : GetStaticWebApp'
          ) {
            this.error = `There was an error trying to find static web app with default host name or app name ${this.defaultHostNameOrAppName}`;
            this.loading = false;
          } else if (observerStaticWebAppResponse.details.length === 1) {
            let matchingSite = observerStaticWebAppResponse.details[0];
            this.navigateToSite(matchingSite);
          } else if (observerStaticWebAppResponse.details.length > 1) {
            this.matchingSites = observerStaticWebAppResponse.details;
          }

          this.loading = false;
        },
        (error: Response) => {
          this.error =
            error.status == 404
              ? `Static Web App with the default host name or app name ${this.defaultHostNameOrAppName} was not found`
              : `There was an error trying to find static web app with the default host name or app name ${this.defaultHostNameOrAppName}`;
          this.loading = false;
        }
      );
  }

  navigateToSite(matchingSite: ObserverStaticWebAppInfo) {
    let resourceArray: string[] = [
      'subscriptions',
      matchingSite.SubscriptionName,
      'resourceGroups',
      matchingSite.ResourceGroupName,
      'providers',
      'Microsoft.Web',
      'staticSites',
      matchingSite.Name
    ];

    this._router.navigate(resourceArray, { queryParamsHandling: 'preserve' });
  }
}
