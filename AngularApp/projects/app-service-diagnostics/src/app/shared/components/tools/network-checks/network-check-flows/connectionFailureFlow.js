import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, ButtonStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { checkKuduAvailabilityAsync, checkVnetIntegrationV2Async, checkDnsSettingV2Async, checkAppSettingsAsync } from './flowMisc.js';
import { CommonWordings } from './commonWordings.js';
import { VnetIntegrationConfigChecker } from './vnetIntegrationConfigChecker.js';
import { NameResolvingAndIpWordings } from './nameResolvingAndIpWordings.js';
import { VnetAppSettingChecker } from './vnetAppSettingChecker.js';
export var connectionFailureFlow = {
    title: "Connection issues",
    async func(siteInfo, diagProvider, flowMgr) {
        var isKuduAccessiblePromise = null;
        if (siteInfo.kind.includes("linux") || siteInfo.kind.includes("container")) {
            isKuduAccessiblePromise = false;
        } else {
            isKuduAccessiblePromise = checkKuduAvailabilityAsync(diagProvider, flowMgr);
        }

        var isContinue = await checkVnetIntegrationV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise);
        if (!isContinue) {
            return;
        }

        var isLinuxOrContainer = siteInfo.kind.includes("linux") || siteInfo.kind.includes("container");

        var dnsSettings = [];
        isContinue = await checkDnsSettingV2Async(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise, dnsSettings, isLinuxOrContainer);
        if (!isContinue) {
            return;
        }

        await checkAppSettingsAsync(siteInfo, diagProvider, flowMgr);
       
        checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise, dnsSettings, isLinuxOrContainer);

    }
}

async function runConnectivityCheck(hostname, port, diagProvider, isLinuxOrContainer) {
    var subChecks = [];
    var tcpPingAsync = diagProvider.tcpPingAsync.bind(diagProvider);
    if(isLinuxOrContainer){
        tcpPingAsync = diagProvider.tcpPingNetworkTroubleshooterAsync.bind(diagProvider);
    }
    var tcpPingResult = await tcpPingAsync(hostname, port).catch(e => {
        logDebugMessage(e);
        return {};
    });
    var status = tcpPingResult.status;

    var markdown = null;
    var views = [];

    var msg = `Connecting to ${hostname}:${port} from your App instance`;
    if (status == 0) {
        markdown = "Connectivity test succeeded at TCP level. " +
            "This means Transportation Layer connection was successfully established between this app and the target endpoint. \r\n\r\n" +
            "If your app is still having runtime connection failures with this endpoint, the possible reasons can be: \r\n\r\n" +
            "-  Service is not available, please check the status of your endpoint server.\r\n\r\n" +
            "-  Endpoint firewall blocks Web App or Function App's IP address, please check the IP restriction or application level firewall.\r\n\r\n" +
            "-  The traffic was blocked by Network Security Group or Firewall, please check your NSG or/and Firewall configuration if there is any.\r\n\r\n" +
            "-  The traffic was routed to a wrong destination, please check your User Defined Route Table if there is any.\r\n\r\n" +
            "-  The endpoint is an Azure Resource in a VNet in a different region. ";
        subChecks.push({ title: `TCP ping to ${hostname} was succeeded`, level: 0 });
        views.push(new CheckStepView({
            title: msg + " - OK (TCP level)",
            subChecks: subChecks,
            level: 0
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));
    } else if (status == 1) {
        markdown = "Connectivity test failed at TCP level. " +
            "This means the endpoint was not reachable in Transportation Layer. Possible reasons can be: \r\n\r\n" +
            "-  The endpoint does not exist, please double check the hostname:port or ip:port was correctly set. \r\n\r\n" +
            "-  If the IP address resolved from hostname is no expected, then please check your DNS record configured in your DNS server or private DNS zone. \r\n\r\n" +
            "-  The endpoint is not reachable from the VNet, please double check if the endpoint server is correctly configured. \r\n\r\n" +
            "-  There is a TCP level firewall or a Network Security Group Rule blocking the traffic from this app. Please check your firewall or NSG rules if there are any. \r\n\r\n" +
            "-  WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS setting is not supported by this connectivity check yet, if custom DNS server fails to resolve the hostname, the check will fail.\r\n\r\n";

        subChecks.push({ title: `TCP ping to ${hostname} failed, timeout because target is unreachable`, level: 2 });
        views.push(new CheckStepView({
            title: msg + " - failed, timeout because target is unreachable",
            subChecks: subChecks,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: markdown
        }));

    } else {
        subChecks.push({ title: `TCP ping to ${hostname} failed, errorcode:${status}`, level: 2 });
        views.push(new CheckStepView({
            title: msg + ` - failed, errorcode:${status}`,
            subChecks: subChecks,
            level: 2
        }));
        views.push(new InfoStepView({
            infoType: 1,
            title: "Explanation of the result and recommended next steps",
            markdown: "Unknown problem, please send a feedback to let us know."
        }));

    }
    return views;
}

async function checkNameResolvingAsync(hostname, siteInfo, diagProvider) {
    var isContinue = true;
    var views = [];
    var ips = null;
    var isIp = false;
    var wordings = new NameResolvingAndIpWordings();
    if (diagProvider.isIp(hostname)) {
        ips = [hostname];
        isIp = true;
    }
    else {
        var result = await diagProvider.nameResolveByDaasAsync(hostname).catch(e => {
            logDebugMessage(e);
            return {};
        });

        if (result.ip != null) {
            ips = result.ip.split(';').filter(s => s.length > 0);
            if (ips.length == 0) {
                isContinue = false;
                views = views.concat(wordings.hostNotFound.get(hostname));
            }
        } else {
            isContinue = false;
            views = views.concat(wordings.failedToResolveHostname.get(hostname));
        }
    }
    if (isContinue) {
        var appSettingChecker = new VnetAppSettingChecker(siteInfo, diagProvider);
        var routeAll = await appSettingChecker.getVnetRouteAllAsync();
        var ipResults = ips.filter(ip => diagProvider.isIp(ip, true)).map(ip => [ip, isRfc1918Ip(ip)]).map(p => [p[0], p[1], p[1] || routeAll]);
        views.push(wordings.ipAnalysis.get(isIp ? null : hostname, ipResults));
        var allRouteToVnet = routeAll || ipResults.map(r => r[2]).every(i => i);
        if (allRouteToVnet) {
            views.push(wordings.allIpRouteToVnet.get(hostname));
        } else {
            var allNotRouteToVnet = ipResults.map(r => r[2]).every(i => !i);
            if (allNotRouteToVnet) {
                views = views.concat(wordings.allIpNotRouteToVnet.get(hostname));
            } else {
                views = views.concat(wordings.notAllIpRouteToVnet.get(hostname));
            }
            isContinue = false;
        }
    }
    return { views, isContinue };
}

function isRfc1918Ip(ip) {
    var baseIps = ["10.0.0.0", "172.16.0.0", "192.168.0.0"];
    var masks = ["255.0.0.0", "255.240.0.0", "255.255.0.0"];
    var splitted = ip.split('.').map(i => parseInt(i));
    for (var i = 0; i < 3; ++i) {
        let maskSplitted = masks[i].split('.').map(i => parseInt(i));
        let maskedIp = splitted.map((num, idx) => num & maskSplitted[idx]).join('.');
        if (maskedIp == baseIps[i]) {
            return true;
        }
    }
    return false;
}

async function checkNetworkConfigAndConnectivity(siteInfo, diagProvider, flowMgr, isKuduAccessiblePromise, dnsServers, isLinuxOrContainer) {
    var state = null;
    var isKuduAccessible = await isKuduAccessiblePromise;
    var vnetConfigChecker = new VnetIntegrationConfigChecker(siteInfo, diagProvider);
    var vnetIntegrationType = await vnetConfigChecker.getVnetIntegrationTypeAsync();
    var connectivityCheckViews = (function generateConnectivityCheckViews() {
        if (!isLinuxOrContainer && !isKuduAccessible) {
            return [new CheckStepView({ title: "Connectivity check (tcpping and nameresolver) is not available due to Kudu is inaccessible.", level: 3 })];
        }

        if (dnsServers == null) {
            return [];
        }

        return [new InputStepView({
            title: "Specify an endpoint you want to test connectivity to",
            placeholder: "hostname:port or ip:port",
            buttonText: "Continue",
            entry: "Endpoint",
            text: "",
            tooltip: "e.g. microsoft.com:443 or 8.8.8.8:53\r\ncommon service ports: http - 80; https - 443; sql server - 1433; dns - 53",
            error: null,
            collapsed: false,
            async callback(userInput) {
                userInput = userInput.trim();
                flowMgr.reset(state);
                flowMgr.logEvent("ConnectivityTestTriggered", {});
                const userInputLimitInUI = 50; // only applies to the UI, will show ... if more than 50 chars
                const userInputLimit = 300;
                var splitted = userInput.split(":");
                var hostname, port;

                if (userInput.length > userInputLimit) {
                    this.error = "invalid endpoint";
                    return;
                }

                if (userInput.startsWith("http")) {
                    port = userInput.startsWith("https") ? 443 : 80;
                    var m = userInput.match(/\/\/(.*?)(\/.*|$)/);
                    hostname = (m == null ? null : m[1]);
                    if (hostname == null) {
                        this.error = "invalid endpoint";
                        return;
                    } else {
                        this.text = `${hostname}:${port}`;
                        userInput = this.text;
                        userInput = userInput.length > userInputLimitInUI ? userInput.substr(0, userInputLimitInUI) + "..." : userInput;
                    }
                } else {
                    if (splitted.length != 2 || isNaN(port = parseInt(splitted[1]))) {
                        this.error = "invalid endpoint";
                        return;
                    } else {
                        this.error = null;
                        hostname = splitted[0];
                        userInput = userInput.length > userInputLimitInUI ? userInput.substr(0, userInputLimitInUI) + "..." : userInput;
                    }
                }
                var isContinue = true;
                if (vnetIntegrationType == "swift" && !isLinuxOrContainer) {
                    var nameResolvingPromise = checkNameResolvingAsync(hostname, siteInfo, diagProvider);
                    flowMgr.addViews(nameResolvingPromise.then(p => p.views), "Analyzing target server ip...");
                    isContinue = (await nameResolvingPromise).isContinue;
                }
                if (isContinue) {
                    flowMgr.addViews(runConnectivityCheck(hostname, port, diagProvider, userInputLimitInUI, isLinuxOrContainer), `Connecting to ${userInput}...`);
                }
                this.collapsed = true;
            }
        })];
    })();
    state = flowMgr.addViews(connectivityCheckViews);
}