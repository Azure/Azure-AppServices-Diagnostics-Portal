import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { checkKuduAvailabilityAsync, checkVnetIntegrationV2Async, checkDnsSettingV2Async, checkAppSettingsAsync, extractHostPortFromConnectionString, extractHostPortFromKeyVaultReference } from './flowMisc.js';
import { VnetIntegrationConfigChecker } from './vnetIntegrationConfigChecker.js';
import { VnetDnsWordings } from './vnetDnsWordings.js';

export class ConnectionStringType {
    static get StorageAccount() { return 'StorageAccount' };
    static get BlobStorageAccount() { return 'BlobStorageAccount' };
    static get QueueStorageAccount() { return 'QueueStorageAccount' };
    static get FileShareStorageAccount() { return 'FileShareStorageAccount' };
    static get ServiceBus() { return 'ServiceBus' };
    static get EventHubs() { return 'EventHubs' };
        
}

export var functionsFlow = {
    title: "Connectivity issues",
    async func(siteInfo, diagProvider, flowMgr) {

        var isKuduAccessiblePromise = checkKuduAvailabilityAsync(diagProvider, flowMgr);
        var dnsServers = null;
        var vnetConfigChecker = new VnetIntegrationConfigChecker(siteInfo, diagProvider);
        var vnetIntegrationType = await vnetConfigChecker.getVnetIntegrationTypeAsync();
        var isVnetIntegrated = (vnetIntegrationType != null && vnetIntegrationType != "none");
        if (isVnetIntegrated) {
            var isVnetIntegrationHealthy = await checkVnetIntegrationV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise);

            // TODO: separate common code between this and connectionFailureFlow.js
            // Don't run the network config check if the app is not VNet joined
            if (isVnetIntegrationHealthy) {
                var dnsSettings = [];
                await checkDnsSettingV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise, dnsSettings);
                checkAppSettingsAsync(siteInfo, diagProvider, flowMgr);
                dnsServers = dnsSettings;
            } else {
                return;
            }
        } else {
            dnsServers = [""]; //default Azure DNS
        }

        if (!await isKuduAccessiblePromise)
        {
            flowMgr.addView(new VnetDnsWordings().cannotCheckWithoutKudu.get("Functions settings"));
            return;
        }
        
        var daasVersionInfo=await diagProvider.getDaasVersion(); 
        if(daasVersionInfo.status == "200")
        {
            var isDaasExtAccessible= true;
        }
        else
        {
            var isDaasExtAccessible= false;
        }  
             
        var daasVersion=daasVersionInfo.body.Version;        
        var isDaasNew=false; 
if(isDaasExtAccessible == true){
function versionCompare(v1, v2) 
{ 
    var vnum1 = 0, vnum2 = 0; 
    for (var i = 0, j = 0; (i < v1.length 
                            || j < v2.length);) { 
        while (i < v1.length && v1[i] != '.') { 
            vnum1 = vnum1 * 10 + (v1[i] - '0'); 
            i++; 
        } 
        while (j < v2.length && v2[j] != '.') { 
            vnum2 = vnum2 * 10 + (v2[j] - '0'); 
            j++; 
        } 
        if (vnum1 > vnum2) 
            return 1; 
        if (vnum2 > vnum1) 
            return -1;
        vnum1 = vnum2 = 0; 
        i++; 
        j++; 
    } 
    return 0; 
} 
var version1 = daasVersion; 
var version2 = "2.2.1221.01";
if (versionCompare(version1, version2) >= 0) {
        isDaasNew = true;
        } 
else{
        isDaasNew = false;
    }
}
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
            var connectionString = undefined;        
            if(isDaasNew){
                var connectionStringType = isDaasExtAccessible ? ConnectionStringType.BlobStorageAccount : undefined;
            }else{
                var connectionStringType = isDaasExtAccessible ? ConnectionStringType.StorageAccount : undefined;
            }                
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, connectionStringType, dnsServers, diagProvider, isVnetIntegrated, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to Azure storage endpoint configured in app setting "${propertyName}" was successful.` :
                    `Network connectivity test to Azure storage endpoint configured in app setting "${propertyName}" failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
           
            // WEBSITE_CONTENTAZUREFILECONNECTIONSTRING
            propertyName = "WEBSITE_CONTENTAZUREFILECONNECTIONSTRING";
            failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#website_contentazurefileconnectionstring" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            connectionString = undefined;
            if(isDaasNew){
                var connectionStringType = isDaasExtAccessible ? ConnectionStringType.FileShareStorageAccount : undefined;
            }else{
                var connectionStringType = isDaasExtAccessible ? ConnectionStringType.StorageAccount : undefined;
            }            
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, connectionStringType, dnsServers, diagProvider, isVnetIntegrated, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to the Azure storage endpoint configured in app setting "${propertyName}" was successful.` :
                    `Network connectivity test to the Azure storage endpoint configured in app setting "${propertyName}" failed.  `
                    + "This can result in the Function App not starting up.";
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
             // Optional setting

            // WEBSITE_RUN_FROM_PACKAGE
            propertyName = "WEBSITE_RUN_FROM_PACKAGE";
            failureDetailsMarkdown = `Please refer to <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-app-settings#website_run_from_package" target="_blank">this documentation</a> on how to configure the app setting "${propertyName}".`;
            connectionString = appSettings[propertyName];
            if (connectionString != undefined && connectionString != "0" && connectionString != "1") {
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, undefined, dnsServers, diagProvider, isVnetIntegrated, failureDetailsMarkdown);
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
                var subChecksL2 = await networkCheckConnectionString(propertyName, connectionString, undefined, dnsServers, diagProvider, isVnetIntegrated, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Network connectivity test to the Application Insights endpoint was successful.` :
                    `Detected integration with Application insights but network connectivity test to Application Insights failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            } // Optional setting

            var maxCheckLevel = getMaxCheckLevel(subChecksL1);
            var subChecksL1final = [{
                title: "Network connectivity evaluation is not extensive, you may still experience problems with the App. See explanation at bottom of page.",
                level: 1
            }];
            subChecksL1.forEach(item => subChecksL1final.push(item));
            var title = maxCheckLevel == 0 ? "Evaluated network connectivity for common Function App dependencies." :
                "Network connectivity tests to common Function App dependencies failed.";
            maxCheckLevel = maxCheckLevel == 0 ? 3 : maxCheckLevel;
            return new CheckStepView({ title: title, subChecks: subChecksL1final, level: maxCheckLevel });
        })(); // end of checkFunctionAppCommonDepsPromise

        flowMgr.addView(checkFunctionAppCommonDepsPromise, "Checking common Function App settings...");
        await checkFunctionAppCommonDepsPromise;

        /**
         * Function binding dependencies
         **/
        var checkFunctionBindingsPromise = (async () => {
            // Explore the binding information of all functions in this function app to determine connection string
            var functionsInfo = [];  // array of maps containing information about functions
            var functionAppResourceId = siteInfo["resourceUri"];
            var functionsList = await diagProvider.getArmResourceAsync(functionAppResourceId + "/functions");
            if (functionsList == undefined || functionsList.value == undefined) {
                return new CheckStepView({
                    title: "Could not get the list of functions in this Function App.",
                    detailsMarkdown: "If retrying does not work, the app is most likely in an unhealthy state.  Please check the values configured in the app settings **AzureWebJobsStorage** and **WEBSITE_CONTENTAZUREFILECONNECTIONSTRING** point to an existing storage account and that it is accessible by the Function app using the checks above.",
                    level: 2
                });
            }
            if (functionsList.value.length == 0) {
                return new InfoStepView({ infoType: 0, title: "No functions were found for this Function App" });
            }

            functionsList.value.forEach(func => {
                var functionInfo = { name: func.name, bindings: [] };
                func.properties.config.bindings.forEach(binding => {
                    var bindingInfo = { name: binding.name, type: binding.type, connectionStringProperty: undefined, connectionString: undefined }

                    if (binding.connection != undefined) {
                        bindingInfo.connectionStringProperty = binding.connection;
                    } else if (binding.connectionStringSetting != undefined) { // CosmosDB
                        bindingInfo.connectionStringProperty = binding.connectionStringSetting;
                    }
                    
                    if (binding.type == "serviceBusTrigger" && binding.topicName != undefined) {         // Service Bus topic
                        binding.entityName= binding.topicName                                
                            } else if (binding.type == "serviceBusTrigger" && binding.queueName != undefined) {  // Service Bus queue
                                binding.entityName= binding.queueName
                            } else if (binding.type == "eventHubTrigger" && binding.eventHubName != undefined) { // Event Hubs
                                binding.entityName= binding.eventHubName
                            }
                            bindingInfo.entityName=binding.entityName;
                            functionInfo.bindings.push(bindingInfo);   
                });
                if (functionInfo.bindings.length > 0) {
                    functionsInfo.push(functionInfo);
                }
            });
            if (functionsInfo.length == 0) {
                return new InfoStepView({ infoType: 0, title: "No functions with configured connection strings were found for this Function App" });
            }
            var subChecksL1 = [];

            var promisesL1 = functionsInfo.map(async (functionInfo) => {
                var subChecksL2 = []; // These are the checks (and subchecks) for each binding of a function
                var promisesL2 = functionInfo.bindings.map(async (binding) => {
                    var connectionString = binding.connectionString;
                    var failureDetailsMarkdown = undefined;                    
                    // An undefined connectionStringType parameter causes the old tcpping validation to apply
                    if(isDaasNew){
                        var connectionStringType = isDaasExtAccessible ? bindingTypeToConnectionStringType(binding.type,isDaasNew) : undefined;
                    }else{
                        var connectionStringType = isDaasExtAccessible ? bindingTypeToConnectionStringType(binding.type) : undefined;
                    }                   
                        (await networkCheckConnectionString(binding.connectionStringProperty, 
                                                            connectionString, 
                                                            connectionStringType, 
                                                            dnsServers, 
                                                            diagProvider, 
                                                            isVnetIntegrated,
                                                            failureDetailsMarkdown,
                                                            binding.entityName)).forEach(item => {
                                                                item.title = `Binding "${binding.name}" - ` + item.title;
                                                                subChecksL2.push(item);
                                                            });
                   
                });
                await Promise.all(promisesL2);
                var functionName = functionInfo.name.split("/").length < 2 ? functionInfo.name : functionInfo.name.split("/")[1];
                var maxCheckLevel = getMaxCheckLevel(subChecksL2);
                var title = maxCheckLevel == 0 ? `Function "${functionName}" - all network connectivity tests were successful.` :
                    `Function "${functionName}" - network connectivity tests failed.`;
                subChecksL1.push({ title: title, subChecks: subChecksL2, level: maxCheckLevel });
            });

            await Promise.all(promisesL1);

            var maxCheckLevel = getMaxCheckLevel(subChecksL1);
            var title = maxCheckLevel == 0 ? "Evaluated network connectivity for all Function input/output bindings." :
                "Network connectivity tests failed for some Function input/output bindings.";
            maxCheckLevel = maxCheckLevel == 0 ? 3 : maxCheckLevel;
            var subChecksL1final = [{
                title: "Network connectivity evaluation is not extensive, you may still experience problems with the App. See explanation at bottom of page.",
                level: 1
            }];
            subChecksL1.forEach(item => subChecksL1final.push(item));

            return new CheckStepView({ title: title, subChecks: subChecksL1final, level: maxCheckLevel });
        })();

        flowMgr.addView(checkFunctionBindingsPromise, "Checking all Function bindings...");
        await checkFunctionBindingsPromise;

        // General information about checks as positive will not always mean the app has no issues
        flowMgr.addView(new InfoStepView({
            infoType: 0,
            title: "Explanation of the results and recommended next steps",
            markdown: "Other than for Storage, Service Bus and Event Hubs dependencies, positive tests above indicate a network layer connection was successfully established between this app and the configured remote service."
                + "\r\n\r\n" + "If the tests passed and your app is still having runtime connection failures with this endpoint, possible reasons could be:"
                + "\r\n\r\n" + "-  Firewall rules configured on Function App binding resource are blocking access to the Function App. Refer to this [troubleshooting guide](https://docs.microsoft.com/en-us/azure/azure-functions/functions-networking-options#debug-access-to-virtual-network-hosted-resources) to further debug the issue."
                + "\r\n\r\n" + "-  There were authentication issues and the credentials involved have expired or are invalid. Only network connectivity was tested."
                + "\r\n\r\n" + "-  The application setting was configured as a key vault reference and this diagnostics tool does not retrieve secrets from Key Vault.  Check application logs to debug further."
                + "\r\n\r\n" + "-  The target endpoint/service is not available intermittently."
                + "\r\n\r\n" + "Note: If a resource has a private endpoint setup, the resource's endpoint is not publicly addressable (DNS lookup fails) and if the private endpoint does not allow network connectivity from this Function App the network connectivity test will report a \"Resource not found\"."
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

async function networkCheckConnectionString(propertyName, connectionString, connectionStringType = undefined, dnsServers, diagProvider, isVnetIntegrated, failureDetailsMarkdown = undefined, entityName=undefined) {
    var subChecks = [];

        if (connectionStringType == ConnectionStringType.StorageAccount ||
            connectionStringType == ConnectionStringType.BlobStorageAccount ||
            connectionStringType == ConnectionStringType.QueueStorageAccount ||
            connectionStringType == ConnectionStringType.FileShareStorageAccount ||            
            connectionStringType == ConnectionStringType.ServiceBus ||
            connectionStringType == ConnectionStringType.EventHubs)
        {
            /*
             * Full connection string validation via DaaS Extension
             */
            var connectivityCheckResult = await validateConnectionViaAppSetting(propertyName, connectionString, connectionStringType, diagProvider, failureDetailsMarkdown, entityName);
            var maxCheckLevel = getMaxCheckLevel(connectivityCheckResult);            
            var service;
            switch (connectionStringType) {
                case ConnectionStringType.StorageAccount:
                    service = "Storage account"; break;
                case ConnectionStringType.BlobStorageAccount:
                    service = "Blob Storage account"; break;
                case ConnectionStringType.QueueStorageAccount:
                    service = "Queue Storage account"; break;
                case ConnectionStringType.FileShareStorageAccount:
                    service = "File Share Storage account"; break;               
                case ConnectionStringType.ServiceBus:
                    service = "Service Bus"; break;
                case ConnectionStringType.EventHubs:
                    service = "Event Hubs"; break;
                   
            }
            var title = maxCheckLevel == 0 ? `Successfully connected to the ${service} resource configured in App Setting "${propertyName}".` :
                `Connection attempt to the ${service} resource configured in App Setting "${propertyName}" failed.`;
            subChecks.push({ title: title, level: maxCheckLevel, subChecks: connectivityCheckResult });
        } else {
            /*
             * tcpping based validation
             */
            var hostPort = extractHostPortFromConnectionString(connectionString);

            if (hostPort.HostName != undefined && hostPort.Port != undefined) {
                var connectivityCheckResult = await runConnectivityCheckAsync(hostPort.HostName, hostPort.Port, dnsServers, diagProvider, undefined, isVnetIntegrated, failureDetailsMarkdown);
                var maxCheckLevel = getMaxCheckLevel(connectivityCheckResult);
                var title = maxCheckLevel == 0 ? `Successfully accessed the endpoint "${hostPort.HostName}:${hostPort.Port}" configured in App Setting "${propertyName}"` :
                    `Could not access the endpoint "${hostPort.HostName}:${hostPort.Port}" configured in App Setting "${propertyName}".`;
                subChecks.push({ title: title, level: maxCheckLevel, subChecks: connectivityCheckResult });
            } else { // Unsupported or invalid connection string format
               
            var title = `Unable to parse the connection string configured in the App Setting "${propertyName}".  It is either not supported by this troubleshooter or invalid.`;
            if (failureDetailsMarkdown != undefined) {
                subChecks.push({ title: title, level: 2, detailsMarkdown: failureDetailsMarkdown });
            } else {
                subChecks.push({ title: title, level: 2 });
            }       
                
            }
         }
        
      
    return subChecks;
}

async function networkCheckKeyVaultReferenceAsync(propertyName, connectionString, dnsServers, diagProvider, isVnetIntegrated) {
    var failureDetailsMarkdown = 'Please refer to <a href= "https://docs.microsoft.com/en-us/azure/app-service/app-service-key-vault-references#reference-syntax" target="_blank">this documentation</a> to configure the Key Vault reference correctly.'
    var subChecks = [];
    var hostPort = extractHostPortFromKeyVaultReference(connectionString);
    if (hostPort.HostName != undefined && hostPort.Port != undefined) {
        var connectivityCheckResult = await runConnectivityCheckAsync(hostPort.HostName, hostPort.Port, dnsServers, diagProvider, undefined, isVnetIntegrated, failureDetailsMarkdown);
        var maxCheckLevel = getMaxCheckLevel(connectivityCheckResult);
        if (maxCheckLevel == 0) {
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

async function runConnectivityCheckAsync(hostname, port, dnsServers, diagProvider, lengthLimit = 50, isVnetIntegrated, failureDetailsMarkdown = undefined) {
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
                `\r\n\-  The hostname **${hostname}** does not exist, please double check that the hostname is correct.`;
            if (isVnetIntegrated) {
                markdown += (dnsServers.filter(s => s != "").length == 0 ? "" : `\r\n\-  Your custom DNS server was used for resolving hostname, but there is no DNS entry on the server for **${hostname}**, please check your DNS server.`) +
                    '\r\n\-  If your target endpoint is an Azure service with Private Endpoint enabled, please check its <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-networking-options#azure-dns-private-zones" target="_blank">Private Endpoint DNS Zone settings</a>.' +
                    '\r\n\r\nThis <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-networking-options#troubleshooting" target="_blank">troubleshooting guide</a> may help you in debugging the issue further.';
            }
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
            '\r\n\-  If your target endpoint is an Azure service, please check its network configuration to confirm that access to public endpoints is not restricted by firewall rules.';
        if (isVnetIntegrated) {
            markdown += "\r\n\-  The endpoint is not reachable from the VNet, please double check if the endpoint server is correctly configured." +
                "\r\n\-  There is a TCP level firewall or a Network Security Group Rule blocking the traffic from this app. Please check your firewall or NSG rules if there are any." +
                "\r\n\-  WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS setting is not supported by this connectivity check yet, if custom DNS server fails to resolve the hostname, the check will fail." +
                '\r\n\r\nThis <a href= "https://docs.microsoft.com/en-us/azure/azure-functions/functions-networking-options#troubleshooting" target="_blank">troubleshooting guide</a> may help you in debugging the issue further.';
        }
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
            title: `TCP ping to ${hostname} failed with an error code:${status}.`,
            level: 2,
            detailsMarkdown: 'Encountered an unknown problem, please send us feedback via the ":) Feedback" button above.'
        });
    }
    return subChecks;
}

async function validateConnectionStringAsync(propertyName, connectionString, type, diagProvider, failureDetailsMarkdown = undefined) {
    var checkConnectionStringResult = await diagProvider.checkConnectionStringAsync(connectionString, type).catch(e => {    
    logDebugMessage(e);          
    });

    var subChecks = [];

    // Suppress successful checks to avoid clutter
    if (checkConnectionStringResult == undefined) {
        subChecks.push({
            title: `Validation of connection string failed due to an internal error. Please send us feedback via the "Feedback" button above."`,
            level: 2,
        })
    } else if (checkConnectionStringResult.StatusText != "Success") {
        /* Status enums as of Sep 2021
         *  Success,
         *  AuthFailure,
         *  ContentNotFound,
         *  Forbidden,
         *  UnknownResponse,
         *  EndpointNotReachable,
         *  ConnectionFailure,
         *  DnsLookupFailed,
         *  MsiFailure,
         *  EmptyConnectionString,
         *  MalformedConnectionString,
         *  UnknownError
         */
        var service, title;
        var detailsMarkdown = "";
        switch (type) {
            case ConnectionStringType.BlobStorageAccount:
                    service = "Blob Storage account"; break;
            case ConnectionStringType.QueueStorageAccount:
                    service = "Queue Storage account"; break; 
            case ConnectionStringType.FileShareStorageAccount:
                    service = "File Share Storage account"; break;       
            case ConnectionStringType.ServiceBus:
                service = "Service Bus"; break;
            case ConnectionStringType.EventHubs:
                service = "Event Hubs"; break;
        }
        switch (checkConnectionStringResult.StatusText)
        {
            case "MalformedConnectionString":
                title = `Invalid connection string`;
                detailsMarkdown = `The connection string configured is invalid (e.g. missing some required elements). Please check the value configured in the app setting "${propertyName}".`;
                break;
            case "EmptyConnectionString":
                title = `The app setting "${propertyName}" was not found or is set to a blank value`
                break;
            case "DnsLookupFailed":
                title = "Resource not found";
                detailsMarkdown = `The ${service} resource specified in the connection string was not found.  Please check the value of the setting.`;
                break;
            case "AuthFailure":
                title = "Authentication failure";
                detailsMarkdown = `Authentication failure - the credentials in the configured connection string are either invalid or expired. Please update the app setting with a valid connection string.`;
                break;
            case "Forbidden":
                // Some authentication failures come through as Forbidden so check the exception data
                if(checkConnectionStringResult.Exception != undefined && 
                   checkConnectionStringResult.Exception.RequestInformation != undefined && 
                   JSON.stringify(checkConnectionStringResult.Exception.RequestInformation).includes("AuthenticationFailed")) {
                    title = "Authentication failure";
                    detailsMarkdown = `Authentication failure - the credentials in the configured connection string are either invalid or expired. Please update the app setting with a valid connection string.`;
                } else {
                    title = `Access to the ${service} resource is restricted.`;
                    detailsMarkdown = title + `\r\n\r\n` + `This can be due to firewall rules on the resource.  Please check if you have configured firewall rules or a private endpoint and that they correctly allow access from the Function App.  Relevant documentation:`
                        + `\r\n\r\n`;
                    switch (type) {
                        case ConnectionStringType.BlobStorageAccount:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/storage/common/storage-network-security?tabs=azure-portal" target="_blank">Storage account network security</a>`;
                            break;
                        case ConnectionStringType.QueueStorageAccount:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/storage/common/storage-network-security?tabs=azure-portal" target="_blank">Storage account network security</a>`;
                            break;                        
                        case ConnectionStringType.ServiceBus:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/service-bus-messaging/network-security" target="_blank">Service Bus network security</a>`;
                            break;
                        case ConnectionStringType.EventHubs:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/event-hubs/network-security" target="_blank">Event Hubs network security</a>`;
                            break;
                    }
                }
                break;
            default:
                title = `Validation of connection string failed due to an unknown error.  Please send us feedback via the "Feedback" button above.`;
                break;
        }
        // Show the exception message as it contains useful information to fix the issue.  Don't show it unless its accompanied with other explanations.
        detailsMarkdown += (detailsMarkdown != "" && checkConnectionStringResult.Exception ? `\r\n\r\nException encountered while connecting: ${checkConnectionStringResult.Exception.Message}` : undefined);

        subChecks.push({
            title: title,
            level: 2,
            detailsMarkdown: detailsMarkdown
        })
    }
    return subChecks;
}
async function validateConnectionViaAppSetting(propertyName, connectionString, type, diagProvider, failureDetailsMarkdown = undefined,entityName = undefined) {
    var checkConnectionStringResult = await diagProvider.checkConnectionViaAppSetting(propertyName, type, entityName).catch(e => {
        logDebugMessage(e);          
    });

    var subChecks = [];

    // Suppress successful checks to avoid clutter
    if (checkConnectionStringResult == undefined) {
        subChecks.push({
            title: `Validation of connection string failed due to an internal error. Please send us feedback via the "Feedback" button above."`,
            level: 2,
        })
    } else if (checkConnectionStringResult.StatusText != "Success") {
        /* Status enums as of Sep 2021
         *  Success,
         *  AuthFailure,
         *  ContentNotFound,
         *  Forbidden,
         *  UnknownResponse,
         *  EndpointNotReachable,
         *  ConnectionFailure,
         *  DnsLookupFailed,
         *  MsiFailure,
         *  EmptyConnectionString,
         *  MalformedConnectionString,
         *  UnknownError
         */
        var service, title;
        var detailsMarkdown = "";
        switch (type) {
            case ConnectionStringType.BlobStorageAccount:
                    service = "Blob Storage account"; break;
            case ConnectionStringType.QueueStorageAccount:
                    service = "Queue Storage account"; break; 
            case ConnectionStringType.FileShareStorageAccount:
                    service = "File Share Storage account"; break;                    
            case ConnectionStringType.ServiceBus:
                service = "Service Bus"; break;
            case ConnectionStringType.EventHubs:
                service = "Event Hubs"; break;
        }
        switch (checkConnectionStringResult.StatusText)
        {
            case "MalformedConnectionString":
                title = `Invalid connection string`;
                detailsMarkdown = `The connection string configured is invalid (e.g. missing some required elements). Please check the value configured in the app setting "${propertyName}".`;
                break;
            case "EmptyConnectionString":
                title = `The app setting "${propertyName}" was not found or is set to a blank value`
                break;
            case "DnsLookupFailed":
                title = "Resource not found";
                detailsMarkdown = `The ${service} resource specified in the connection string was not found.  Please check the value of the setting.`;
                break;
            case "AuthFailure":
                title = "Authentication failure";
                detailsMarkdown = `Authentication failure - the credentials in the configured connection string are either invalid or expired. Please update the app setting with a valid connection string.`;
                break;
            case "managedidentitymissed":
                title = "Authentication failure";
                detailsMarkdown = `Managedidentity authentication failure - Credential app setting is not set to managedidentity which disallowed checking connection using clientId.`;
                break;
            case "fullyQualifiedNamespacemissed":
                title = "Athentication failure";
                detailsMarkdown = `fullyQualifiedNamespace authentication failure - All required app settings to check the connection have not been provided with valid values.`;
                break;
            case "systemAssignedmanagedidentity":
                title = "Athentication failure";
                detailsMarkdown = `The target service is not provided with Access to the function app using system assigned identity.`;
                break;
            case "userAssignedmanagedidentity":
                title = "Athentication failure";
                detailsMarkdown = `The target service is not provided with access to the user assigned identity which is configured for the function app.`;
                break;
            case "managedIdentityCredential":
                title = "Athentication failure";
                detailsMarkdown = `There is no managed identity configured for the function app.`;
                break;
            case "Forbidden":
                // Some authentication failures come through as Forbidden so check the exception data
                if(checkConnectionStringResult.Exception != undefined && 
                   checkConnectionStringResult.Exception.RequestInformation != undefined && 
                   JSON.stringify(checkConnectionStringResult.Exception.RequestInformation).includes("AuthenticationFailed")) {
                    title = "Authentication failure";
                    detailsMarkdown = `Authentication failure - the credentials in the configured connection string are either invalid or expired. Please update the app setting with a valid connection string.`;
                } else {
                    title = `Access to the ${service} resource is restricted.`;
                    detailsMarkdown = title + `\r\n\r\n` + `This can be due to firewall rules on the resource.  Please check if you have configured firewall rules or a private endpoint and that they correctly allow access from the Function App.  Relevant documentation:`
                        + `\r\n\r\n`;
                    switch (type) {
                        case ConnectionStringType.BlobStorageAccount:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/storage/common/storage-network-security?tabs=azure-portal" target="_blank">Storage account network security</a>`;
                            break;
                        case ConnectionStringType.QueueStorageAccount:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/storage/common/storage-network-security?tabs=azure-portal" target="_blank">Storage account network security</a>`;
                            break;                        
                        case ConnectionStringType.ServiceBus:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/service-bus-messaging/network-security" target="_blank">Service Bus network security</a>`;
                            break;
                        case ConnectionStringType.EventHubs:
                            detailsMarkdown += `<a href= "https://docs.microsoft.com/en-us/azure/event-hubs/network-security" target="_blank">Event Hubs network security</a>`;
                            break;
                    }
                }
                break;
            default:
                title = `Validation of connection string failed due to an unknown error.  Please send us feedback via the "Feedback" button above.`;
                break;
        }
        // Show the exception message as it contains useful information to fix the issue.  Don't show it unless its accompanied with other explanations.
        detailsMarkdown += (detailsMarkdown != "" && checkConnectionStringResult.Exception ? `\r\n\r\nException encountered while connecting: ${checkConnectionStringResult.Exception.Message}` : undefined);

        subChecks.push({
            title: title,
            level: 2,
            detailsMarkdown: detailsMarkdown
        })
    }
    return subChecks;
}


function bindingTypeToConnectionStringType(bindingType,isDaasNew=undefined) {
    switch(bindingType) {
        case "blobTrigger":
            if(isDaasNew){
                return ConnectionStringType.BlobStorageAccount;}
            else{
                return ConnectionStringType.StorageAccount;}            
        case "queueTrigger":
            if(isDaasNew){
                return ConnectionStringType.QueueStorageAccount; }
            else{
                return ConnectionStringType.StorageAccount; }                   
        case "serviceBusTrigger":
            return ConnectionStringType.ServiceBus;
        case "eventHubTrigger":
            return ConnectionStringType.EventHubs;
        default:
            return undefined;
    }
}
