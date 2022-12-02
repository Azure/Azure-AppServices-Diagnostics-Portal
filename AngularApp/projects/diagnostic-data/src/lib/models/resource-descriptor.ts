export enum ResourceDescriptorGroups {
  subscription = 1,
  resourceGroup = 3,
  provider = 4,
  resource = 5
}

export class ResourceDescriptor {
  constructor() {
    this.subscription = '';
    this.resourceGroup = '';
    this.provider = '';
    this.type = '';
    this.resource = '';
    this.types = [];
    this.resources = [];
    this.resourceUriRegExp = new RegExp(
      '/subscriptions/([^/]+)/(resourceGroups/([^/]+)/)?providers/([^/]+)/(.+)',
      'i'
    );
  }
  subscription: string;
  resourceGroup: string;
  provider: string;
  type: string;
  resource: string;
  types: Array<string>;
  resources: Array<string>;
  resourceUriRegExp: RegExp;

  public static parseResourceUri(resourceUri: string): ResourceDescriptor {
    let resourceDesc: ResourceDescriptor = new ResourceDescriptor();

    if (resourceUri) {
      if (!resourceUri.startsWith('/')) {
        resourceUri = '/' + resourceUri;
      }

      var result = resourceUri.match(resourceDesc.resourceUriRegExp);
      if (result && result.length > 0) {
        if (result[ResourceDescriptorGroups.subscription]) {
          resourceDesc.subscription =
            result[ResourceDescriptorGroups.subscription];
        } else {
          resourceDesc.subscription = '';
        }

        if (result[ResourceDescriptorGroups.resourceGroup]) {
          resourceDesc.resourceGroup =
            result[ResourceDescriptorGroups.resourceGroup];
        } else {
          resourceDesc.resourceGroup = '';
        }

        if (result[ResourceDescriptorGroups.provider]) {
          resourceDesc.provider = result[ResourceDescriptorGroups.provider];
        } else {
          resourceDesc.provider = '';
        }

        if (result[ResourceDescriptorGroups.resource]) {
          const resourceParts =
            result[ResourceDescriptorGroups.resource].split('/');
          if (resourceParts.length % 2 != 0) {
            //ARM URI is incorrect. The resource section contains an uneven number of parts
            resourceDesc.resource = '';
          } else {
            for (var i = 0; i < resourceParts.length; i += 2) {
              resourceDesc.type = resourceParts[i];
              resourceDesc.resource = resourceParts[i + 1];

              resourceDesc.types.push(resourceDesc.type);
              resourceDesc.resources.push(resourceDesc.resource);
            }
          }
        } else {
          resourceDesc.resource = '';
        }
      }
    }
    return resourceDesc;
  }
}
