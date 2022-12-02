import { DetectorType } from 'diagnostic-data';

export interface PortalReferrerMap {
  ReferrerExtensionName: string;
  ReferrerBladeName: string;
  ReferrerTabName: string;
  DetectorType: DetectorType;
  DetectorId: string;
}

export interface PortalReferrerInfo {
  ExtensionName: string;
  BladeName: string;
  TabName: string;
  CategoryId?: string;
  DetectorType?: DetectorType;
  DetectorId?: string;
  StartTime?: string;
  EndTime?: string;
}
