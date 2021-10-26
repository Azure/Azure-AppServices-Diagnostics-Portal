import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObserverService } from '../../../shared/services/observer.service';
import { StartupService } from '../../../shared/services/startup.service';

@Component({
  selector: 'containerapp-finder',
  templateUrl: './containerapp-finder.component.html',
  styleUrls: ['./containerapp-finder.component.scss']
})
export class ContainerAppFinderComponent implements OnInit {

  siteName: string;
  loading: boolean = true;
  error: string;

  matchingSites: Observer.ObserverContainerAppInfo[] = [];

  contentHeight: string;

  constructor(private _route: ActivatedRoute, private _router: Router, private _observerService: ObserverService, private _startupService: StartupService) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.siteName = this._route.snapshot.params['containerapp'];

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
      this.error = error.status == 404 ? `Container App with the name ${this.siteName} was not found` : `There was an error trying to find container app ${this.siteName}`;
      this.loading = false;
    });
  }

  navigateToSite(matchingSite: Observer.ObserverContainerAppInfo) {
    let resourceArray: string[] = [
      'subscriptions', matchingSite.SubscriptionName,
      'resourceGroups', matchingSite.ResourceGroupName,
      'providers', 'Microsoft.Web',
      'containerApps', matchingSite.ContainerAppName];

    // resourceArray.push('home');
    // resourceArray.push('category');

    this._router.navigate(resourceArray, { queryParamsHandling: 'preserve' });
  }

}
