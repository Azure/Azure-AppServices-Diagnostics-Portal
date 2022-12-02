import {
  ButtonStepView,
  checkResultLevel,
  CheckStepView,
  ResourceDescriptor,
  StepFlowManager
} from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import {
  ApiManagementServiceResourceContract,
  ProvisioningState,
  VirtualNetworkConfigurationContract,
  VirtualNetworkType
} from '../contracts/APIMService';
import {
  NetworkStatusByLocationContract,
  NetworkStatusContract
} from '../contracts/NetworkStatus';
import { VirtualNetworkContract } from '../contracts/VirtualNetwork';
import { APIM_API_VERSION, NETWORK_API_VERSION } from '../data/constants';
import { Body } from './nsgCheck';

const DEFAULT_DNS = '168.63.129.16';

function getVnetResourceId(subnetResourceId: string): string {
  let uriDescriptor = ResourceDescriptor.parseResourceUri(subnetResourceId);

  let subscription = uriDescriptor.subscription;
  let resourcegroup = uriDescriptor.resourceGroup;
  let provider = uriDescriptor.provider;
  let resource = `${uriDescriptor.types[0]}/${uriDescriptor.resources[0]}`;
  return `/subscriptions/${subscription}/resourcegroups/${resourcegroup}/providers/${provider}/${resource}`;
}

async function getDnsValidity(
  virtualNetworkConfiguration: VirtualNetworkConfigurationContract,
  diagProvider: DiagProvider,
  networkStatus: NetworkStatusContract
): Promise<boolean> {
  const vnetResourceId = getVnetResourceId(
    virtualNetworkConfiguration.subnetResourceId
  );

  // todo this needs to be fixed
  const vnetResponse = await diagProvider.getResource<VirtualNetworkContract>(
    vnetResourceId,
    NETWORK_API_VERSION
  );
  const vnet = vnetResponse.body;

  let validDNSs = vnet.properties.dhcpOptions.dnsServers;

  if (validDNSs.length == 0) {
    // no custom dns specified
    // all dns have to be the default, which is 168.63.129.16
    return !networkStatus.dnsServers.some((dns) => dns != DEFAULT_DNS);
  } else {
    return !networkStatus.dnsServers.some((dns) => !validDNSs.includes(dns));
  }
}

function findNetworkStatusByLocation(
  statuses: NetworkStatusByLocationContract[],
  location: string
): NetworkStatusContract {
  return statuses.find((stat) => stat.location === location).networkStatus;
}

export async function dnsMismatchCheck(
  networkType: VirtualNetworkType,
  serviceResource: ApiManagementServiceResourceContract,
  flowMgr: StepFlowManager,
  diagProvider: DiagProvider,
  resourceId: string
) {
  if (networkType != VirtualNetworkType.NONE) {
    const networkStatusResponse = await diagProvider.getResource<
      NetworkStatusByLocationContract[]
    >(resourceId + '/networkstatus', APIM_API_VERSION);
    const networkStatuses = networkStatusResponse.body;

    let findDnsServers = (loc: string) =>
      networkStatuses.find((stat) => stat.location == loc).networkStatus
        .dnsServers;

    let validityByLocation: { [key: string]: boolean } = {};

    // should move await calls into Promise.all for good parallelism
    validityByLocation[serviceResource.location] = await getDnsValidity(
      serviceResource.properties.virtualNetworkConfiguration,
      diagProvider,
      findNetworkStatusByLocation(networkStatuses, serviceResource.location)
    );

    if (serviceResource.properties.additionalLocations) {
      for (let loc of serviceResource.properties.additionalLocations) {
        validityByLocation[loc.location] = await getDnsValidity(
          loc.virtualNetworkConfiguration,
          diagProvider,
          findNetworkStatusByLocation(networkStatuses, loc.location)
        );
      }
    }

    let anyInvalid = Object.values(validityByLocation).some((valid) => !valid);

    const transitionStates: ProvisioningState[] = [
      ProvisioningState.ACTIVATING,
      ProvisioningState.TERMINATING,
      ProvisioningState.UPDATING
    ];
    let isTransitioning = !!transitionStates.find(
      (s) => s == serviceResource.properties.provisioningState
    );
    let buttonText = isTransitioning
      ? 'Service is updating'
      : 'Apply Network Configuration';
    const applyConfigButton: ButtonStepView = {
      callback: () => {
        return diagProvider
          .postResourceAsync<ApiManagementServiceResourceContract, Body>(
            resourceId + '/applynetworkconfigurationupdates',
            {},
            APIM_API_VERSION
          )
          .then(() => {});
      },
      id: 'step3.5',
      text: buttonText,
      hidden: isTransitioning
    };

    const validText = 'Your DNS config is healthy.';
    const invalidText =
      'Your DNS configuration is outdated. Apply network configuration to update it.';

    flowMgr.addView(
      new CheckStepView({
        title: 'DNS Network Configuration Status',
        level: anyInvalid ? checkResultLevel.warning : checkResultLevel.pass,
        id: 'thirdStep',
        bodyMarkdown: anyInvalid ? invalidText : validText,
        subChecks: Object.entries(validityByLocation).map(([loc, valid]) => {
          return {
            title: loc,
            level: valid ? checkResultLevel.pass : checkResultLevel.warning,
            bodyMarkdown: valid
              ? 'DNS configuration is up to date.'
              : `DNS server(s) ${findDnsServers(
                  loc
                )} do not match your vnet's DNS configuration.`
          };
        }),
        action: anyInvalid ? applyConfigButton : null
      })
    );
  } else {
  }
}
