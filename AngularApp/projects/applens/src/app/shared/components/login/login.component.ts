import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UAParser } from 'ua-parser-js';
import { AdalService } from 'adal-angular4';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  error: string;

  contentHeight: number;

  popUpsBlocked: boolean = false;
  inIFrame: boolean = false;

  interval: any;

  browser: UAParser.IBrowser;

  constructor(private _router: Router, private _adalService: AdalService) {
    this.inIFrame = window.parent !== window;
  }

  ngOnInit() {
    this.contentHeight = window.innerHeight;

    var parser = new UAParser();
    this.browser = parser.getBrowser();

    if (this._adalService.userInfo.authenticated) {
      this.grantAccess();
      return;
    }

    if (this.browser && (this.browser.name === 'IE' || this.browser.name === 'Edge')) {
      this.clearLocalStorage();
    }

    this.login();
  }

  grantAccess(): void {
    this._router.navigate(['']);
  }

  handleError(error: string) {
    let popupDisabledMessage = 'Popup Window is null. This can happen if you are using IE';

    if (error === popupDisabledMessage) {
      this.popUpsBlocked = true;
    }
    else {
      this.error = error;
    }
  }

  login() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    if (this.browser && (this.browser.name === 'IE' || this.browser.name === 'Edge')) {
      this.clearLocalStorage();
    }

    this.interval = setInterval(() => {
      this._adalService.refreshDataFromCache();
      if (this._adalService.userInfo.authenticated) {
        clearInterval(this.interval);
        this.grantAccess();
      }
      else if (this._adalService.userInfo.error) {
        this.handleError(this._adalService.userInfo.error);
      }
    }, 100)

    this._adalService.login();
  }

  clearLocalStorage() {
    let keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key.startsWith('adal')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

  }
}
