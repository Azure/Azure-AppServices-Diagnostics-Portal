import { VirtualNetworkType } from '../contracts/APIMService';
import {
  SecurityRuleDirection,
  SecurityRuleProtocol
} from '../contracts/NetworkSecurity';

export interface PortRequirements {
  portNums: number[];
  dir: SecurityRuleDirection[];
  protocol: SecurityRuleProtocol;
  vnetType: VirtualNetworkType[];
  serviceSource: string;
  serviceDestination: string;
  required: boolean;
  purpose?: string;
}

const basePortRequirements: PortRequirements[] = [
  {
    portNums: [80, 443],
    dir: [SecurityRuleDirection.INBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.EXTERNAL],
    serviceSource: 'Internet',
    serviceDestination: 'VirtualNetwork',
    required: true,
    purpose: 'Client communication to API Management'
  },
  {
    portNums: [3443],
    dir: [SecurityRuleDirection.INBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'ApiManagement',
    serviceDestination: 'VirtualNetwork',
    required: true,
    purpose: 'Management endpoint for Azure portal and PowerShell'
  },
  {
    portNums: [443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'Storage',
    required: true,
    purpose: 'Dependency on Azure Storage'
  },
  {
    portNums: [443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'AzureActiveDirectory',
    required: false,
    purpose: 'Azure Active Directory and Azure Key Vault dependency'
  },
  {
    portNums: [1443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'SQL',
    required: true,
    purpose: 'Access to Azure SQL endpoints'
  },
  {
    portNums: [445],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'Storage',
    required: false,
    purpose: 'Dependency on Azure File Share for GIT'
  },
  {
    portNums: [1886, 443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'AzureMonitor',
    required: false,
    purpose:
      'Publish Diagnostics Logs and Metrics, Resource Health, and Application Insights'
  },
  {
    portNums: [6381, 6382, 6383],
    dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'VirtualNetwork',
    required: false,
    purpose: 'Access Redis Service for Cache policies between machines'
  }
];

export const stv1portRequirements: PortRequirements[] = [
  ...basePortRequirements,
  {
    portNums: [5671, 5672, 443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'Azure Event Hubs',
    required: false,
    purpose:
      'Dependency for Log to Azure Event Hubs policy and monitoring agent'
  },
  {
    portNums: [443, 12000],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'AzureCloud',
    required: false,
    purpose:
      'Health and Monitoring Extension & Dependency on Event Grid (if events notification activated)'
  },
  {
    portNums: [25, 587, 25028],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'Internet',
    required: false,
    purpose: 'Connect to SMTP Relay for sending e-mail'
  },
  {
    portNums: [4290],
    dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.UDP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'VirtualNetwork',
    required: false,
    purpose: 'Sync Counters for Rate Limit policies between machines'
  },
  {
    portNums: [-1], // fixme any port qualifier
    dir: [SecurityRuleDirection.INBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'AzureLoadBalancer',
    serviceDestination: 'VirtualNetwork',
    required: true,
    purpose:
      'Azure Infrastructure Load Balancer (required for Premium SKU, optional for other SKUs)'
  }
];

export const stv2portRequirements: PortRequirements[] = [
  ...basePortRequirements,
  {
    portNums: [443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'AzureKeyVault',
    required: true,
    purpose: 'Access to Azure Key Vault'
  },
  {
    portNums: [5671, 5672, 443],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'EventHub',
    required: false,
    purpose:
      'Dependency for Log to Azure Event Hubs policy and monitoring agent'
  },

  {
    portNums: [443, 12000],
    dir: [SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'AzureCloud',
    required: false,
    purpose: 'Health and Monitoring Extension'
  },
  {
    portNums: [25, 587, 25028],
    dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'VirtualNetwork',
    serviceDestination: 'Internet',
    required: false,
    purpose: 'Connect to SMTP Relay for sending e-mail'
  },
  {
    portNums: [4290],
    dir: [SecurityRuleDirection.INBOUND, SecurityRuleDirection.OUTBOUND],
    protocol: SecurityRuleProtocol.UDP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'AzureLoadBalancer',
    serviceDestination: 'VirtualNetwork',
    required: false,
    purpose: 'Sync Counters for Rate Limit policies between machines'
  },
  {
    portNums: [6390],
    dir: [SecurityRuleDirection.INBOUND],
    protocol: SecurityRuleProtocol.TCP,
    vnetType: [VirtualNetworkType.INTERNAL, VirtualNetworkType.EXTERNAL],
    serviceSource: 'AzureLoadBalancer',
    serviceDestination: 'VirtualNetwork',
    required: true,
    purpose: 'Azure Infrastructure Load Balancer'
  }
];
