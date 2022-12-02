import { NetworkCheckFlow } from './network-check-flow';
import { NetworkCheckFlowSet } from './network-check-flow-set';
import { configFailureFlow } from './network-check-flows/configFailureFlow.js';
import { functionsFlow } from './network-check-flows/functionsFlow.js';
import { learnMoreFlow } from './network-check-flows/learnMoreFlow.js';
import { subnetDeletionFlow } from './network-check-flows/subnetDeletionFlow.js';

export class FunctionAppFlowSet implements NetworkCheckFlowSet {
  name: 'functionapp';
  flows: NetworkCheckFlow[] = [
    functionsFlow,
    configFailureFlow,
    subnetDeletionFlow,
    learnMoreFlow
  ];
}
