import {
  Check,
  checkResultLevel,
  CheckStepView,
  StepFlowManager,
  StepView
} from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import {
  ApiManagementServiceResourceContract,
  VirtualNetworkConfigurationContract,
  VirtualNetworkType
} from '../contracts/APIMService';
import {
  RouteTableContract,
  SubnetContract
} from '../contracts/NetworkSecurity';
import { NETWORK_API_VERSION } from '../data/constants';
import { getWorstStatus } from './networkStatusCheck';

function getVNetConfigsByLocation(
  serviceResource: ApiManagementServiceResourceContract
): { [key: string]: VirtualNetworkConfigurationContract } {
  let vnetConfigsByLocation = {};

  if (serviceResource.location) {
    vnetConfigsByLocation[serviceResource.location] =
      serviceResource.properties.virtualNetworkConfiguration;
  }

  if (serviceResource.properties.additionalLocations) {
    for (let loc of serviceResource.properties.additionalLocations) {
      vnetConfigsByLocation[loc.location] = loc.virtualNetworkConfiguration;
    }
  }

  return vnetConfigsByLocation;
}

function getRouteTableByLocation(
  diagProvider: DiagProvider,
  serviceResource: ApiManagementServiceResourceContract,
  vnetConfigsByLocation: {
    [key: string]: VirtualNetworkConfigurationContract;
  }
): { [key: string]: Promise<RouteTableContract | null> } {
  let routeTableByLocation = {};

  for (let loc of Object.keys(vnetConfigsByLocation)) {
    const subnetResourceId =
      serviceResource.properties.virtualNetworkConfiguration.subnetResourceId;

    routeTableByLocation[loc] = diagProvider
      .getResource<SubnetContract>(subnetResourceId, NETWORK_API_VERSION)
      .then((res) => res.body)
      .then((subnet) => subnet.properties.routeTable)
      .then((table) => table.id)
      .then((resId) =>
        diagProvider.getResource<RouteTableContract>(resId, NETWORK_API_VERSION)
      )
      .then((table) => table.body)
      .catch((_) => null);
  }

  return routeTableByLocation;
}

async function mapToValues<Value>(valueMap: {
  [key: string]: Promise<Value>;
}): Promise<{ [key: string]: Value }> {
  let res = {};
  for (let [k, v] of Object.entries(valueMap)) res[k] = await v;
  return res;
}

function performRouteTableCheck(
  location: string,
  table: RouteTableContract | null
): Check {
  const allQualifyingCIDR = '0.0.0.0/0';

  let hasRouteTable = !!(table && table.properties); // convert falsey value to boolean
  let omniRoute = hasRouteTable
    ? table.properties.routes.find((route) =>
        route.properties.addressPrefix.includes(allQualifyingCIDR)
      )
    : null;
  let hasOmniQualifier = hasRouteTable && omniRoute; // match 0 bits

  const noTable = 'No issues detected in this resource.';
  const noRoute = 'No issues detected in this resource.';
  const hasIssue = `Resource **${table ? table.name : ''}** has a route **${
    omniRoute ? omniRoute.name : ''
  }** that directs all traffic. 
    If this is not intended, please change the *addressPrefix* in route settings <a href="https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource${
      table ? table.id : ''
    }/routes" target="_blank">here</a>.`;
  return {
    title: location,
    level: hasOmniQualifier ? checkResultLevel.warning : checkResultLevel.pass,
    bodyMarkdown: hasRouteTable
      ? hasOmniQualifier
        ? hasIssue
        : noRoute
      : noTable
  };
}

async function routeTableView(
  diagProvider: DiagProvider,
  serviceResource: ApiManagementServiceResourceContract
): Promise<StepView> {
  let vnetConfigsByLocation = getVNetConfigsByLocation(serviceResource);
  let routeTableByLocationPromise = getRouteTableByLocation(
    diagProvider,
    serviceResource,
    vnetConfigsByLocation
  );

  let routeTableByLocation = await mapToValues(routeTableByLocationPromise);

  let routeTableResults = Object.entries(routeTableByLocation).map(
    ([loc, table]) => performRouteTableCheck(loc, table)
  );
  let worstStatus = getWorstStatus(routeTableResults.map((res) => res.level));

  return new CheckStepView({
    title: 'Route Table Status',
    level: worstStatus,
    id: 'thirdStep',
    bodyMarkdown:
      'If the default route (0.0.0.0/0) is set in the route table, all traffic from the API Management-delegated subnet is forced to flow ' +
      'through an on-premises firewall or to a network virtual appliance. This traffic might break connectivity with API Management service, ' +
      "since outbound traffic is either blocked on-premises, or NAT'd to an unrecognizable set of addresses. To learn more, check the section about " +
      'force-tunneling traffic [here](https://docs.microsoft.com/azure/api-management/api-management-using-with-vnet#-common-network-configuration-issues).',
    subChecks: routeTableResults
  });
}

export function routeTableCheck(
  networkType: VirtualNetworkType,
  flowMgr: StepFlowManager,
  diagProvider: DiagProvider,
  serviceResource: ApiManagementServiceResourceContract
) {
  if (networkType != VirtualNetworkType.NONE) {
    flowMgr.addView(
      routeTableView(diagProvider, serviceResource),
      'Performing Route Table checks'
    );
  } else {
  }
}
