export class SitePropertiesParser {
    public static getAppType(kind: string):AppType {
        if (kind && kind.toLowerCase().indexOf("workflowapp") !== -1) {
          return AppType.WorkflowApp;
        } else if (kind && kind.toLowerCase().indexOf("function") !== -1) {
          return AppType.FunctionApp;
        } else if (kind && kind.toLowerCase().indexOf("mobile") !== -1) {
          return AppType.MobileApp;
        } else if (kind && kind.toLowerCase().indexOf("gateway") !== -1) {
            return AppType.GatewayApp;
        } else if (kind && kind.toLowerCase().indexOf("api") !== -1) {
            return AppType.ApiApp;
        } else return AppType.WebApp;
    }

    public static getDisplayForAppType(appType: AppType): string {
        return AppType[appType];
    } 

    public static getPlatform(kind: string) {
        if (kind && kind.toLowerCase().indexOf("linux") !== -1) {
          return "Linux";
        } else return "Windows";
    }

    public static getDisplayForPlatformType(platform: PlatformType): string {
        return PlatformType[platform];
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