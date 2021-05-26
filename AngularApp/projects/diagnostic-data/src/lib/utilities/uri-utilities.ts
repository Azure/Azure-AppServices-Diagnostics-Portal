import { StringUtilities } from './string-utilities';

export class UriUtilities {
    static BuildDetectorLink(resourceUri: string, detectorId: string): string {
        return 'https://portal.azure.com' +
            `/?websitesextension_ext=asd.featurePath%3Ddetectors%2F${detectorId}#@microsoft.onmicrosoft.com` +
            `/resource/${StringUtilities.TrimBoth(resourceUri, '/')}/troubleshoot`
    }

    static removeQueryParams(allQueryParams: { [key: string]: any }, removeQueryList: string[]) {
        const allQueryParamKeys = Object.keys(allQueryParams);
        const queryParams = {};
        for(const key of allQueryParamKeys){
            if(removeQueryList.findIndex(q => q.toLowerCase() === key.toLowerCase()) === -1){
                queryParams[key] = allQueryParams[key];
            }
        }
        return queryParams;
    }

    static removeChildDetectorStartAndEndTime(allQueryParams: { [key: string]: any }) {
        return UriUtilities.removeQueryParams(allQueryParams,["startTimeChildDetector","endTimeChildDetector"]);
    }
}
