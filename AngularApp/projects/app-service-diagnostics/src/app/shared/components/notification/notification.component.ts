import { Component, OnInit } from '@angular/core';
import { IMessageBarStyles, IStyle } from 'office-ui-fabric-react';
import { AnonymousSubject } from 'rxjs/Rx';
import { NotificationService } from '../../../shared-v2/services/notification.service';

@Component({
  selector: 'notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent implements OnInit {
  constructor(public notificationService: NotificationService) {}

  styles: any = {
    root: {
      height: '49px',
      backgroundColor: '#F0F6FF',
      marginBottom: '13px'
    }
  };

  ngOnInit() {
    if (
      this.notificationService.activeNotification &&
      this.notificationService.activeNotification.color
    ) {
      this.styles.root.backgroundColor =
        this.notificationService.activeNotification.color;
    }
  }
}
