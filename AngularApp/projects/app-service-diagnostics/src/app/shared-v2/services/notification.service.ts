import { Injectable } from '@angular/core';
import { MessageBarType } from 'office-ui-fabric-react';
import { LoggingService } from '../../shared/services/logging/logging.service';

@Injectable()
export class NotificationService {
  activeNotification: Notification;

  notifications: Notification[] = [];

  constructor(private _logger: LoggingService) {}

  dismiss() {
    this.activeNotification = null;
    setTimeout(() => {
      this.updateActiveNotification();
    }, 2000);
  }

  pushNotification(notification: Notification) {
    this.notifications.push(notification);
    this.updateActiveNotification();
  }

  updateActiveNotification() {
    if (!this.activeNotification) {
      this.activeNotification = this.notifications.pop();
    }
  }

  currentNotificationAction() {
    this._logger.LogClickEvent(
      this.activeNotification.title,
      'Notifications',
      'Notifications'
    );
    if (this.activeNotification.action) {
      this.activeNotification.action();
      this.dismiss();
    }
  }
}

export class Notification {
  title: string;
  action: Function;
  type: MessageBarType;
  icon: string;
  color: string;
  disableDismiss: boolean;

  constructor(
    title: string,
    action: Function,
    type?: MessageBarType,
    icon?: string,
    color?: string,
    disableDismiss?: boolean
  ) {
    this.title = title;
    this.action = action;
    this.type = type ? type : MessageBarType.info;
    this.icon = icon ? icon : 'fa-info-circle';
    this.color = color ? color : '#dddddd';
    this.disableDismiss =
      disableDismiss == undefined || disableDismiss == null
        ? false
        : disableDismiss;
  }
}
