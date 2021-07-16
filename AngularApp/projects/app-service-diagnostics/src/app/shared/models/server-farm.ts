import {ArmObj} from './armObj';

export interface ServerFarm extends ArmObj {
    properties: {
        name: string;
        sku: string;
        workerSize: WorkerSize;
        numberOfWorkers: number;
        numberOfSites: number;
    };
    sku: {
        name: string;
        tier: string;
        family: string;
        capacity: number;
    };
    additionalProperties: {
        cores: number;
        ramInGB: number;
    };
}

export enum Sku {
    Free = 1 << 0,
    Shared = 1 << 1,
    Dynamic = 1 << 2,
    Basic = 1 << 3,
    Standard = 1 << 4,
    Premium = 1 << 5,
    PremiumV2 = 1 << 6,
    Isolated = 1 << 7,
    PremiumContainer = 1 << 8, // 100000000
    ElasticPremium = 1 << 9, // 1000000000
    Paid = 1016,         // 1111111000
    Dedicated = 507,    // 111111011 Not Dynamic or ElasticPremium
    NotDynamic = 1019,   // 1111111011
    PaidDedicated =  504, // 111111000
    All = (1 << 10) - 1           // 1111111111 0111111011 => 111111011
}

export enum WorkerSize {
    small = 0,
    medium = 1,
    large = 2
}
