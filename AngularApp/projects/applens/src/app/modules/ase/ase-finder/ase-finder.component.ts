import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObserverService } from '../../../shared/services/observer.service';
import { ObserverAseInfo } from '../../../shared/models/observer';

@Component({
  selector: 'ase-finder',
  templateUrl: './ase-finder.component.html',
  styleUrls: ['./ase-finder.component.scss']
})
export class AseFinderComponent implements OnInit {
  hostingEnvironment: string;
  loading: boolean = true;
  matchingAse: ObserverAseInfo;
  error: string;
  contentHeight: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _observerService: ObserverService
  ) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.hostingEnvironment = this._route.snapshot.params['hostingEnvironment'];

    this._observerService.getAse(this.hostingEnvironment).subscribe(
      (observerAseResponse) => {
        if (observerAseResponse && observerAseResponse.details) {
          this.matchingAse = observerAseResponse.details;
          this.navigateToAse(this.matchingAse);
        }

        this.loading = false;
      },
      (error: Response) => {
        this.error =
          error.status === 404
            ? `ASE ${this.hostingEnvironment} not found`
            : `Error trying to retrieve ASE ${this.hostingEnvironment}. Please try again`;
        this.loading = false;
      }
    );
  }

  navigateToAse(matchingAse: ObserverAseInfo) {
    let resourceArray: string[] = [
      'subscriptions',
      matchingAse.CustomerSubscriptionId,
      'resourceGroups',
      matchingAse.ResourceGroupName,
      'providers',
      'Microsoft.Web',
      'hostingEnvironments',
      matchingAse.Name
    ];

    this._router.navigate(resourceArray);
  }
}
