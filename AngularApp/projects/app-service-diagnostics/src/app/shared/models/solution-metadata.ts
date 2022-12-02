import { SiteInfoMetaData } from './site';

export class ApplicationRestartInfo extends SiteInfoMetaData {
  instances: InstanceInfo[];
}

export class SiteDaasInfo extends SiteInfoMetaData {
  instances: string[];
}

export class InstanceInfo {
  machineName: string;
  instanceId: string;
}
