import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../startup/services/auth.service';
import { StartupInfo } from '../../models/portal';

@Component({
  selector: 'generic-comms',
  templateUrl: './generic-comms.component.html',
  styleUrls: ['./generic-comms.component.scss']
})
export class GenericCommsComponent implements OnInit {
  autoExpand: boolean = false;
  showAlert: boolean = false;

  constructor(private _authService: AuthService) {}

  ngOnInit() {
    this._authService.getStartupInfo().subscribe((startupInfo: StartupInfo) => {
      // For now, only showing alert in case submission
      this.showAlert =
        startupInfo.supportTopicId && startupInfo.supportTopicId != '';
      this.autoExpand =
        startupInfo.supportTopicId && startupInfo.supportTopicId != '';
    });
  }
}
