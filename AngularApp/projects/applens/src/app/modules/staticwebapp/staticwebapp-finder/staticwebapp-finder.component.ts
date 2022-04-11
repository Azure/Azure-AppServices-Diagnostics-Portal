import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ObserverService } from "../../../shared/services/observer.service";
import { StartupService } from "../../../shared/services/startup.service";

@Component({
    selector: 'staticwebapp-finder',
    templateUrl: './staticwebapp-finder.component.html',
    styleUrls: ['./staticwebapp-finder.component.scss']
})
export class StaticWebAppFinderComponent implements OnInit {

    siteName: string;
    loading: boolean = true;
    error: string;
  
    matchingSites: Observer.ObserverContainerAppInfo[] = [];
  
    contentHeight: string;
  
    constructor(private _route: ActivatedRoute, private _router: Router, private _observerService: ObserverService, private _startupService: StartupService) {
      this.contentHeight = window.innerHeight + 'px';
    }
  
    ngOnInit() {
      this.siteName = this._route.snapshot.params['staticwebapp'];
  
      this._observerService.getContainerApp(this.siteName).subscribe(observerContainerAppResponse => {
        if (observerContainerAppResponse.details.toString() == "Unable to fetch data from Observer API : GetContainerApp"){
          this.error = `There was an error trying to find container app ${this.siteName}`;
          this.loading = false;  
        }
        else if (observerContainerAppResponse.details.length === 1) {
          let matchingSite = observerContainerAppResponse.details[0];
          this.navigateToSite(matchingSite);
        }
        else if (observerContainerAppResponse.details.length > 1) {
          this.matchingSites = observerContainerAppResponse.details;
        }
  
        this.loading = false;
      }, (error: Response) => {
        this.error = error.status == 404 ? `Static Web App with the name ${this.siteName} was not found` : `There was an error trying to find static web app ${this.siteName}`;
        this.loading = false;
      });
    }
  
    navigateToSite(matchingSite: Observer.ObserverContainerAppInfo) {
      let resourceArray: string[] = [
        'subscriptions', matchingSite.SubscriptionName,
        'resourceGroups', matchingSite.ResourceGroupName,
        'providers', 'Microsoft.Web',
        'staticSites', matchingSite.ContainerAppName];
  
      // resourceArray.push('home');
      // resourceArray.push('category');
  
      this._router.navigate(resourceArray, { queryParamsHandling: 'preserve' });
    }
  
  }