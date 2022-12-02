import { Component } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {
  DiagnosticData,
  HealthStatus,
  InsightsRendering,
  NotificationRendering,
  RenderingType
} from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import {
  NotificationDetail,
  NotificationUtils
} from '../../models/notification';

@Component({
  selector: 'notification-rendering',
  templateUrl: './notification-rendering.component.html',
  styleUrls: ['./notification-rendering.component.scss']
})
export class NotificationRenderingComponent extends DataRenderBaseComponent {
  DataRenderingType = RenderingType.Notification;
  renderingProperties: NotificationRendering;
  public notifications: NotificationDetail[];
  NotificationStatus = HealthStatus;

  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <NotificationRendering>data.renderingProperties;
    this.notifications = NotificationUtils.parseNotificationRendering(data);
  }

  hasSolution(notification: NotificationDetail) {
    return notification.Solution != null;
  }
}
