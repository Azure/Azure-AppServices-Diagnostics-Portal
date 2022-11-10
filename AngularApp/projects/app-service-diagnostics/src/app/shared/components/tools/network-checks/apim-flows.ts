import { networkConnectivityFlow } from "./apim-flows/networkConnectivityFlow";
import { pingCheckFlow } from "./apim-flows/pingCheckFlow";
import { NetworkCheckFlow } from "./network-check-flow";
import { NetworkCheckFlowSet } from "./network-check-flow-set";
import { learnMoreFlow } from './network-check-flows/learnMoreFlow.js';

export class ApimFlowSet implements NetworkCheckFlowSet {
    name: "APIM";
    flows: NetworkCheckFlow[] = [
        networkConnectivityFlow,
        // pingCheckFlow
    ];
}