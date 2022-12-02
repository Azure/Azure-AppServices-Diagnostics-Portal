import { MetaDataHelper } from '../utilities/metaDataHelper';
import { IDetectorAbnormalTimePeriod } from './detectorresponse';
import { DatePipe } from '@angular/common';

export class IncidentNotification {
  message: string;
  showNotification: boolean;
  status: IncidentStatus;
  startTime: Date;
  endTime: Date;
  html: string;
  type: IncidentType;
  title: string;

  public static fromAbnormalTimePeriod(
    abnormalTimePeriod: IDetectorAbnormalTimePeriod
  ): IncidentNotification {
    const incident = new IncidentNotification();

    incident.startTime = this.getUtcDate(abnormalTimePeriod.startTime);
    incident.endTime = this.getUtcDate(abnormalTimePeriod.endTime);

    incident.message = abnormalTimePeriod.message;
    incident.showNotification =
      MetaDataHelper.getMetaDataValue(
        abnormalTimePeriod.metaData,
        'ShowNotification'
      ).toLowerCase() === 'true';
    incident.status =
      IncidentStatus[
        MetaDataHelper.getMetaDataValue(abnormalTimePeriod.metaData, 'Status')
      ];

    if (incident.status === IncidentStatus.Mitigated) {
      incident.status = IncidentStatus.Resolved;
    }

    incident.type =
      abnormalTimePeriod.source === 'servicehealth'
        ? IncidentType.LSI
        : IncidentType.CRI;

    incident.title = this.getTitle(incident);
    incident.html = this.getHtml(incident);

    return incident;
  }

  private static getUtcDate(dateString: string) {
    const date = new Date(dateString);
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }

  private static getTitle(incident: IncidentNotification): string {
    if (incident.type === IncidentType.LSI) {
      return 'App Service Runtime Incident';
    } else {
      return 'App Service Incident';
    }
  }

  private static getHtml(incident: IncidentNotification): string {
    const template =
      incident.type == IncidentType.LSI
        ? incident.status === IncidentStatus.Active
          ? ActiveLSINotificationTemplate
          : MitigatedLSINotificationTemplate
        : incident.status === IncidentStatus.Active
        ? ActiveCRINotificationTemplate
        : MitigatedCRINotificationTemplate;

    const datePipe: DatePipe = new DatePipe('en-US');

    return template
      .replace(
        /{startTime}/g,
        `${datePipe.transform(incident.startTime, 'HH:mm')} UTC`
      )
      .replace(
        /{startDate}/g,
        datePipe.transform(incident.startTime, 'dd MMM yyyy')
      )
      .replace(
        /{endTime}/g,
        `${datePipe.transform(incident.endTime, 'HH:mm')} UTC`
      )
      .replace(
        /{endDate}/g,
        datePipe.transform(incident.endTime, 'dd MMM yyyy')
      )
      .replace(/{details}/g, incident.message);
  }
}

export enum IncidentStatus {
  Active,
  Mitigated,
  Resolved
}

export enum IncidentType {
  LSI,
  CRI
}

const ActiveLSINotificationTemplate: string = `
    <p><b>Summary of impact:</b> Starting {startTime} on {startDate}, your app may have been impacted due to an App Service outage.
        Microsoft engineers are actively working to resolve this issue.
        Your app experiencing issue is attributed to a limited Azure service outage.
        An alert/technical escalation has already been filed and our Microsoft engineers have been notified.
        You can check the “Diagnose and solve problems” tab for an updated message, once the issue has been mitigated </p>
    <p><b>Preliminary root cause:</b> On {startDate}, engineers determined that instances of a backend service responsible
        for processing requests is returning errors and preventing requests from completing</p>
    <p><b>Next steps:</b> There is nothing actionable on your side at this point.
        Microsoft engineers are actively working to resolve this issue. We sincerely apologize for the impact to affected customers.
        We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future.`;

const MitigatedLSINotificationTemplate: string = `
    <p><b>Summary of impact:</b> Starting {startTime} on {startDate} to {endTime} on {endDate}, your app may have been impacted due to an App Service outage.
        An alert/technical escalation has already been filed and our Microsoft engineers have been notified.</p>
    <p><b>Mitigation:</b> Engineer deployed a hotfix in order to address the impact.</p>
    <p><b>Preliminary root cause:</b> On {startDate}, engineers determined that instances of a backend service responsible
        for processing requests is returning errors and preventing requests from completing</p>
    <p><b>Next steps:</b> There is nothing actionable on your side at this point.
        Microsoft engineers have resolved the issue. We sincerely apologize for the impact to affected customers.
        We are continuously taking steps to improve the Microsoft Azure Platform and our processes to help ensure such incidents do not occur in the future.</p>`;

const ActiveCRINotificationTemplate: string = `
    <p><b>Summary of impact:</b> Starting {startTime} on {startDate}, your app may have been impacted due to an App Service outage.
        Microsoft engineers are actively working to resolve this issue.
        An alert/technical escalation has already been filed and our Microsoft engineers have been notified.
        You can check the “Diagnose and solve problems” tab for an updated message, once the issue has been mitigated </p>
    <p><b>Details:</b> {details}</p>`;

const MitigatedCRINotificationTemplate: string = `
    <p><b>Summary of impact:</b> Starting {startTime} on {startDate} to {endTime} on {endDate}, your app may have been impacted due to an App Service outage.
        An alert/technical escalation has already been filed and our Microsoft engineers have been notified.</p>
    <p><b>Details:</b> {details}</p>`;
