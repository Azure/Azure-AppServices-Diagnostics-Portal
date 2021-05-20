import {ResourcePermissionCheckManager, runKuduAccessibleCheck, checkVnetIntegrationHealth, checkDnsSettingAsync, extractHostPortFromConnectionString, checkSubnetSizeAsync, extractHostPortFromKeyVaultReference} from './flowMisc.js';

export var functionsFlow = {
    title: "My Function App is not starting or executing or I see connection errors in logs",
    async func(siteInfo, diagProvider, flowMgr) {
        // Check that Kudu is accessible
        var isKuduAccessible = true;
        var kuduAvailabilityCheckPromise = runKuduAccessibleCheck(diagProvider);
        flowMgr.addViews(kuduAvailabilityCheckPromise, "Checking kudu availability...");
        
        var permMgr = new ResourcePermissionCheckManager();
        flowMgr.addView(permMgr.checkView);

        var kuduReachablePromise = kuduAvailabilityCheckPromise.then(r => isKuduAccessible);

        var vnetIntegrationHealthPromise = checkVnetIntegrationHealth(siteInfo, diagProvider, kuduReachablePromise, permMgr);
        flowMgr.addViews(vnetIntegrationHealthPromise.then(d => d.views), "Checking VNet integration status...");
        var data = { 
            subnetDataPromise: vnetIntegrationHealthPromise.then(d => d.subnetData), 
            serverFarmId: siteInfo["serverFarmId"], 
            kuduReachablePromise, 
            isContinuedPromise: vnetIntegrationHealthPromise.then(d => d.isContinue) 
        };

        // TODO: separate common code between this and connectionFailureFlow.js
        flowMgr.addViews(data.isContinuedPromise.then(c => c ? checkNetworkConfigAndConnectivityAsync(siteInfo, diagProvider, flowMgr, data, permMgr) : null), "Checking Network Configuration...");
        
        var dnsCheckResultPromise = checkDnsSettingAsync(siteInfo, diagProvider);
        var dnsCheckResult = await dnsCheckResultPromise;
        var dnsServers = dnsCheckResult.dnsServers;

        /**
         * Functions specific checks
         **/
        var appSettings = await diagProvider.getAppSettings();

        /**
         * Functions App common dependencies
         **/
        var checkFunctionAppCommonDepsPromise = (async () => {
            var subChecksL1 = [];
            // AzureWebJobsStorage 
            var propertyName = "AzureWebJobsStorage";
            // Using anchor tag instead of markdown link as we need the link to open in a new window/tab instead of the current iFrame which is disallowed
            var failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#azurewebjobsstorage" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            var connectionString = appSettings[propertyName];
            if (connectionString != undefined) {
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to Azure storage endpoint configured in app setting "${propertyName}" was successful.` :
                                                 `Network connectivity test to Azure storage endpoint configured in app setting "${propertyName}" failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            } else {
                subChecksL1.push({
                    title: `The app setting "${propertyName}" is not configured.  The Function App cannot work without this essential setting.`,
                    level: 2,
                    detailsMarkdown: failureDetailsMarkdown
                });
            }

            // WEBSITE_CONTENTAZUREFILECONNECTIONSTRING
            propertyName = "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING";
            failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#website_contentazurefileconnectionstring" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            connectionString = appSettings[propertyName];
            if (connectionString != undefined) {
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to the Azure storage endpoint configured in app setting "${propertyName}" was successful.` :
                                                 `Network connectivity test to the Azure storage endpoint configured in app setting "${propertyName}" failed.  `
                                                 + "This can result in the Function App not starting up.";
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            } // Optional setting

            // WEBSITE_RUN_FROM_PACKAGE
            propertyName = "WEBSITE_RUN_FROM_PACKAGE";
            failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#website_run_from_package" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            connectionString = appSettings[propertyName];
            if (connectionString != undefined && connectionString != "0" && connectionString != "1") {
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to the endpoint configured in app setting "${propertyName}" was successful.` :
                                                 `Network connectivity test to the endpoint configured in app setting "${propertyName}" failed.  `
                                                 + "This can result in the Function App not starting up.";
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            } // Optional setting

            propertyName = "APPLICATIONINSIGHTS_CONNECTION_STRING";
            failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#applicationinsights_connection_string" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            connectionString = appSettings[propertyName];
            if (connectionString != undefined) {
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to the Application Insights endpoint was successful.` :
                                                 `Detected integration with Application insights but network connectivity test to Application Insights failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            } // Optional setting

            var maxCheckLevel = getMaxCheckLevel(subChecksL1);
            var title = maxCheckLevel == 0 ? "Network connectivity tests to common Function App dependencies were successful" :
                                             "Network connectivity tests to common Function App dependencies failed.";
            return new CheckStepView({ title: title, subChecks: subChecksL1, level: maxCheckLevel });
        })(); // end of checkFunctionAppCommonDepsPromise
        
        flowMgr.addView(checkFunctionAppCommonDepsPromise, "Checking common Function App settings...");

        /**
         * Function binding dependencies
         **/
        var checkFunctionBindingsPromise = (async () => {
            // Explore the binding information of all functions in this function app to determine connection string
            var functionsInfo = [];  // array of maps containing information about functions
            var functionAppResourceId = siteInfo["resourceUri"];
            var functionsList = await diagProvider.getArmResourceAsync(functionAppResourceId + "/functions");
            if (functionsList != undefined && functionsList.value != undefined) {
                return new InfoStepView({ infoType: 0, title: "No functions were found for this Function App" });
            }

            functionsList.value.forEach(func => {
                var functionInfo = { name: func.name, connectionStringProperties: [] };
                func.properties.config.bindings.forEach(binding => {
                    if( binding.connection != undefined) {
                        functionInfo.connectionStringProperties.push(binding.connection);
                    } else if( binding.connectionStringSetting != undefined) { // CosmosDB
                        functionInfo.connectionStringProperties.push(binding.connectionStringSetting);
                    }
                });
                if(functionInfo.connectionStringProperties.length > 0) {
                    functionsInfo.push(functionInfo);
                }
            });
            var subChecksL1 = [];
            var promises = functionsInfo.map(async (functionInfo) => {
                var subChecksL2 = []; // These are the checks (and subchecks) for each binding of a function
                var promises = functionInfo.connectionStringProperties.map(async (propertyName) => {
                    var connectionString = appSettings[propertyName];
                    (await networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider)).forEach(item => subChecksL2.push(item));
                });
                await Promise.all(promises);
                var functionName = functionInfo.name.split("/").length < 2 ? functionInfo.name : functionInfo.name.split("/")[1];
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Function "${functionName}" - all network connectivity tests were successful.` :
                                                 `Function "${functionName}" - network connectivity tests failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            });

            await Promise.all(promises);

            var maxCheckLevel = getMaxCheckLevel(subChecksL1);
            var title = maxCheckLevel == 0 ? "Network connectivity tests for all Function input/output bindings were successful." :
                                             "Network connectivity tests failed for some Function input/output bindings.";
            return new CheckStepView({ title: title, subChecks: subChecksL1, level: maxCheckLevel });
        })();

        flowMgr.addView(checkFunctionBindingsPromise, "Checking all Function bindings...");

        // General information about checks as positive will not always mean the app has no issues
        flowMgr.addView(new InfoStepView({
            infoType: 0,
            title: "Explanation of the results and recommended next steps",
            markdown: "Positive tests above indicate a network layer connection was successfully established between this app and the configured remote service."
            + "\r\n\r\n" + "If the tests passed and your app is still having runtime connection failures with this endpoint, possible reasons could be:"
            + "\r\n\r\n" + "-  There were authentication issues and the credentials involved have expired or are invalid. Only network connectivity was tested."
            + "\r\n\r\n" + "-  The application setting was configured as a key vault reference and this diagnostics tool does not retrieve secrets from Key Vault.  Check application logs to debug further."
            + "\r\n\r\n" + "-  The target endpoint/service is not available intermittently."
        }));
    }
};

function isKeyVaultReference(appSetting) {
    return appSetting.includes("@Microsoft.KeyVault");
}

function getMaxCheckLevel(subChecks) {
    var maxCheckLevel = 0;
    subChecks.forEach(check => maxCheckLevel = Math.max(maxCheckLevel, check.level));
    return maxCheckLevel;
}

async function networkCheckConnectionString(propertyName, connectionString, dnsServers, diagProvider, failureDetailsMarkdown = undefined) {
    var subChecks = [];
    if(!isKeyVaultReference(connectionString)) {
        var hostPort = extractHostPortFromConnectionString(connectionString);

        if (hostPort.HostName != undefined && hostPort.Port != undefined) {
            var connectivityCheckResult = await runConnectivityCheckAsync(hostPort.HostName, hostPort.Port, dnsServers, diagProvider, hostPort.HostName.length, failureDetailsMarkdown);
            var maxCheckLevel = getMaxCheckLevel(connectivityCheckResult);
            var title = maxCheckLevel == 0 ? `Successfully accessed the endpoint "${hostPort.HostName}:${hostPort.Port}" configured in App Setting "${propertyName}"` :
                                             `Could not access the endpoint "${hostPort.HostName}:${hostPort.Port}" configured in App Setting "${propertyName}".`;
            subChecks.push({ title: title, level: maxCheckLevel, subChecks: connectivityCheckResult  });
        } else { // Unsupported or invalid connection string format
            var title = `Unable to parse the connection string configured in the App Setting "${propertyName}".  It is either not supported by this troubleshooter or invalid.`;
            if (failureDetailsMarkdown != undefined) {
                subChecks.push({ title: title, level: 2, detailsMarkdown: failureDetailsMarkdown });
            } else {
                subChecks.push({ title: title, level: 2 });
            }
        }
    } else {
        var res = await networkCheckKeyVaultReferenceAsync(propertyName, connectionString, dnsServers, diagProvider);
        res.forEach(item => subChecks.push(item));
    }
    return subChecks;
}

async function networkCheckKeyVaultReferenceAsync(propertyName, connectionString, dnsServers, diagProvider) {
    var failureDetailsMarkdown = 'Please refer to <a href= "https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references#reference-syntax" target="_blank">this documentation</a> to configure the Key Vault reference correctly.'
    var subChecks = [];
    var hostPort = extractHostPortFromKeyVaultReference(connectionString);
    if (hostPort.HostName != undefined && hostPort.Port != undefined) {
        var connectivityCheckResult = await runConnectivityCheckAsync(hostPort.HostName, hostPort.Port, dnsServers, diagProvider, hostPort.HostName.length, failureDetailsMarkdown);
        var maxCheckLevel = getMaxCheckLevel(connectivityCheckResult);
        if(maxCheckLevel == 0) {
            subChecks.push({
                title: `Network access validation of connection strings configured as key vault references are currently not supported.  Network access to the Key Vault service referenced in the App Setting "${propertyName}" was verified. Recommend checking application logs for connectivity to the endpoint.`,
                level: 1,
                subChecks: connectivityCheckResult
            });
        } else {
            subChecks.push({
                title: `The Key Vault endpoint "${hostPort.HostName}:${hostPort.Port}" referenced in the App Setting "${propertyName}" could not be reached".`,
                level: maxCheckLevel,
                subChecks: connectivityCheckResult
            });
        }
    } else {
        subChecks.push({
            title: `The Key Vault reference in the App Setting "${propertyName}" could not be parsed.`,
            level: 2,
            detailsMarkdown: failureDetailsMarkdown
        });
    }
    return subChecks;
}

async function checkNetworkConfigAndConnectivityAsync(siteInfo, diagProvider, flowMgr, data, permMgr) {
    var subnetDataPromise = data.subnetDataPromise;
    var serverFarmId = data.serverFarmId;
    var kuduReachablePromise = data.kuduReachablePromise;
    var kuduReachable = null;
    var dnsServers = [];

    var views = [], subChecks = [];
    var level = 0, skipReason = null;
    var titlePostfix = "";
    var configCheckView = new CheckStepView({
        title: "Network Configuration is healthy",
        level: 0
    });
    views.push(configCheckView);
    var subnetSizeCheckPromise = checkSubnetSizeAsync(diagProvider, subnetDataPromise, serverFarmId, permMgr);
    var dnsCheckResultPromise = checkDnsSettingAsync(siteInfo, diagProvider);
    var appSettings = await diagProvider.getAppSettings();
    var vnetRouteAll = (appSettings["WEBSITE_VNET_ROUTE_ALL"] === "1");

    if (vnetRouteAll) {
        subChecks.push({ title: "WEBSITE_VNET_ROUTE_ALL is set to 1, all traffic will be routed to VNet", level: 3 });
    } else {
        subChecks.push({ title: "WEBSITE_VNET_ROUTE_ALL is not set or set to 0, only private network traffic(RFC1918) will be routed to VNet", level: 3 });
    }

    var subnetSizeResult = await subnetSizeCheckPromise;
    if (subnetSizeResult != null) {
        if (subnetSizeResult.checkResult.level == 1) {
            level = 1;
        }
        views = views.concat(subnetSizeResult.views);
        subChecks.push(subnetSizeResult.checkResult);
    }

    kuduReachable = await kuduReachablePromise;
    if (kuduReachable) {
        var dnsCheckResult = await dnsCheckResultPromise;
        dnsServers = dnsCheckResult.dnsServers;
        views = views.concat(dnsCheckResult.views);
        subChecks = subChecks.concat(dnsCheckResult.subChecks);
        if (dnsServers.length === 0) {
            level = 2;
        } else if (dnsCheckResult.level == 1) {
            level = Math.max(level, 1);
        }
    } else {
        subChecks.push({ title: "DNS check was skipped due to having no access to Kudu", level: 3 });
        if (subnetSizeResult != null) {
            titlePostfix = " (incomplete result)";
        } else {
            // no check is done
            skipReason = "Kudu is inaccessible";
            level = 3;
        }
    }

    if (level == 1) {
        configCheckView.title = "Network Configuration is suboptimal";
        configCheckView.level = 1;
    } else if (level == 2) {
        configCheckView.title = "Network Configuration is unhealthy";
        configCheckView.level = 2;
    } else if (level == 3) {
        configCheckView.title = `Network Configuration checks are skipped due to ${skipReason}`;
        configCheckView.level = 3;
    }
    configCheckView.title += titlePostfix;
    configCheckView.subChecks = subChecks;
    return views;
}

async function runConnectivityCheckAsync(hostname, port, dnsServers, diagProvider, lengthLimit, failureDetailsMarkdown = undefined) {
    var fellbackToPublicDns = false;
    var nameResolvePromise = (async function checkNameResolve() {
        var ip = null;
        var checkResultsMarkdown = [];
        if (diagProvider.isIp(hostname)) {
            ip = hostname;
        } else {
            for (var i = 0; i < dnsServers.length; ++i) {
                var result = await diagProvider.nameResolveAsync(hostname, dnsServers[i]).catch(e => {
                    logDebugMessage(e);
                    return {};
                });
                var dns = (dnsServers[i] == "" ? "Azure DNS server" : `DNS server ${dnsServers[i]}`);
                if (result.ip != null) {
                    if (dnsServers[i] == "") {
                        fellbackToPublicDns = true;
                    }
                    ip = result.ip;
                    checkResultsMarkdown.push(`Successfully resolved hostname **${hostname}** with ${dns}`);
                    break;
                } else {
                    checkResultsMarkdown.push(`Failed to resolve hostname **${hostname}** with ${dns}`);
                }
            }
        }
        return { ip, checkResultsMarkdown };
    })();

    var tcpPingPromise = diagProvider.tcpPingAsync(hostname, port).catch(e => {
        logDebugMessage(e);
        return {};
    });

    await Promise.all([nameResolvePromise, tcpPingPromise]);

    // DNS name resolution validation
    var nameResolveResult = await nameResolvePromise;
    var resolvedIp = nameResolveResult.ip;
    var resultsMarkdown = nameResolveResult.checkResultsMarkdown;

    var subChecks = [];

    if (resolvedIp != hostname) {
        hostname = hostname.length > lengthLimit ? hostname.substr(0, lengthLimit) + "..." : hostname;
        if (resolvedIp == null) {
            var markdown = "Results:"
            resultsMarkdown.forEach(element => markdown += "\r\n- " + element);
            markdown += `\r\n\r\nPossible reasons can be:` +
            `\r\n\-  hostname **${hostname}** does not exist, please double check that the hostname is correct.` +
            (dnsServers.filter(s => s != "").length == 0 ? "" : `\r\n\-  Your custom DNS server was used for resolving hostname, but there is no DNS entry on the server for **${hostname}**, please check your DNS server.`) +
            "\r\n\-  If your target endpoint is an Azure service with Private Endpoint enabled, please check its Private Endpoint DNS Zone settings.";
            if (failureDetailsMarkdown != undefined) {
                markdown += "\r\n\r\n" + failureDetailsMarkdown
            }
            subChecks.push({ 
                title: `Failed to resolve the IP of ${hostname}`,
                level: 2,
                detailsMarkdown: markdown
             });

            return subChecks;
        }
    }

    // TCP Ping checks
    var tcpPingResult = await tcpPingPromise;
    var status = tcpPingResult.status;
    if (status == 0) {
        // Suppress successful checks to avoid clutter
        //subChecks.push({ title: `TCP ping to ${hostname} was successful`, level: 0 });
    } else if (status == 1) {
        var markdown = `Connectivity test failed at TCP level for hostname **${hostname}** via resolved IP address ${resolvedIp}.  ` +
        "This means the endpoint was not reachable at the network transport layer. Possible reasons can be:" +
        "\r\n\-  The endpoint does not exist, please double check the hostname:port or ip:port was correctly set." +
        "\r\n\-  The endpoint is not reachable from the VNet, please double check if the endpoint server is correctly configured." +
        "\r\n\-  There is a TCP level firewall or a Network Security Group Rule blocking the traffic from this app. Please check your firewall or NSG rules if there are any." +
        "\r\n\-  WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS setting is not supported by this connectivity check yet, if custom DNS server fails to resolve the hostname, the check will fail.";
        if (failureDetailsMarkdown != undefined) {
            markdown += "\r\n\r\n" + failureDetailsMarkdown
        }
        subChecks.push({ 
            title: `TCP ping to ${hostname} via IP address ${resolvedIp} failed because the target is unreachable.`, 
            level: 2,
            detailsMarkdown: markdown
        });
    } else {
        subChecks.push({ 
            title: `TCP ping to ${hostname} failed with an errorcode:${status}.`, 
            level: 2,
            detailsMarkdown: 'Encountered an unknown problem, please send us feedback via the ":) Feedback" button above.'
         });
    }
    return subChecks;
}


