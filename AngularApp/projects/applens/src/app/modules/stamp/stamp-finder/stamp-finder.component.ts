import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObserverStampResponse } from '../../../shared/models/observer';
import { ObserverService } from '../../../shared/services/observer.service';
import { StartupService } from '../../../shared/services/startup.service';

@Component({
  selector: 'stamp-finder',
  templateUrl: './stamp-finder.component.html',
  styleUrls: ['./stamp-finder.component.scss']
})
export class StampFinderComponent implements OnInit {
  stampName: string;
  loading: boolean = true;
  error: string;

  matchingStamps: ObserverStampResponse[] = [];

  contentHeight: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _observerService: ObserverService,
    private _startupService: StartupService
  ) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.stampName = this._route.snapshot.params['stampName'];

    this._observerService.getStamp(this.stampName).subscribe(
      (observerStampResponse) => {
        if (
          observerStampResponse.details.toString() ==
          'Unable to fetch data from Observer API : GetStamp'
        ) {
          this.error = `There was an error trying to find the stamp ${this.stampName}`;
          this.loading = false;
        } else if (observerStampResponse.details) {
          let matchingStamp = observerStampResponse;
          this.matchingStamps.push(matchingStamp);
          this.navigateToStamp(observerStampResponse);
        }

        this.loading = false;
      },
      (error: Response) => {
        this.error =
          error.status == 404
            ? `Stamp with the name ${this.stampName} was not found`
            : `There was an error trying to find stamp ${this.stampName}`;
        this.loading = false;
      }
    );
  }

  navigateToStamp(matchingStamp: ObserverStampResponse) {
    let resourceArray: string[] = ['stamps', matchingStamp.name];

    this._router.navigate(resourceArray, {
      queryParamsHandling: 'preserve'
    });
  }
}
