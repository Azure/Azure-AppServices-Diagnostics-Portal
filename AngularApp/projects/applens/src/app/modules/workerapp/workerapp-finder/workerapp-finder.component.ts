import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObserverService } from '../../../shared/services/observer.service';
import { StartupService } from '../../../shared/services/startup.service';

@Component({
  selector: 'workerapp-finder',
  templateUrl: './workerapp-finder.component.html',
  styleUrls: ['./workerapp-finder.component.scss']
})
export class WorkerAppFinderComponent implements OnInit {

  siteName: string;
  loading: boolean = true;
  error: string;

  matchingSites: Observer.ObserverWorkerAppInfo[] = [];

  contentHeight: string;

  constructor(private _route: ActivatedRoute, private _router: Router, private _observerService: ObserverService, private _startupService: StartupService) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.siteName = this._route.snapshot.params['workerapp'];

    this._observerService.getWorkerApp(this.siteName).subscribe(observerWorkerAppResponse => {
      if (observerWorkerAppResponse.details.toString() == "Unable to fetch data from Observer API : GetWorkerApp"){
        this.error = `There was an error trying to find worker app ${this.siteName}`;
        this.loading = false;  
      }
      else if (observerWorkerAppResponse.details.length === 1) {
        let matchingSite = observerWorkerAppResponse.details[0];
        this.navigateToSite(matchingSite);
      }
      else if (observerWorkerAppResponse.details.length > 1) {
        this.matchingSites = observerWorkerAppResponse.details;
      }

      this.loading = false;
    }, (error: Response) => {
      this.error = error.status == 404 ? `Worker App with the name ${this.siteName} was not found` : `There was an error trying to find worker app ${this.siteName}`;
      this.loading = false;
    });
  }

  navigateToSite(matchingSite: Observer.ObserverWorkerAppInfo) {
    let resourceArray: string[] = [
      'subscriptions', matchingSite.SubscriptionName,
      'resourceGroups', matchingSite.ResourceGroupName,
      'providers', 'Microsoft.Web',
      'workerApps', matchingSite.WorkerAppName];

    // resourceArray.push('home');
    // resourceArray.push('category');

    this._router.navigate(resourceArray, { queryParamsHandling: 'preserve' });
  }

}
