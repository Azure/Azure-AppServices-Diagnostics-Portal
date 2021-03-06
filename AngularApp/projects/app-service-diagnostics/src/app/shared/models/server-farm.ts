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
    PremiumContainer = 1 << 8,
    Paid = 504,         // 111111000
    NotDynamic = 507,   // 111111011
    All = 511           // 111111111
}

export enum WorkerSize {
    small = 0,
    medium = 1,
    large = 2
}
