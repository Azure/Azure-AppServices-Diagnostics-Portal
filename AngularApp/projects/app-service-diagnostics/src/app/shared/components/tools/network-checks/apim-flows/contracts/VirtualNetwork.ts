import { ArmObj } from 'projects/app-service-diagnostics/src/app/shared/models/armObj';
import { SubnetContract } from './NetworkSecurity';

// https://docs.microsoft.com/en-us/rest/api/virtualnetwork/virtual-networks/get#virtualnetwork
export interface VirtualNetworkContract extends ArmObj {
  etag: string;
  extendedLocation: ExtendedLocationContract;

  properties: {
    addressSpace: AddressSpaceContract;
    dhcpOptions: DhcpOptionsContract;
    enableDdosProtection: boolean;
    enableVmProtection: boolean;
    encryption: VirtualNetworkEncryptionContract;
    flowTimeoutInMinutes: number;
    resourceGuid: string;
    subnets: SubnetContract[];
  };

  tags: Object;
}

interface ExtendedLocationContract {
  name: string;
  type: ExtendedLocationTypesContract;
}

interface ExtendedLocationTypesContract {
  EdgeZone: string;
}

interface AddressSpaceContract {
  addressPrefixes: string[];
}

interface DhcpOptionsContract {
  dnsServers: string[];
}

interface VirtualNetworkEncryptionContract {
  enabled: boolean;
}
