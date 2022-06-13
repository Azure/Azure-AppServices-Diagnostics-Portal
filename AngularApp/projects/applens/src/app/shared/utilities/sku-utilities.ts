export class SkuUtilities {
    static getPriceTireBySkuAndSize(sku: string, workerSize: number): string {
        let skuCode = sku;
        switch (sku) {
            case "Shared":
                skuCode = "D1";
                break;
            case "Free":
                skuCode = "F1";
                break;
            case "Basic":
                if (workerSize === WorkerSizeOption.Small) {
                    skuCode = "B1";
                }
                if (workerSize === WorkerSizeOption.Medium) {
                    skuCode = "B2";
                }
                if (workerSize === WorkerSizeOption.Large) {
                    skuCode = "B3";
                }
                break;
            case "Standard":
                if (workerSize === WorkerSizeOption.Small) {
                    skuCode = "S1";
                }
                if (workerSize === WorkerSizeOption.Medium) {
                    skuCode = "S2";
                }
                if (workerSize === WorkerSizeOption.Large) {
                    skuCode = "S3";
                }
                break;
            case "Premium":
                if (workerSize === WorkerSizeOption.Small) {
                    skuCode = "P1";
                }
                if (workerSize === WorkerSizeOption.Medium) {
                    skuCode = "P2";
                }
                if (workerSize === WorkerSizeOption.Large) {
                    skuCode = "P3";
                }
                break;
            case "PremiumV2":
                if (workerSize === WorkerSizeOption.D1) {
                    skuCode = "P1v2";
                }
                if (workerSize === WorkerSizeOption.D2) {
                    skuCode = "P2v2";
                }
                if (workerSize === WorkerSizeOption.D3) {
                    skuCode = "P3v2";
                }
                break;
            case "PremiumV3":
                if (workerSize === WorkerSizeOption.SmallV3) {
                    skuCode = "P1v3";
                }
                if (workerSize === WorkerSizeOption.MediumV3) {
                    skuCode = "P2v3";
                }
                if (workerSize === WorkerSizeOption.LargeV3) {
                    skuCode = "P3v3";
                }
                break;
            case "Isolated":
                if (workerSize === WorkerSizeOption.Small) {
                    skuCode = "I1";
                }
                if (workerSize === WorkerSizeOption.Medium) {
                    skuCode = "I2";
                }
                if (workerSize === WorkerSizeOption.Large) {
                    skuCode = "I3";
                }
                break;
            case "IsolatedV2":
                if (workerSize === WorkerSizeOption.SmallV3) {
                    skuCode = "I1v2";
                }
                if (workerSize === WorkerSizeOption.MediumV3) {
                    skuCode = "I2v2";
                }
                if (workerSize === WorkerSizeOption.LargeV3) {
                    skuCode = "I3v2";
                }
                break;
            case "PremiumContainer":
                if (workerSize === WorkerSizeOption.Small) {
                    skuCode = "PC2";
                }
                if (workerSize === WorkerSizeOption.Medium) {
                    skuCode = "PC3";
                }
                if (workerSize === WorkerSizeOption.Large) {
                    skuCode = "PC4";
                }
                break;
            case "ElasticPremium":
                if (workerSize === WorkerSizeOption.D1) {
                    skuCode = "EP1";
                }
                if (workerSize === WorkerSizeOption.D2) {
                    skuCode = "EP2";
                }
                if (workerSize === WorkerSizeOption.D3) {
                    skuCode = "EP3";
                }
                break;
            case "WorkflowStandard":
                if (workerSize === WorkerSizeOption.D1) {
                    skuCode = "WS1";
                }
                if (workerSize === WorkerSizeOption.D2) {
                    skuCode = "WS2";
                }
                if (workerSize === WorkerSizeOption.D3) {
                    skuCode = "WS3";
                }
                break;
            case "Dynamic":
                skuCode = "Y1";
                break;
        }
        return skuCode;
    }
}

//https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.management.websites.models.workersizeoptions?view=azure-dotnet
enum WorkerSizeOption {
    Small,
    Medium,
    Large,
    D1,
    D2,
    D3,
    SmallV3,
    MediumV3,
    LargeV3,
    NestedSmall,
    NestedSmallLinux,
    Default
}