import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ObserverService } from '../../shared/services/observer.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'armresourceurl-finder',
  templateUrl: './armresourceurlfinder.component.html',
  styleUrls: ['./armresourceurlfinder.component.scss']
})
export class ArmResourceUrlFinder implements OnInit {

  loading: boolean = true;
  error: string;
  contentHeight: string;
  providerName: string;
  serviceName: string;
  resourceName: string;
  feature: string;
  featureId: string;
  armUrl : string;

  constructor(private _route: ActivatedRoute, private _router: Router, private _observerService: ObserverService) {
    this.contentHeight = window.innerHeight + 'px';
  }

  ngOnInit() {
    this.providerName = this._route.snapshot.params['provider'];
    this.serviceName = this._route.snapshot.params['service'];
    this.resourceName = this._route.snapshot.params['name'];
    this.feature = this._route.snapshot.params['feature'];
    this.featureId = this._route.snapshot.params['featureid'];

    this._observerService.getArmResourceUrl(this.providerName, this.serviceName, this.resourceName).subscribe(_armUrl => {
      this.loading = false;
      this.armUrl = _armUrl;
      this.navigateToArmUrl(this.armUrl);
    }, (err: Response) => {
      this.loading = false;
      this.error = err["error"];
    });
  }

  navigateToArmUrl(armUrl: string) {
    let resourceArray: string[] = [armUrl];
    if(this.feature && this.feature !== '' && this.featureId && this.featureId !== '')
    {
      resourceArray.push(this.feature);
      resourceArray.push(this.featureId);
    }

    this._router.navigate(resourceArray, { queryParamsHandling: "preserve" });
  }

}
