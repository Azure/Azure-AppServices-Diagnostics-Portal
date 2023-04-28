import {ResourceTypeState} from "../models/resources";

function getFakeArmResource(rpName: string, serviceName: string, resourceName: string): string {
    let fakeRes = `/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/${rpName}/${serviceName}/${resourceName}`;
    return fakeRes;
}

export const defaultResourceTypes: ResourceTypeState[] = [
    {
      resourceType: "Microsoft.Web/sites",
      resourceTypeLabel: 'App name',
      routeName: (name) => `sites/${name}`,
      displayName: 'App Service',
      enabled: true,
      caseId: false,
      id: 'App Service'
    },
    {
      resourceType: "Microsoft.Web/hostingEnvironments",
      resourceTypeLabel: 'ASE name',
      routeName: (name) => `hostingEnvironments/${name}`,
      displayName: 'App Service Environment',
      enabled: true,
      caseId: false,
      id: 'App Service Environment'
    },
    {
      resourceType: "Microsoft.Web/containerApps",
      resourceTypeLabel: 'Container App Name',
      routeName: (name) => `containerapps/${name}`,
      displayName: 'Container App',
      enabled: true,
      caseId: false,
      id: 'Container App'
    }, {
      resourceType: "Microsoft.Web/staticSites",
      resourceTypeLabel: 'Static App Name Or Default Host Name',
      routeName: (name) => `staticwebapps/${name}`,
      displayName: 'Static Web App',
      enabled: true,
      caseId: false,
      id: 'Static Web App'
    },
    {
      resourceType: "Microsoft.Compute/virtualMachines",
      resourceTypeLabel: 'Virtual machine Id',
      routeName: (name) => getFakeArmResource('Microsoft.Compute', 'virtualMachines', name),
      displayName: 'Virtual Machine',
      enabled: true,
      caseId: false,
      id: 'Virtual Machine'
    },
    {
      resourceType: "ARMResourceId",
      resourceTypeLabel: 'ARM Resource ID',
      routeName: (name) => `${name}`,
      displayName: 'ARM Resource ID',
      enabled: true,
      caseId: false,
      id: 'ARM Resource ID'
    },
    {
      resourceType: null,
      resourceTypeLabel: 'Stamp name',
      routeName: (name) => `stampfinder/${name}`,
      displayName: 'Internal Stamp',
      enabled: true,
      caseId: false,
      id: 'Internal Stamp'
    }
];
