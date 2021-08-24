"use strict";
import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { CommonWordings } from './commonWordings.js'
import { VnetDnsConfigChecker } from './vnetDnsConfigChecker.js';
import { VnetIntegrationWordings } from './vnetInegrationWordings.js';
import { VnetIntegrationConfigChecker } from './vnetIntegrationConfigChecker.js';
import { VnetDnsWordings } from './vnetDnsWordings.js';
import { VnetAppSettingChecker } from './vnetAppSettingChecker.js';
import { VnetAppSettingWordings } from './vnetAppSettingWordings.js';

function delay(second) {
    return new Promise(resolve =>
        setTimeout(resolve, second * 1000));
}

export class ResourcePermissionCheckManager {
    constructor() {
        this.hidden = true;
        this.checkView = new CheckStepView({
            title: "Access was restricted to some resources, check results will be incomplete",
            level: 3,
            hidden: true,
            subChecks: []
        });
    }

    addResource(uri) {
        if (this.hidden) {
            this.hidden = false;
            this.checkView.hidden = false;
        }
        this.checkView.subChecks.push({ title: `Have no access to ${uri}`, level: 3 });
    }
}

export async function checkKuduAvailabilityAsync(diagProvider, flowMgr) {
    var isKuduAccessible = false;
    var wordings = new CommonWordings();
    var timeout = 30;
    var kuduAvailabilityCheckPromise = (async () => {
        try {
            isKuduAccessible = await diagProvider.checkKuduReachable(timeout);
        } catch (e) {

        }

        var views = [];
        if (isKuduAccessible === false) {
            views.push(new CheckStepView({
                title: "Kudu is not reachable, diagnostic will be incomplete",
                level: 1
            }));

            views.push(wordings.kuduNotAccessible.get(`https://${diagProvider.scmHostName}`));
        }
        return views;
    })();
    flowMgr.addViews(kuduAvailabilityCheckPromise, "Checking Kudu availability...");
    var completed = false;
    delay(10).then(t => {
        if (!completed) {
            flowMgr.setLoadText(`Checking Kudu availability, this process can take at most ${timeout}s...`);
        }
    });
    await kuduAvailabilityCheckPromise;
    completed = true;
    return isKuduAccessible;
}

export async function getArmData(resourceId, diagProvider) {
    var apiVersion = "2018-07-01";//"2020-11-01"
    var armData = null;
    if (resourceId.includes("/subnets/")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("Microsoft.Network/virtualNetworks/")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }

    else if (resourceId.includes("Microsoft.Network/networkSecurityGroups")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("Microsoft.Network/routeTables")) {
        armData = await diagProvider.getArmResourceAsync(resourceId, apiVersion);
    }
    else if (resourceId.includes("config/virtualNetwork")) {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    else if (resourceId.includes("/virtualNetworkConnections")) {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    else {
        armData = await diagProvider.getArmResourceAsync(resourceId);
    }
    return armData;
}

export async function getWebAppVnetInfo(siteArmId, armService) {
    //This is the regional VNet Integration endpoint
    var swiftUrl = siteArmId + "/config/virtualNetwork";
    var siteVnetInfo = await armService.getArmResourceAsync(swiftUrl, "2018-02-01");

    return siteVnetInfo;
}

var armDataDictionary = {};
export async function getSubnet(armService, subnetResourceId) {
    var subnetData;
    var subnetName = subnetResourceId.split("/subnets/")[1];
    var vnetResourceId = subnetResourceId.split("/subnets/")[0];
    //Search for the subnet
    if (!(subnetResourceId in armDataDictionary)) {
        var vnetData = await getArmData(vnetResourceId, armService);
        var subnets = vnetData["properties"]["subnets"];
        subnets.forEach(subnet => {
            if (subnet["name"].toLowerCase() == subnetName.toLowerCase()) {
                subnetData = subnet;
            }
        });
    }
    else if ((subnetResourceId in armDataDictionary)) {
        subnetData = armDataDictionary[subnetResourceId];
    }
    return subnetData;
}

export async function runKuduAccessibleCheck(diagProvider) {
    var isKuduAccessible = await diagProvider.checkKuduReachable(30);
    var views = [];
    if (isKuduAccessible === false) {
        views.push(new CheckStepView({
            title: "Kudu is not reachable, diagnostic will be incomplete",
            level: 1
        }));
        var commonRec = new CommonWordings;

        views.push(commonRec.kuduNotAccessible.get(`https://${diagProvider.scmHostname}`));
    }
    return views;
}

export async function checkVnetIntegrationV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise) {
    var promiseCompletion = new PromiseCompletionSource();
    try {
        flowMgr.addViews(promiseCompletion, "Checking VNet integration status...");
        var views = [], isContinue = true;
        var subChecks = [];
        var vnetChecker = new VnetIntegrationConfigChecker(siteInfo, diagProvider);
        var integrationCheckStatus = null; // 0 - healthy, 1 - needs attention, 2 - unhealthy
        var vnetIntegrationType = await vnetChecker.getVnetIntegrationTypeAsync();
        var wordings = new VnetIntegrationWordings();
        if (vnetIntegrationType == "swift") {
            subChecks.push(wordings.swiftConfigured.get());
            var subnetResourceId = await vnetChecker.getSwiftSubnetIdAsync();
            var subnetDataPromise = diagProvider.getArmResourceAsync(subnetResourceId, vnetChecker.apiVersion);
            var aspSitesDataPromise = diagProvider.getArmResourceAsync(vnetChecker.serverFarmId + "/sites", vnetChecker.apiVersion);
            var instanceDataPromise = diagProvider.getArmResourceAsync(vnetChecker.siteArmId + "/instances", vnetChecker.apiVersion);

            if (subnetResourceId != null) {
                if (!vnetChecker.isSubnetResourceIdFormatValid(subnetResourceId)) {
                    views.push(wordings.swiftInvalidSubnet.get(subChecks))
                    isContinue = false;
                }

                if (isContinue) {
                    if (!(await vnetChecker.isSwiftSupportedAsync())) {
                        views.push(wordings.wrongArmTemplate.get(subChecks));
                        isContinue = false;
                    }
                }
                if (isContinue) {
                    var subnetSubChecks = [];
                    var subnetStatus = null; // 0 - healthy, 1 - needs attention, 2 - unhealthy
                    var subnetData = await subnetDataPromise;
                    if (subnetData.status == 200) {
                        subnetStatus = 0;
                        subnetSubChecks.push(wordings.subnetExists.get(subnetResourceId));
                        if (vnetChecker.subnetSalExists(subnetData)) {
                            if (vnetChecker.isSubnetSalOwnerCorrect(subnetData, vnetChecker.serverFarmId)) {
                                subnetSubChecks.push(wordings.subnetSalValid.get());
                            } else {
                                subnetSubChecks.push(wordings.subnetWrongSalOwner.get());
                                subnetStatus = 1;
                            }
                        } else {
                            subnetSubChecks.push(wordings.subnetSalMissing.get());
                            subnetStatus = 2;
                            isContinue = false;
                        }

                        if (vnetChecker.isSubnetDelegated(subnetData)) {
                            subnetSubChecks.push(wordings.subnetDelegationResult.get(true));
                        } else {
                            subnetSubChecks.push(wordings.subnetDelegationResult.get(false));
                            subnetStatus = 2;
                            isContinue = false;
                        }


                        var subnetMask = vnetChecker.getSubnetMask(subnetData, subnetMaskThresh);
                        if (subnetMask != null) {
                            var subnetMaskThresh = 27;
                            if (siteInfo["sku"].startsWith("P")) {
                                //premium
                                subnetMaskThresh = 26;
                            }

                            if (subnetMask > subnetMaskThresh) {
                                subnetStatus = 1;
                                views.push(wordings.subnetSizeIsNotGood.get(subnetResourceId, subnetMask, siteInfo["sku"], subnetMaskThresh, subnetSubChecks));
                            } else {
                                subnetSubChecks.push(wordings.subnetSizeIsGood.get(subnetMask));
                            }

                        } else {
                            diagProvider.logException(new Error("Unexpected null subnetMask"));
                        }

                    } else {
                        if (subnetData.status == 401) {
                            views.push(wordings.noAccessToResource.get(subnetResourceId, "subnet", diagProvider.portalDomain));
                        } else if (subnetData.status == 404) {
                            views.push(wordings.subnetNotFound.get(subnetSubChecks, subnetResourceId));
                            subnetStatus = 2;
                        } else {
                            throw new Error(`Unexpected subnet data status:${subnetData.status}`);
                        }
                        isContinue = false;
                    }
                }

                if (subnetStatus != null) {
                    subChecks.push(wordings.subnetCheckResult.get(subnetStatus, subnetSubChecks));
                }

                if (isContinue) {
                    var aspSitesData = await aspSitesDataPromise;
                    if (aspSitesData.status == 200) {
                        var subnets = vnetChecker.getAspConnectedSubnetsAsync(aspSitesData);
                        if (subnets.length == 1) {
                            subChecks.push(wordings.swiftAspUnderLimitation.get(subnets, 1));
                        } else if (subnets.length > 1) {
                            views.push(wordings.swiftAspExceedsLimitation.get(subnets, 1, vnetChecker.serverFarmId, subChecks));
                        }
                    } else {
                        if (aspSitesData.status == 401) {
                            // skip asp check
                        } else {
                            diagProvider.logException(new Error(`Unexpected aspSitesData status: ${aspSitesData.status}`));
                        }
                    }
                }

                if (isContinue) {
                    var isKuduAccessible = await isKuduAccessiblePromise;
                    if (isKuduAccessible) {
                        var instanceData = await instanceDataPromise;
                        if (instanceData.status == 200) {
                            var ips = await vnetChecker.getInstancesPrivateIpAsync(instanceData);
                            if (ips != null) {
                                var total = ips.length;
                                var notAllocated = ips.filter(ip => ip == null).length;
                                if (notAllocated > 0) {
                                    views.push(wordings.swiftPrivateIpNotAssigned.get(notAllocated, subchecks));
                                } else {
                                    subChecks.push(wordings.swiftPrivateIpAssigned.get(total));
                                }
                            } else {
                                // failed to get instance private ip
                            }
                        } else {
                            diagProvider.logException(new Error(`Unexpected instanceData status: ${instanceData.status}`));
                        }
                    } else {
                        //NoKuduAccess, skip
                    }
                }
                integrationCheckStatus = flowMgr.getSubCheckLevel(subChecks);
                var integrationCheck = wordings.vnetIntegrationResult.get(integrationCheckStatus, subChecks);
                views = [integrationCheck, ...views];

            } else {
                //invalid subnetResourceId
                diagProvider.logException(new Error(`invalid subnetResourceId ${subnetResourceId}`));
            }
        } else if (vnetIntegrationType == "gateway") {
            subChecks.push(wordings.gatewayConfigured.get());
            integrationCheckStatus = 0;
            var siteGWVnetInfo = await vnetChecker.getGatewayVnetInfoAsync();
            if (siteGWVnetInfo[0]["properties"] != null && siteGWVnetInfo[0]["properties"]["vnetResourceId"] != null) {
                var vnetResourceId = siteGWVnetInfo[0]["properties"]["vnetResourceId"];
                var vnetData = await diagProvider.getArmResourceAsync(vnetResourceId, vnetChecker.apiVersion);
                if (vnetData.status == 200) {
                    subChecks.push(wordings.gatewayVnetValid.get(vnetResourceId));
                } else if (vnetData.status == 401) {
                    views.push(wordings.noAccessToResource.get(vnetResourceId, "vnet", diagProvider.portalDomain));
                    isContinue = false;
                } else if (vnetData.status == 404) {
                    views.push(wordings.gatewayVnetNotFound.get(subChecks, vnetResourceId));
                    integrationCheckStatus = 2;
                    isContinue = false;
                } else {
                    diagProvider.logException(new Error(`Unknown vnetData status ${vnetData.status}`));
                }
            } else {
                diagProvider.logException(new Error(`invalid siteGWVnetInfo ${JSON.stringify(siteGWVnetInfo)}`));
            }
            var integrationCheck = wordings.vnetIntegrationResult.get(integrationCheckStatus, subChecks);
            views = [integrationCheck, ...views];

        } else if (vnetIntegrationType == "none") {
            views = wordings.noVnetIntegration.get();
            isContinue = false;
        } else {
            throw new Error("Unexpected null result returned from vnetChecker.getVnetIntegrationTypeAsync()");
        }

        promiseCompletion.resolve(views);
        return isContinue;
    } catch (e) {
        promiseCompletion.resolve([]);
        throw e;
    }
}

export async function checkAppSettingsAsync(siteInfo, diagProvider, flowMgr) {
    var promiseCompletion = new PromiseCompletionSource();
    flowMgr.addViews(promiseCompletion, "Checking App Settings...");
    try {
        var subChecks = [];
        var appSettingChecker = new VnetAppSettingChecker(siteInfo, diagProvider);
        var wordings = new VnetAppSettingWordings();

        var routeAll = await appSettingChecker.getVnetRouteAllAsync();
        subChecks.push(wordings.vnetRouteAll.get(routeAll));

        var fallback = await appSettingChecker.getAlwaysFallbackToPublicDnsAsync();
        subChecks.push(wordings.alwaysFallbackDns.get(fallback));

        var check = wordings.vnetRelatedBehaviors.get(subChecks);

        promiseCompletion.resolve([check]);

    } catch (e) {
        promiseCompletion.resolve([]);
        throw e;
    }
}

export async function checkDnsSettingV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise, dnsSettings) {
    var promiseCompletion = new PromiseCompletionSource();
    flowMgr.addViews(promiseCompletion, "Checking DNS settings...");
    try {
        var dnsSettingSource = null;
        var subChecks = [], views = [];
        var isContinue = false;
        var wordings = new VnetDnsWordings();
        var vnetConfigChecker = new VnetIntegrationConfigChecker(siteInfo, diagProvider);
        var vnetIntegrationType = await vnetConfigChecker.getVnetIntegrationTypeAsync();
        if (vnetIntegrationType == "swift") {
            if (await isKuduAccessiblePromise) {
                isContinue = true;
                var dnsChecker = new VnetDnsConfigChecker(siteInfo, diagProvider);

                var appSettingDns = await dnsChecker.getAppSettingDnsAsync();
                if (appSettingDns[0] != null) {
                    var appSettingDnsSubChecks = [];
                    let unreachableDns = [];
                    for (let idx = 0; idx < appSettingDns.length; ++idx) {
                        let dns = appSettingDns[idx];
                        if (dns != null) {
                            let result = await dnsChecker.isDnsServerReachableAsync(dns);
                            appSettingDnsSubChecks.push(wordings.dnsReachability.get(dns, idx == 0 ? "WEBSITE_DNS_SERVER" : "WEBSITE_DNS_ALT_SERVER", result));
                            if (result == false) {
                                unreachableDns.push(dns);
                            }
                        }
                    };
                    dnsSettings.push(...appSettingDns.filter(i => i != null));
                    dnsSettingSource = "App Settings";
                    if (unreachableDns.length > 0) {
                        views.push(wordings.dnsIsUnhealthy.get(dnsSettings, unreachableDns, "App Settings", subChecks, appSettingDnsSubChecks));
                        if (unreachableDns.length == dnsSettings.length) {
                            // none custom DNS is reachable
                            isContinue = false;
                        } else {
                            // One custom DNS is not reachable
                            isContinue = true;
                        }
                    } else {
                        subChecks.push(wordings.dnsIsHealthy.get(appSettingDnsSubChecks, "App Settings"));
                    }

                } else if (appSettingDns[1] != null) {
                    subChecks.push(wordings.appSettingDnsOnlyHasAlternative.get());
                }

                if (isContinue) {
                    var vnetId = await vnetConfigChecker.getSwiftVnetIdAsync();
                    var vnetData = await diagProvider.getArmResourceAsync(vnetId, vnetConfigChecker.apiVersion);
                    if (vnetData.status == 200) {
                        //vnet dns check
                        var vnetDnsSettings = dnsChecker.getVnetDnsSettings(vnetData);
                        if (vnetDnsSettings != null && vnetDnsSettings.length > 0) {
                            if (dnsSettings != null && dnsSettings.length > 0) {
                                // dns is set in AppSettings
                                subChecks.push(wordings.appSettingDnsOverrideVnetDns.get());
                            } else {
                                let unreachableDns = [];
                                var vnetDnsSubChecks = [];
                                vnetDnsSettings.sort();
                                if (vnetDnsSettings.length > 2) {
                                    // if windows
                                    subChecks.push(wordings.onlyTwoVnetDnsWillBeApplied.get(vnetDnsSettings));
                                }
                                dnsSettings.push(...vnetDnsSettings.slice(0, 2));
                                dnsSettingSource = "VNet DNS";

                                for (let idx = 0; idx < dnsSettings.length; ++idx) {
                                    let dns = dnsSettings[idx];
                                    let result = await dnsChecker.isDnsServerReachableAsync(dns);
                                    vnetDnsSubChecks.push(wordings.dnsReachability.get(dns, `VNet DNS list position ${idx}`, result));
                                    if (result == false) {
                                        unreachableDns.push(dns);
                                    }
                                };

                                if (unreachableDns.length > 0) {
                                    views.push(wordings.dnsIsUnhealthy.get(dnsSettings, unreachableDns, "VNet", subChecks, vnetDnsSubChecks));
                                    if (unreachableDns.length == dnsSettings.length) {
                                        // none custom DNS is reachable
                                        isContinue = false;
                                    } else {
                                        // One custom DNS is not reachable
                                        isContinue = true;
                                    }
                                } else {
                                    subChecks.push(wordings.dnsIsHealthy.get(vnetDnsSubChecks, "VNet"));
                                }
                            }
                        }
                        var fallbackToAzureDns = await dnsChecker.getAppSettingAlwaysFallbackToPublicDnsAsync();
                        if (dnsSettings != null && dnsSettings.length > 0) {
                            if (fallbackToAzureDns) {
                                subChecks.push(wordings.fallbackToAzureDnsConfigured.get());
                            }
                        }
                        subChecks.push(wordings.configuredDns.get(dnsSettings, dnsSettingSource, fallbackToAzureDns));
                        if (dnsSettings != null && (dnsSettings.length == 0 || fallbackToAzureDns)) {
                            dnsSettings.push("");
                        }
                    } else {
                        isContinue = false;
                        if (vnetData.status == 401) {
                            views.push(wordings.noAccessToResource(vnetId));
                        } else {
                            views.push(wordings.unexpectedError());
                        }
                    }
                }
                var dnsCheckResult = flowMgr.getSubCheckLevel(subChecks);
                var dnsCheck = wordings.dnsCheckResult.get(dnsCheckResult, subChecks);
                views = [dnsCheck, ...views];
            } else {
                views.push(wordings.cannotCheckWithoutKudu.get("DNS settings"));
            }
        }else{
            isContinue = true;
        }
        promiseCompletion.resolve(views);

        return isContinue;
    } catch (e) {
        promiseCompletion.resolve([]);
        throw e;
    }
}

export function extractHostPortFromConnectionString(connectionString) {
    var hostName = undefined;
    var port = undefined;

    var connectionStringTokens = connectionString.split(";");
    var connectionStringKVMap = connectionStringTokens.reduce(
        (dict, element) => {
            var kvpair = element.split("=");
            if (kvpair.length == 2) {
                (dict[kvpair[0]] = kvpair[1])
            }
            return dict;
        },
        {}
    );

    if (connectionStringKVMap["AccountName"] != undefined) {
        // Storage account: DefaultEndpointsProtocol=https;AccountName=<account_name>;AccountKey=<key>;EndpointSuffix=core.windows.net;
        var storageAccountName = connectionStringKVMap["AccountName"];
        hostName = connectionStringKVMap["EndpointSuffix"] != undefined ?
            storageAccountName + ".blob." + connectionStringKVMap["EndpointSuffix"] :
            storageAccountName + ".blob.core.windows.net";
        port = connectionStringKVMap["DefaultEndpointsProtocol"] == "http" ? 80 : 443;
    } else if (connectionStringKVMap["Endpoint"] != undefined) {
        // Event hubs: Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>;EntityPath=<event_hub_name>
        // Service bus: Endpoint=sb://<namespace>.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<key>
        hostName = connectionStringKVMap["Endpoint"].split("sb://")[1].split("/")[0];
        port = 443;
    } else if (connectionStringKVMap["AccountEndpoint"] != undefined) {
        // Cosmos DB: AccountEndpoint=https://<account_name>.documents.azure.com:443/;AccountKey=<key>;"
        hostName = connectionStringKVMap["AccountEndpoint"].split("https://")[1].split(":")[0];
        port = connectionStringKVMap["AccountEndpoint"].split("https://")[1].split(":")[1].split("/")[0];
    } else if (connectionStringKVMap["IngestionEndpoint"] != undefined) {
        // Application Insights: InstrumentationKey=0b7c83b0-add4-4025-939f-4e67ccb1ad19;IngestionEndpoint=https://westus2-1.in.applicationinsights.azure.com/
        hostName = connectionStringKVMap["IngestionEndpoint"].split("https://")[1].split("/")[0];
        port = 443;
    }

    return { "HostName": hostName, "Port": port }
}

export function extractHostPortFromKeyVaultReference(keyVaultReference) {
    // Format: @Microsoft.KeyVault(SecretUri=https://<Host>/<some_path>) 
    // OR
    // @Microsoft.KeyVault(VaultName=vaultName;SecretName=secretName;SecretVersion=secretVersion)
    var secretUriPrefix = "SecretUri=https://";
    var vaultNamePrefix = "VaultName=";
    var keyVaultDomainName = "vault.azure.net";  // TODO: This needs to be dynamically determined based on the cloud this app is in
    var hostName = undefined;
    var port = 443;
    if (keyVaultReference.indexOf(secretUriPrefix) != -1) {
        hostName = keyVaultReference.split(secretUriPrefix)[1].split("/")[0];
    } else if (keyVaultReference.indexOf(vaultNamePrefix) != -1) {
        hostName = keyVaultReference.split(vaultNamePrefix)[1].split(";")[0] + "." + keyVaultDomainName;
    }

    return { "HostName": hostName, "Port": port }
}

export function addSubnetSelectionDropDownView(siteInfo, diagProvider, flowMgr, title, processSubnet) {
    var dropdownView = new DropdownStepView({
        dropdowns: [],
        width: "60%",
        bordered: true,
        description: title,
        async callback(dropdownIdx, selectedIdx) {
            if (dropdownIdx === 0) {
                dropdownView.dropdowns.length = 1;
                var subscription = subscriptions[selectedIdx];
                
                dropdownView.dropdowns.push({
                    description: "Virtual Network",
                    options: [],
                    placeholder: "Loading..."
                });
                
                vnets = await diagProvider.getArmResourceAsync(`/subscriptions/${subscription.subscriptionId}/providers/Microsoft.Network/virtualNetworks`, "2018-07-01");
                dropdownView.dropdowns.length = 1;
                vnets = vnets.value.filter(v => v && v.name != null).sort((s1, s2) => s1.name.toLowerCase() > s2.name.toLowerCase() ? 1 : -1);

                var vnetDropdown = null;
                if (vnets.length > 0) {
                    vnetDropdown = {
                        description: "Virtual Network",
                        options: vnets.map(s => s.name),
                        placeholder: "Please select..."
                    };
                } else {
                    vnetDropdown = {
                        description: "Virtual Network",
                        options: [],
                        placeholder: "No VNet found in this subscription"
                    }
                }
                dropdownView.dropdowns.push(vnetDropdown);
            } else if (dropdownIdx === 1) {
                dropdownView.dropdowns.length = 2;
                vnet = vnets[selectedIdx];
                subnets = vnet.properties == null ? [] : vnet.properties.subnets.filter(s => s && s.name != null);
                subnets = subnets.sort((s1, s2) => s1.name.toLowerCase() > s2.name.toLowerCase() ? 1 : -1);
                var subnetDropdown = null;
                if (subnets.length > 0) {
                    subnetDropdown = {
                        description: "Subnet",
                        options: subnets.map(s => s.name),
                        placeholder: "Please select..."
                    };
                } else {
                    subnetDropdown = {
                        description: "Subnet",
                        options: [],
                        placeholder: "No subnet found in this VNet"
                    }
                }
                dropdownView.dropdowns.push(subnetDropdown);
            } else {
                flowMgr.reset(state);
                var subnet = subnets[selectedIdx];
                var promise = processSubnet(subnet, vnet);
                //flowMgr.addViews(promise, "Checking subnet...");
            }
        }
    });
    var subscriptions = null, vnets = null, subnets = null;
    var vnet = null;
    
    
    dropdownView.dropdowns.push({
        description: "Subscription",
        options: [],
        placeholder: "Loading..."
    });
    var state = flowMgr.addView(dropdownView);

    diagProvider.getArmResourceAsync("subscriptions")
        .then(s => {
            subscriptions = s.value.filter(s => s && s.displayName != null).sort((s1, s2) => s1.displayName.toLowerCase() > s2.displayName.toLowerCase() ? 1 : -1);
            var subscriptionDropdown = {
                description: "Subscription",
                options: [],
                placeholder: "Please select..."
            };
            subscriptionDropdown.options = subscriptions.map((s, i) => {
                if (s.subscriptionId == siteInfo.subscriptionId) {
                    subscriptionDropdown.defaultChecked = i;
                }
                return s.displayName;
            });
            dropdownView.dropdowns.length = 0;
            dropdownView.dropdowns.push(subscriptionDropdown);
        });
}