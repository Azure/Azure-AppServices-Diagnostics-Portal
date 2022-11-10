export class AppLensCloudRegionUtility {
    static get isRunningInIFrame():boolean {
        return window.parent !== window;
    }
    static getAppLensCloudRegion(): AppLensCloudRegion {
        if(this.isRunningInIFrame) {
            let browserUrl = document.referrer;
            // Currently I know of only ASC embedding AppLens as IFrame.            
            if(browserUrl.includes("azuresupportcenter")) {                
                if(browserUrl.includes("chinacloudapi.cn")) {
                    return AppLensCloudRegion.Mooncake;
                } else if(browserUrl.includes("usgovcloudapi.net")) {
                    return AppLensCloudRegion.FairFax;
                }
            }
        } else {
            let browserUrl =  document.location.href;
            if (browserUrl.includes("applens.chinacloudsites.cn")) {
                return AppLensCloudRegion.Mooncake;
            } else if (browserUrl.includes("applens.azurewebsites.us")) {
                return AppLensCloudRegion.FairFax;
            }  else if (browserUrl.includes("applens-usnatwest.appservice.eaglex.ic.gov")) {
                return AppLensCloudRegion.USNat;
            } else if (browserUrl.includes("applens.appservice.microsoft.scloud")) {
                return AppLensCloudRegion.USSec;
            }
        }        
        return AppLensCloudRegion.Public;
    }

    static getASCCloudSpecificBaseUri():string {
        let cloudRegion = AppLensCloudRegionUtility.getAppLensCloudRegion();
        switch (cloudRegion) {
            case AppLensCloudRegion.Mooncake:
                return 'https://azuresupportcenter.chinacloudapi.cn';
            case AppLensCloudRegion.FairFax:
                return 'https://azuresupportcenter.usgovcloudapi.net';
            case AppLensCloudRegion.Public:
                return 'https://azuresupportcenter.msftcloudes.com';
            default:
                return '';
        }
    }
}

export enum AppLensCloudRegion {
    Public,
    Mooncake,
    FairFax,
    USNat,
    USSec
  }