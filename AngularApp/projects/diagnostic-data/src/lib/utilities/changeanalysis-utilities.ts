import { DiffEditorModel } from 'ngx-monaco-editor';

export class ChangeAnalysisUtilities {

    static readonly basePath: string = '../../../assets/img/azure-icons/';
    static readonly changeAnalysisSupportedResources = ['Microsoft.Sql', 'Microsoft.Storage', 'Microsoft.Web'];
    static readonly azureResourceList = [
        {
            "resourceType": "Microsoft.Web",
            "imgPath": ChangeAnalysisUtilities.basePath +"AzureAppService.png"
        },
        {
            "resourceType": "Microsoft.Sql",
            "imgPath": ChangeAnalysisUtilities.basePath +"AzureSQLDatabase.png"
        },
        {
            "resourceType": "Microsoft.Cache",
            "imgPath": ChangeAnalysisUtilities.basePath +"AzureCacheRedis.png"
        },
        {
            "resourceType": "Microsoft.Storage",
            "imgPath": ChangeAnalysisUtilities.basePath + "AzureStorage.png"
        },
        {
            "resourceType": "Microsoft.Network",
            "imgPath": ChangeAnalysisUtilities.basePath + "AzureVirtualNetwork.png"
        }
    ];

    public static  prepareDisplayValueForTable(displayName: string): string {
        if(displayName) {
            displayName = displayName.replace("D:\\home\\site\\wwwroot", "");
            return displayName;
        }
        return "N/A";
    }

      public static prepareValuesForDiffView(diffvalue: any): DiffEditorModel {
        try {
            let jsonObject: any;
            if(diffvalue === null || typeof diffvalue === 'undefined') {
                return {
                    "code": "",
                    "language": 'text/plain'
                }
            }
            if(typeof diffvalue === "boolean" || typeof diffvalue === "number") {
                return {
                    "code": diffvalue.toString(),
                    "language": 'text/plain'
                };
            }
            if(typeof diffvalue === "string") {
                diffvalue = diffvalue.replace("mtime", "Modified Time");
                diffvalue = diffvalue.replace("crtime", "Created Time");
                jsonObject = JSON.parse(diffvalue);
                if(jsonObject.hasOwnProperty('content') && jsonObject['content'] != null) {
                    if (jsonObject['content'] !== null && typeof jsonObject['content'] === "object") {
                        return {
                            "code": JSON.stringify(jsonObject['content'], null, 2),
                            'language': 'json'
                        }
                    } else {
                        return {
                            "code": jsonObject['content'],
                            "language": 'text/plain'
                        };
                    }
                } return {
                    "code": JSON.stringify(jsonObject, null, 2),
                    'language': 'json'
                };
            }
            if(diffvalue instanceof Object || diffvalue instanceof Array ) {
                if(diffvalue.hasOwnProperty('content') && diffvalue['content'] != null) {
                    return {
                        "code": diffvalue['content'],
                        "language": 'text/plain'
                    };
                } return {
                    // Needed for JSON Pretty
                    "code": JSON.stringify(diffvalue, null, 2),
                    "language": 'json'
                    };
            }
        // Exception is thrown when we try to parse string which is not a json, so just return text/plain
        } catch(ex) {
            return {
                "code": diffvalue,
                "language": 'text/plain'
            }
        }
    }

    public static getDataSourceFromChangesetId(changesetId: string): string {
        let splits = changesetId ? changesetId.split('_') : [];
        return splits.length > 0 ? splits[0] : null;
    }

    public static findGroupBySource(source: string): number {
        source = source.toUpperCase();
        switch(source){
        case "ARG":
        return 1;
        case "ARM":
        return 1;
        case "AST":
        return 2;
        default:
        return 1;
        }
    }

    public static getInitiatedByField(initiatedByList: any): string {
        let totalUsers = initiatedByList.length;
        if(totalUsers === 0) {
            return "Unable to determine";
        }
        if(totalUsers > 2) {
            return initiatedByList.slice(0,2).join(',')+ " +"+ (totalUsers - 2);
        }
        return initiatedByList.join(',');
    }

    public static getResourceType(resourceUri: string): string {
        return resourceUri.split("providers/")[1].split("/")[0];
    }

    public static getImgPathForResource(searchResourceType: string): string {
        let azureIconsList = this.azureResourceList;
        let resource = azureIconsList.find(element => element.resourceType.toLowerCase() == searchResourceType.toLowerCase());
        return resource ? resource.imgPath : ChangeAnalysisUtilities.basePath + 'AzureResource.png';
    }

    public static getSubscription(resourceUri: string): string {
        return resourceUri.split("subscriptions/")[1].split("/")[0];
    }

    public static getResourceGroup(resourceUri: string): string {
        let regex = new RegExp("resourceGroups/", "i");
        return resourceUri.split(regex)[1].split("/")[0];
    }

    public static getResourceName(resourceUri: string, provider:string): string {
        return resourceUri.split(provider+"/")[1];
    }

    public static isResourceProviderSupported(provider: string): boolean {
        return ChangeAnalysisUtilities.changeAnalysisSupportedResources.indexOf(provider) >= 0;
    }


}
