interface PreferredSitesConfig {
    [index: string]: string[];
}

export var detectorSearchEnabledPesIds: string[] = ["14748", "16072", "16170", "15791", "15551", "16450", "17378"];
export var detectorSearchEnabledSapProductIds: string[] = [
    'b4d0e877-0166-0474-9a76-b5be30ba40e4',
    'b452a42b-3779-64de-532c-8a32738357a6',
    '9239daee-9951-e495-0aee-bf6b73708882',
    '5ce8de69-abba-65a0-e0e4-a684bcbc7931',
    '1890289e-747c-7ef6-b4f5-b1dbb0bead28'
    ];

export var detectorSearchEnabledPesIdsInternal: string[] = ["14748", "16072", "16170", "16450", "15791", "15551", "17378"];
export var detectorSearchEnabledSapProductIdsInternal: string[] = [
    'b4d0e877-0166-0474-9a76-b5be30ba40e4',
    'b452a42b-3779-64de-532c-8a32738357a6',
    '9239daee-9951-e495-0aee-bf6b73708882',
    '5ce8de69-abba-65a0-e0e4-a684bcbc7931',
    '5a3a423f-8667-9095-1770-0a554a934512',
    '1890289e-747c-7ef6-b4f5-b1dbb0bead28'
    ];

export var globalExcludedSites = ["aws.amazon.com", "twitter.com"];

var productPreferredSitesConfig: PreferredSitesConfig = {
    //WEB APP WINDOWS
    "14748": ["github.com/Azure-App-Service", "stackoverflow.com", "azure.github.io/AppService"],
    //FUNCTION APPS
    "16072": ["github.com/Azure/Azure-Functions", "stackoverflow.com"],
    //WEB APP LINUX
    "16170": ["azureossd.github.io", "stackoverflow.com", "azure.github.io/AppService"],
    //AZURE KUBERNETES SERVICES
    "16450": ["github.com/Azure/AKS", "kubernetes.io/docs", "kubernetes.io/blog", "stackoverflow.com"],
    //LOGIC APPS
    "15791": ["docs.microsoft.com/azure/logic-apps", "github.com/logicappsio", "github.com/Azure/logicapps", "techcommunity.microsoft.com/t5/integrations-on-azure", "stackoverflow.com"],
    //LOGIC APPS Standard
    "17378": ["docs.microsoft.com/azure/logic-apps", "github.com/logicappsio", "github.com/Azure/logicapps", "stackoverflow.com"],
    //API Management
    "15551": ["github.com/Azure/api-management-samples", "github.com/Azure/azure-api-management-devops-resource-kit", "github.com/Azure/api-management-developer-portal", "stackoverflow.com"]
};

var sapProductPreferredSitesConfig: PreferredSitesConfig = {
    //WEB APP WINDOWS
    "1890289e-747c-7ef6-b4f5-b1dbb0bead28": ["github.com/Azure-App-Service", "stackoverflow.com", "azure.github.io/AppService"],
    //FUNCTION APPS
    "5ce8de69-abba-65a0-e0e4-a684bcbc7931": ["github.com/Azure/Azure-Functions", "stackoverflow.com"],
    //WEB APP LINUX
    "b452a42b-3779-64de-532c-8a32738357a6": ["azureossd.github.io", "stackoverflow.com", "azure.github.io/AppService"],
    //AZURE KUBERNETES SERVICES
    "5a3a423f-8667-9095-1770-0a554a934512": ["github.com/Azure/AKS", "kubernetes.io/docs", "kubernetes.io/blog", "stackoverflow.com"],
    //LOGIC APPS
    "9239daee-9951-e495-0aee-bf6b73708882": ["docs.microsoft.com/azure/logic-apps", "github.com/logicappsio", "github.com/Azure/logicapps", "techcommunity.microsoft.com/t5/integrations-on-azure", "stackoverflow.com"],
    //API Management
    "b4d0e877-0166-0474-9a76-b5be30ba40e4": ["github.com/Azure/api-management-samples", "github.com/Azure/azure-api-management-devops-resource-kit", "github.com/Azure/api-management-developer-portal", "stackoverflow.com"]
};

var productExcludedSitesConfig: PreferredSitesConfig = {
    //WEB APP WINDOWS
    "14748": [],
    //FUNCTION APPS
    "16072": [],
    //WEB APP LINUX
    "16170": [],
    //AZURE KUBERNETES SERVICES
    "16450": [],
    //LOGIC APPS
    "15791": [],
    //Logic Apps Standard
    "17378": [],
    //API Management
    "15551": []
};

var sapProductExcludedSitesConfig: PreferredSitesConfig = {
    //WEB APP WINDOWS
    "1890289e-747c-7ef6-b4f5-b1dbb0bead28": [],
    //FUNCTION APPS
    "5ce8de69-abba-65a0-e0e4-a684bcbc7931": [],
    //WEB APP LINUX
    "b452a42b-3779-64de-532c-8a32738357a6": [],
    //AZURE KUBERNETES SERVICES
    "5a3a423f-8667-9095-1770-0a554a934512": [],
    //LOGIC APPS
    "9239daee-9951-e495-0aee-bf6b73708882": [],
    //API Management
    "b4d0e877-0166-0474-9a76-b5be30ba40e4": []
};

export class SearchConfiguration{
    public DetectorSearchEnabled: boolean;
    public WebSearchEnabled: boolean;
    public CustomQueryString: string;
    public DetectorSearchConfiguration: DetectorSearchConfiguration;
    public WebSearchConfiguration: WebSearchConfiguration;
    public constructor(table: any, pesId: string, sapPoductId:string) {
        this.DetectorSearchEnabled = true;
        this.WebSearchEnabled = true;
        this.CustomQueryString = null;
        this.DetectorSearchConfiguration = new DetectorSearchConfiguration();
        this.WebSearchConfiguration = new WebSearchConfiguration(pesId, sapPoductId);
        if (table && table.columns && table.rows && table.rows.length>0){
            this.DetectorSearchEnabled = table.rows[0][table.columns.findIndex(x => x.columnName=="DetectorSearchEnabled")];
            this.WebSearchEnabled = table.rows[0][table.columns.findIndex(x => x.columnName=="WebSearchEnabled")];
            this.CustomQueryString = table.rows[0][table.columns.findIndex(x => x.columnName=="CustomQueryString")];
            var detectorSearchConfig = table.rows[0][table.columns.findIndex(x => x.columnName=="DetectorSearchConfiguration")];
            this.DetectorSearchConfiguration = detectorSearchConfig? JSON.parse(detectorSearchConfig): this.DetectorSearchConfiguration;
            var webSearchConfigData = table.rows[0][table.columns.findIndex(x => x.columnName=="WebSearchConfiguration")];
            var webSearchConfig: WebSearchConfiguration = webSearchConfigData? JSON.parse(webSearchConfigData): this.WebSearchConfiguration;
            this.WebSearchConfiguration.PreferredSites = webSearchConfig.PreferredSites && webSearchConfig.PreferredSites.length>0? webSearchConfig.PreferredSites: this.WebSearchConfiguration.PreferredSites;
            this.WebSearchConfiguration.ExcludedSites = webSearchConfig.ExcludedSites && webSearchConfig.ExcludedSites.length>0? Array.from(new Set(webSearchConfig.ExcludedSites.concat(this.WebSearchConfiguration.ExcludedSites))): this.WebSearchConfiguration.ExcludedSites;
        }
    }
}

export class DetectorSearchConfiguration {
    public MinScoreThreshold: number;
    public MaxResults: number;
    public constructor() {
        this.MinScoreThreshold = 0.3;
        this.MaxResults = 10;
    }
}

export class WebSearchConfiguration {
    public MaxResults: number;
    public UseStack: boolean;
    public PreferredSites: string[];
    public ExcludedSites: string[];
    public constructor(pesId: string, sapProductId:string){
        this.MaxResults = 5;
        this.UseStack = true;
        var productPreferredSites: string[] = [];
        var productExcludedSites: string[] = [];
        if(sapProductId) {
            productPreferredSites = sapProductPreferredSitesConfig[sapProductId]? sapProductPreferredSitesConfig[sapProductId]: [];
            productExcludedSites = sapProductExcludedSitesConfig[sapProductId]? sapProductExcludedSitesConfig[sapProductId]: [];
        }
        else {
            productPreferredSites = productPreferredSitesConfig[pesId]? productPreferredSitesConfig[pesId]: [];
            productExcludedSites = productExcludedSitesConfig[pesId]? productExcludedSitesConfig[pesId]: [];
        }
        this.PreferredSites = productPreferredSites;
        this.ExcludedSites = Array.from(new Set(globalExcludedSites.concat(productExcludedSites)));
    }
}
