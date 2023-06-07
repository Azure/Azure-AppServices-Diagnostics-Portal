"use strict";

import { VnetIntegrationConfigChecker } from "./vnetIntegrationConfigChecker";

export class VnetDnsConfigChecker {
    constructor(siteInfo, diagProvider, apiVersion = "2021-01-01") {
        if (siteInfo == null || diagProvider == null) {
            throw new error("Constructor parameters cannot be null");
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
    }

    async getAppSettingDnsAsync() {
        await this.dataPreparePromise;
        var dnsSettings = [this.appSettings["WEBSITE_DNS_SERVER"], this.appSettings["WEBSITE_DNS_ALT_SERVER"]];
        return dnsSettings;
    }

    async getAppSettingAlwaysFallbackToPublicDnsAsync() {
        await this.dataPreparePromise;
        return this.appSettings["WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS"];
    }

    getVnetDnsSettings(vnetData) {
        if (vnetData && vnetData["properties"] && vnetData["properties"]["dhcpOptions"]) {
            return vnetData["properties"]["dhcpOptions"]["dnsServers"];
        } else {
            return null;
        }
    }

    async isDnsServerReachableAsync(server, useNetworkTroubleshooterBackend = false) {
        if (this.diagProvider.isIp(server)) {
            var result = null;
            if (useNetworkTroubleshooterBackend)
            {
                result = await this.diagProvider.tcpPingNetworkTroubleshooterAsync(server, 53);
            }
            else
            {
                result = await this.diagProvider.tcpPingAsync(server, 53);
            }

            if (result.status == 0) {
                //success
                return true;
            } else {
                return false;
            }
        }else{
            return false;
        }
    }

}