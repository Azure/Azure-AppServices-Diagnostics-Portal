import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../startup/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'test-input',
  templateUrl: './test-input.component.html',
  styleUrls: ['./test-input.component.scss']
})
export class TestInputComponent implements OnInit {
  token: string;
  resourceId: string;

  readonly tokenSaveName: string = 'app-service-diagnostics-token';
  readonly resourceIdSaveName: string = 'app-service-diagnostics-resourceId';

  constructor(private _authService: AuthService, private _router: Router) {}

  ngOnInit() {
    this.token = localStorage.getItem(this.tokenSaveName);
    this.resourceId = localStorage.getItem(this.resourceIdSaveName);
  }

  submit() {
    this.token = this.token.startsWith('Bearer ')
      ? this.token.replace('Bearer ', '')
      : this.token;
    localStorage.setItem(this.tokenSaveName, this.token);
    localStorage.setItem(this.resourceIdSaveName, this.resourceId);

    this._authService.setStartupInfo(this.token, this.resourceId);

    this._router.navigateByUrl(this.resourceId.toLowerCase());
  }
}
