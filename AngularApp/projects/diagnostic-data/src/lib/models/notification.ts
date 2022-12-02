import {
  DetectorResponse,
  DiagnosticData,
  HealthStatus,
  Rendering,
  RenderingType
} from './detector';
import { Solution } from '../components/solution/solution';
import * as momentNs from 'moment';

export class NotificationDetail {
  Status: HealthStatus;
  Title: string;
  Description: string;
  Solution: Solution;
  IsExpanded: boolean;
  StartDate: Date;
  ExpiryDate: Date;

  constructor(
    status: string,
    title: string,
    description?: string,
    solution?: Solution,
    isExpanded?: boolean,
    startDate?: Date,
    expiryDate?: Date
  ) {
    this.Status = HealthStatus[status];
    this.Title = title;
    this.Description = description;
    this.Solution = solution;
    this.IsExpanded = isExpanded == null ? true : isExpanded;
    this.StartDate = startDate;
    this.ExpiryDate = expiryDate;
  }
}

export class NotificationUtils {
  public static parseNotificationRendering(
    data: DiagnosticData
  ): NotificationDetail[] {
    let notificationList: NotificationDetail[] = [];
    const statusColumnIndex = 0;
    const titleColumnIndex = 1;
    const descriptionColumnIndex = 2;
    const solutionColumnIndex = 3;
    const expandedColumnIndex = 4;
    const StartDateColumnIndex = 5;
    const EndDateColumnIndex = 6;

    const datatable = data.table;
    for (let i: number = 0; i < datatable.rows.length; i++) {
      const row = datatable.rows[i];
      const status = <string>row[statusColumnIndex];
      const title = row[titleColumnIndex];
      const description = row[descriptionColumnIndex];
      const isExpanded = row[expandedColumnIndex].toLowerCase() === 'true';
      let solution = null;
      let notification = null;

      const startTime = momentNs.utc(row[StartDateColumnIndex]);
      const endTime = momentNs.utc(row[EndDateColumnIndex]);

      if (
        momentNs.duration(momentNs.utc().diff(startTime)).asMinutes() < 0 ||
        momentNs.duration(momentNs.utc().diff(endTime)).asMinutes() > 0
      ) {
        continue;
      }

      if (solutionColumnIndex < row.length) {
        solution = <Solution>JSON.parse(row[solutionColumnIndex]);
      }

      if (
        (notification = notificationList.find(
          (notification) => notification.Title === title
        )) == undefined
      ) {
        notification = new NotificationDetail(
          status,
          title,
          description,
          solution,
          isExpanded,
          startTime.toDate(),
          endTime.toDate()
        );
        notificationList.push(notification);
      }
    }

    return notificationList;
  }

  public static isTimeRangeValidated(data: DiagnosticData) {
    const StartDateColumnIndex = 5;
    const EndDateColumnIndex = 6;

    if (
      (<Rendering>data.renderingProperties).type !==
        RenderingType.Notification ||
      data.table == null ||
      data.table.rows == null ||
      data.table.rows.length === 0 ||
      data.table.rows[0].length < EndDateColumnIndex + 1
    ) {
      return false;
    }

    const startTime = momentNs.utc(data.table.rows[0][StartDateColumnIndex]);
    const endTime = momentNs.utc(data.table.rows[0][EndDateColumnIndex]);

    return (
      momentNs.duration(momentNs.utc().diff(startTime)).asMinutes() >= 0 &&
      momentNs.duration(momentNs.utc().diff(endTime)).asMinutes() <= 0
    );
  }
}
