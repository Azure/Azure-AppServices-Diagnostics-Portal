'use strict';

export class VnetAppSettingChecker {
  constructor(siteInfo, diagProvider, apiVersion = '2021-01-01') {
    if (siteInfo == null || diagProvider == null) {
      throw new error('Constructor parameters cannot be null');
    }
    this.siteInfo = siteInfo;
    this.diagProvider = diagProvider;
    this.apiVersion = apiVersion;

    this.siteArmId = siteInfo.id;
    this.serverFarmId = siteInfo.serverFarmId;
    this.dataPreparePromise = this.prepareDataAsync();
  }

  async prepareDataAsync() {
    this.appSettings = await this.diagProvider.getAppSettings();
    this.webConfig = await this.diagProvider.getWebConfigAsync();
  }

  async getAlwaysFallbackToPublicDnsAsync() {
    await this.dataPreparePromise;
    if (this.appSettings['WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS'] != null) {
      return this.appSettings['WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS'] === '1';
    }
    return null;
  }

  async getVnetRouteAllAsync() {
    await this.dataPreparePromise;
    if (
      this.webConfig.properties &&
      this.webConfig.properties.vnetRouteAllEnabled != null
    ) {
      return (
        this.webConfig.properties.vnetRouteAllEnabled ||
        this.appSettings['WEBSITE_VNET_ROUTE_ALL'] === '1'
      );
    }
    return null;
  }
}
