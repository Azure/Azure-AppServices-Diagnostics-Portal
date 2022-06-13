import { DetectorType } from "diagnostic-data";

export interface UserSetting extends LandingInfo, UserPanelSetting {
    favoriteDetectors: FavoriteDetectors;
    id: string;
}

export interface LandingInfo {
    resources: RecentResource[];
    defaultServiceType: string;
}

export interface UserPanelSetting {
    theme: string;
    viewMode: string;
    expandAnalysisCheckCard: boolean;
}

export interface RecentResource {
    kind: string;
    resourceUri: string;
    queryParams: { [key: string]: string }
}


export interface FavoriteDetectorProp {
    type: DetectorType;
}

export interface FavoriteDetectors {
    [key: string]: FavoriteDetectorProp
}