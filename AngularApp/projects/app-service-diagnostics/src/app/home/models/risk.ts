import {
  DiagnosticData,
  HealthStatus,
  Insight,
  LoadingStatus,
  Rendering,
  RenderingType
} from 'diagnostic-data';
import { DetectorResponse } from 'diagnostic-data';
import { MessageBarType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';

export interface RiskTile {
  id: string;
  title: string;
  riskInfo: RiskInfo;
  loadingStatus: LoadingStatus;
  enableForCaseSubmissionFlow?: boolean;
  linkText?: string;
}

export interface NotificationMessageBar {
  id: string;
  panelTitle: string;
  showNotification: boolean;
  notificationMessage?: string;
  status?: HealthStatus;
  linkText?: string;
}

export interface RiskInfo {
  [propName: string]: HealthStatus;
}

export class RiskHelper {
  public static convertHealthStatusToMessageType(
    healthStatus: HealthStatus
  ): MessageBarType {
    switch (healthStatus) {
      case HealthStatus.Critical:
        return MessageBarType.error;

      case HealthStatus.Warning:
        return MessageBarType.severeWarning;

      case HealthStatus.Info:
        return MessageBarType.info;

      case HealthStatus.Success:
        return MessageBarType.success;

      default:
        return MessageBarType.info;
    }
  }

  public static convertResponseToRiskInfo(res: DetectorResponse): RiskInfo {
    let riskInfo: RiskInfo = {};
    let notificationList = res.dataset.filter(
      (set) =>
        (<Rendering>set.renderingProperties).type === RenderingType.Notification
    );

    const statusColumnIndex = 0;
    const titleColumnIndex = 1;

    for (let notification of notificationList) {
      const data = notification.table;

      for (let i: number = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        const notificationStatus = <string>row[statusColumnIndex];
        const insightName = row[titleColumnIndex];

        if (notificationStatus !== undefined && notificationStatus !== null) {
          riskInfo[insightName] = HealthStatus[notificationStatus];
        }
      }
    }
    return riskInfo;
  }
}
