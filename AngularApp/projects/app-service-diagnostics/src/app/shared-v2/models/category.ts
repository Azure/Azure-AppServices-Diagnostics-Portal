import { DetectorType } from 'diagnostic-data';

export interface Category {
  id: string;
  name: string;
  overviewDetectorId: string;
  description: string;
  keywords: string[];
  categoryQuickLinks?: CategoryQuickLinkDetails[];
  color: string;
  createFlowForCategory: boolean;
  overridePath?: string;
  chatEnabled: boolean;
}

export interface CategoryQuickLinkDetails {
  type: DetectorType;
  id: string;
  displayText: string;
}
