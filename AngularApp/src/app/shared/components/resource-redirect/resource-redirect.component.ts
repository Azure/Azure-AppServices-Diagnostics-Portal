import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../startup/services/auth.service';
import { Router, NavigationExtras } from '@angular/router';
import { WindowService } from '../../../startup/services/window.service';
import { environment } from '../../../../environments/environment';
import { StartupInfo } from '../../models/portal';
import { DemoSubscriptions } from '../../../betaSubscriptions';

@Component({
  selector: 'resource-redirect',
  templateUrl: './resource-redirect.component.html',
  styleUrls: ['./resource-redirect.component.css']
})
export class ResourceRedirectComponent implements OnInit {

  private _newVersionEnabled = true;

  constructor(private _authService: AuthService, private _router: Router, private _windowService: WindowService) { }

  ngOnInit() {
    this.navigateToExperience();
  }

  navigateToExperience() {
    this._authService.getStartupInfo()
      .subscribe(info => {
        if (info && info.resourceId && info.token) {
          let split = info.resourceId.split('/');
          let subscriptionId = split[split.indexOf('subscriptions') + 1];

          // Uncomment to enable only for internal subs
          //this._newVersionEnabled = DemoSubscriptions.betaSubscriptions.indexOf(subscriptionId) >= 0;

          if (this._newVersionEnabled || (info.supportTopicId)) {
            let navigationExtras: NavigationExtras = {
              queryParamsHandling: 'merge',
            };

            let path = 'resource/' + info.resourceId.toLowerCase();
            if (info.supportTopicId) {
              path += `/supportTopicId`;
              navigationExtras.queryParams = {
                supportTopicId: info.supportTopicId,
                pesId: info.pesId
              };
            }

            this._router.navigateByUrl( 
              this._router.createUrlTree([path], navigationExtras)
            );
          }
          else {
            // For now there will be a hard coded destination.
            // In the future we will pass the tool path in with the startup info
            var adjustedResourceId = info.resourceId;
            this._router.navigate(['legacy/' + adjustedResourceId + this.getRouteBasedOnSupportTopicId(info)]);
          }
        }
        else {
          if (!environment.production) {
            this._router.navigateByUrl('/test');
          }
        }
      });
  }

  updateRouteBasedOnAdditionalParameters(route: string, additionalParameters: any): string {
    if (additionalParameters.featurePath) {
      let featurePath: string = additionalParameters.featurePath;
      featurePath = featurePath.startsWith('/') ? featurePath.replace('/', '') : featurePath;

      return `${route}/${featurePath}`
    }
  }

  getRouteBasedOnSupportTopicId(info: StartupInfo): string {

    let path: string;

    // If no support topic id, then default to diagnostics home page
    if (!info.supportTopicId || info.supportTopicId === '') {
      path = '/diagnostics';
    }
    else {
      path = `/supportTopic/${info.supportTopicId}`;
    }

    return path;

  }

}
