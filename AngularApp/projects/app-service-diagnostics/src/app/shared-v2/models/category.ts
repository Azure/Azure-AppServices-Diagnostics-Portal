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
    customPortalAction?: boolean; // Only used currently for navigation to Load Testing blade from Web Apps
}

export interface CategoryQuickLinkDetails {
    type: DetectorType;
    id: string;
    displayText: string;
}