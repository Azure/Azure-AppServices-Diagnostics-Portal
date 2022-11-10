import { DetectorType } from "diagnostic-data";

export type FeatureAction = () => void;

export interface Feature {
    name: string;
    id: string;
    description: string;
    category: string;
    featureType: DetectorType | string;
    clickAction: FeatureAction;
}
