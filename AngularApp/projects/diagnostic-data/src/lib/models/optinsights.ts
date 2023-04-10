
export interface AggregatedInsight {
    key: string;
    insight: Insight; 
    metadata: any;
    component: string;
    method: string;
    count: number;
    traceOccurrences: number; 
    maxImpactPercent: number; 
    maxBlockingTime: number; 
    maxTimeStamp: string; 
}

interface Insight {
    appId: string;
    roleName: string;
    timeStamp: string;
    type: any;
    impactPercent: number;
    thresholdPercent: number;
    blockingTime: number;
    issue: any;
    details: any;
    context: Array<string>;
    symbol: string;
    parentSymbol: string;
    component: string;
    method: string;
}

export interface OptInsightsResource {
    SubscriptionId: string;
    ResourceGroup: string;
    Name: string;
    LinkedApplicationType: number;
    ResourceId: string;
    ResourceType: string;
    IsAzureFirst: boolean;
}

export interface OptInsightsTimeContext {
    durationMs: number; // Duration from now in ms
    createdTime: string; // Now
    isInitialTime: boolean;
    grain: number; // This isn't respected by OptInsights as of April 6th 2023 (the time range filter won't show up properly. Will need to fix)
    useDashboardTimeRange: boolean;
}