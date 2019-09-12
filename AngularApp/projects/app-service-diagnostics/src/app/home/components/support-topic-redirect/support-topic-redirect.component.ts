import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GenericSupportTopicService } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';
import { NotificationService, Notification } from '../../../shared-v2/services/notification.service';

@Component({
  selector: 'support-topic-redirect',
  templateUrl: './support-topic-redirect.component.html',
  styleUrls: ['./support-topic-redirect.component.scss']
})
export class SupportTopicRedirectComponent implements OnInit {

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _supportTopicService: GenericSupportTopicService, private _authService: AuthService,
    private _notificationService: NotificationService) { }

  ngOnInit() {
    this._supportTopicService.getPathForSupportTopic(this._activatedRoute.snapshot.queryParams.supportTopicId, this._activatedRoute.snapshot.queryParams.pesId, this._activatedRoute.snapshot.queryParams.caseSubject).subscribe(res => {
      this._router.navigate([`../${res.path}`], { relativeTo: this._activatedRoute, queryParams: res.queryParams });

      this._authService.getStartupInfo().subscribe(startupInfo => {

        if (startupInfo.source && startupInfo.source.toLowerCase() == ('CaseSubmissionV2-NonContext').toLowerCase()) {
          const notification = new Notification('To continue with case submission, close App Service Diagnostics', null, 'fa-info-circle');
          this._notificationService.pushNotification(notification);
        }
      });
    });
  }
}
