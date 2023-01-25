import { InfoStepView, InfoType } from 'diagnostic-data';
import { NetworkCheckFlow } from "../network-check-flow";
import { APIM_API_VERSION } from './data/constants';
import { dnsMismatchCheck } from './checks/dnsMismatchCheck';
import { networkStatusCheck } from './checks/networkStatusCheck';
import { nsgRuleCheck } from './checks/nsgCheck';
import { routeTableCheck } from './checks/routeTableCheck';
import { ApiManagementServiceResourceContract } from './contracts/APIMService';

export const networkConnectivityFlow: NetworkCheckFlow = {
    title: "Network Configuration Issues",
    id: "networkCheckFlow",

    func: async (siteInfo, diagProvider, flowMgr) => {
        
        /** Network Status Check */
        const resourceId = siteInfo.resourceUri;
        networkStatusCheck(flowMgr, diagProvider, resourceId);

        const serviceResourceResponse = await diagProvider.getResource<ApiManagementServiceResourceContract>(resourceId, APIM_API_VERSION);
        let serviceResource = serviceResourceResponse.body;
        let networkType = serviceResource.properties.virtualNetworkType;
        
        /** NSG Checks */
        nsgRuleCheck(networkType, flowMgr, diagProvider, serviceResource);

        /** DNS Mismatch Check */
        dnsMismatchCheck(networkType, serviceResource, flowMgr, diagProvider, resourceId);

        /** Route Table Check */
        routeTableCheck(networkType, flowMgr, diagProvider, serviceResource);

    }
};


