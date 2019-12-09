import { Component } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { environment } from '../environments/environment';
import * as Highcharts from 'highcharts';
import { DialogType } from 'office-ui-fabric-react/lib/Dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  env = environment;
  constructor(private _adalService: AdalService) {
    if (environment.adal.enabled){
      this._adalService.init({
        clientId: environment.adal.clientId,
        popUp: window.parent !== window,
        redirectUri: `${window.location.origin}`,
        postLogoutRedirectUri: `${window.location.origin}/login`,
        cacheLocation: 'localStorage'
       });
    }
  }
}
