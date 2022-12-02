import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { AadAuthGuard } from './shared/auth/aad-auth-guard.service';
import { environment } from '../environments/environment';
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import { GenericThemeService } from 'diagnostic-data';
import { UserSettingService } from './modules/dashboard/services/user-setting.service';
import { ApplensThemeService } from './shared/services/applens-theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  env = environment;
  showBanner = true;
  constructor(
    private _adalService: AdalService,
    public _authGuardService: AadAuthGuard,
    public _themeService: ApplensThemeService,
    private _userSettingService: UserSettingService
  ) {
    if (environment.adal.enabled) {
      this._adalService.init({
        clientId: environment.adal.clientId,
        popUp: window.parent !== window,
        redirectUri: `${window.location.origin}`,
        postLogoutRedirectUri: `${window.location.origin}/login`,
        cacheLocation: 'localStorage'
      });
    }

    this._userSettingService.currentThemeSub.subscribe((theme) => {
      this._themeService.setActiveTheme(theme);
    });
  }

  ngOnInit() {
    initializeIcons(
      'https://static2.sharepointonline.com/files/fabric/assets/icons/'
    );
  }

  hideBanner() {
    this.showBanner = false;
  }
}
