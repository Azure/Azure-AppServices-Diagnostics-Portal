export interface Communication {
  communicationId: string;
  publishedTime: string;
  title: string;
  richTextMessage: string;
  status: CommunicationStatus;
  incidentId: string;
  isAlert: boolean;
  isExpanded: boolean;
  impactedServices: ImpactedService[];
  icmId: string;
  commType: number;
}

export interface ImpactedService {
  name: string;
  regions: string[];
}

export enum CommunicationStatus {
  Active = 0,
  Resolved
}

export enum SourceType {
  ServiceHealth = 0,
  AppServiceAdvisor = 1
}
