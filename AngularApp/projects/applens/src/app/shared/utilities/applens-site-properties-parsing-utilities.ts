export class SitePropertiesParser {    
    public static getAppType(kind: string):AppType {
        return kind? AppType[kind] : AppType.WebApp;
    }

    public static getDisplayForAppType(appType: AppType): string {
        return AppType[appType];
    }

    public static getPlatformType(platform: string) {
        return platform ? PlatformType[platform] : PlatformType.Windows;
    }

    public static getDisplayForPlatformType(platform: PlatformType): string {
        return PlatformType[platform];
    }

    public static getStackType(stackType: string) {
        return stackType ? StackType[stackType] : StackType.All;
    }

    public static getDisplayForStackType(stack: StackType): string {
        return StackType[stack];
    }

}

export enum StackType {
    None = 0,
    AspNet = 1,
    NetCore = 2,
    Php = 4,
    Python = 8,
    Node = 16,
    Java = 32,
    Static = 64,
    Sitecore = 128,
    Other = 256,
    All = 511
}

export enum PlatformType {
    Windows = 1,
    Linux = 2,
    HyperV = 4,
    Kubernetes = 8,
    All = 255
}
export enum AppType {
    WebApp = 1,
    FunctionApp = 2,
    ApiApp = 4,
    MobileApp = 8,
    GatewayApp = 16,
    WorkflowApp = 32,
    All = 255
}