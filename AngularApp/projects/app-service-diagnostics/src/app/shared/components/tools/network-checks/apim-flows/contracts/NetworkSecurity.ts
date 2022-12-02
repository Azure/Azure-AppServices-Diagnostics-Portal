import { ArmObj } from 'projects/app-service-diagnostics/src/app/shared/models/armObj';

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#networksecuritygroup
export interface NetworkSecurityGroupContract extends ArmObj {
  etag: string;
  properties: {
    defaultSecurityRules: SecurityRuleContract[];
    // flowLogs: FlowLog[];
    networkInterfaces: NetworkInterfaceContract[];
    provisioningState: ProvisioningState;
    resourceGuid: string;
    securityRules: SecurityRuleContract[];
    subnets: SubnetContract[];
    type: string;
  };
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityrule
export interface SecurityRuleContract extends ArmObj {
  etag: string;
  properties: {
    access: SecurityRuleAccess;
    description: string;
    destinationAddressPrefix: string;
    destinationAddressPrefixes: string[];
    destinationApplicationSecurityGroups: ApplicationSecurityGroupContract[];
    destinationPortRange?: string;
    destinationPortRanges?: string[];
    direction: SecurityRuleDirection;
    priority: number;
    protocol: SecurityRuleProtocol;
    provisioningState: ProvisioningState;
    sourceAddressPrefix: string;
    sourceAddressPrefixes: string[];
    // sourceApplicationSecurityGroups:
    sourcePortRange: string;
    sourcePortRanges: string[];
  };
}

interface NetworkInterfaceContract extends ArmObj {
  etag: string;
  properties: {
    enableAcceleratedNetworking: boolean;
    enableIPForwarding: boolean;
    hostedWorkloads: string[];

    macAddress: string[];

    networkSecurityGroup: NetworkSecurityGroupContract;

    primary: boolean;

    provisioningState: ProvisioningState;
    resourceGuid: string;

    vnetEncryptionSupported: boolean;
    workloadType: string;
  };
}

export interface SubnetContract extends ArmObj {
  etag: string;
  properties: {
    addressPrefix: string;
    addressPrefixes: string[];
    networkSecurityGroup: NetworkSecurityGroupContract;
    purpose: string;
    routeTable: RouteTableContract;
  };
}

export interface RouteTableContract extends ArmObj {
  etag: string;
  tags: Object;
  type: string;
  properties: {
    disableBgpRoutePropogation: boolean;
    provisioningState: ProvisioningState;
    resourceGuid: string;
    routes: RouteContract[];
    subnets: SubnetContract[];
  };
}

export interface RouteContract extends ArmObj {
  etag: string;
  type: string;
  properties: {
    addressPrefix: string;
    hasBgpOverride: boolean;
    nextHopIpAddress: string;
    provisioningState: ProvisioningState;
  };
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruleaccess
export enum SecurityRuleAccess {
  ALLOW = 'Allow',
  DENY = 'Deny'
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#applicationsecuritygroup
interface ApplicationSecurityGroupContract extends ArmObj {
  etag: string;
  properties: {
    provisioningState: ProvisioningState;
    resourceGuid: string;
  };
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#provisioningstate
export enum ProvisioningState {
  DELETING = 'Deleting',
  FAILED = 'Failed',
  SUCCEEDED = 'Succeeded',
  UPDATING = 'Updating'
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruledirection
export enum SecurityRuleDirection {
  INBOUND = 'Inbound',
  OUTBOUND = 'Outbound'
}

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/network-security-groups/get#securityruleprotocol
export enum SecurityRuleProtocol {
  AST = '*',
  AH = 'Ah',
  ESP = 'Esp',
  ICMP = 'Icmp',
  TCP = 'Tcp',
  UDP = 'Udp'
}
