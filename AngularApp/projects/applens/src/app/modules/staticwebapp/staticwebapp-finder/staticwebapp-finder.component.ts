import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationExtras, Router } from "@angular/router";
import { ObserverService } from "../../../shared/services/observer.service";
import { StartupService } from "../../../shared/services/startup.service";

@Component({
  selector: 'staticwebapp-finder',
  templateUrl: './staticwebapp-finder.component.html',
  styleUrls: ['./staticwebapp-finder.component.scss']
})
export class StaticWebAppFinderComponent implements OnInit {

  defaultHostName: string;
  loading: boolean = true;
  error: string;

  matchingSites: Observer.ObserverStaticWebAppInfo[] = [];

  contentHeight: string;

  constructor(private _route: ActivatedRoute, private _router: Router, private _observerService: ObserverService) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    //Todo, search app by host name and app name
    this.defaultHostName = this._route.snapshot.params['staticwebapp'];

    this._observerService.getStaticWebApp(this.defaultHostName).subscribe(observerStaticWebAppResponse => {
      if (observerStaticWebAppResponse.details.toString() == "Unable to fetch data from Observer API : GetStaticWebApp") {
        this.error = `There was an error trying to find static web app with the host name ${this.defaultHostName}`;
        this.loading = false;
      }
      else if (observerStaticWebAppResponse.details.length === 1) {
        let matchingSite = observerStaticWebAppResponse.details[0];
        this.navigateToSite(matchingSite);
      }
      else if (observerStaticWebAppResponse.details.length > 1) {
        this.matchingSites = observerStaticWebAppResponse.details;
      }

      this.loading = false;
    }, (error: Response) => {
      this.error = error.status == 404 ? `Static Web App with the default host name ${this.defaultHostName} was not found` : `There was an error trying to find static web app with the host name ${this.defaultHostName}`;
      this.loading = false;
    });
  }

  navigateToSite(matchingSite: Observer.ObserverStaticWebAppInfo) {
    let resourceArray: string[] = [
      'subscriptions', matchingSite.SubscriptionName,
      'resourceGroups', matchingSite.ResourceGroupName,
      'providers', 'Microsoft.Web',
      'staticSites', matchingSite.Name];

    const navigationExtra: NavigationExtras = {
      queryParams: { "defaultHostName": this.defaultHostName },
      queryParamsHandling: "merge"
    };

    this._router.navigate(resourceArray, navigationExtra);
  }

}