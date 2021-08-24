import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer, InputStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
import { CommonWordings } from './commonWordings.js'
export class VnetDnsWordings {
    constructor() {
        var commonWordings = new CommonWordings();

        var makeBreakable = ((uri) => {
            return uri.replaceAll("/", "<wbr/>/");
        });


        this.dnsReachability = {
            get(dns, config, reachable) {
                return new CheckStepView({
                    title: `DNS ${dns} configured in ${config} is ${reachable ? "" : "not"} reachable`,
                    level: reachable ? 0 : 2
                });
            }
        }

        this.dnsIsHealthy = {
            get(dnsSubChecks, configuredIn) {
                return new CheckStepView({
                    title: `DNS configurations in ${configuredIn} are healthy`,
                    level: 0,
                    subChecks: dnsSubChecks
                });
            }
        }

        this.dnsIsUnhealthy = {
            get(dnsSettings, unreachableDns, configuredIn, subChecks, dnsSubChecks) {
                subChecks.push(new CheckStepView({
                    title: `DNS configurations in App Setting are unhealthy`,
                    level: 2,
                    subChecks: dnsSubChecks
                }));

                var markdown;
                if(dnsSettings.length == unreachableDns.length){
                    markdown = `None of the DNS server ${dnsSettings.filter(i => i!=null).join(" and ")} you configured in ${configuredIn} is not reachable from this app` +
                    " thus all connections to endpoints with hostname will fail. \r\n" +
                    "Please check if the settings are correct and DNS server is working properly.";
                }else{
                    markdown = `One of the DNS server ${dnsSettings.filter(i => i!=null).join(" and ")} you configured in ${configuredIn} is not reachable from this app.` +
                    "Please check if the settings are correct and DNS server is working properly.";
                }

                var view = new InfoStepView({
                    infoType: 1,
                    title: "Issue found: custom DNS is not reachable",
                    markdown: markdown
                });
                return view;
            }
        }

        this.appSettingDnsOnlyHasAlternative = {
            get(){
                return new CheckStepView({
                    title: "WEBSITE_DNS_ALT_SERVER in App Setting won't be applied if WEBSITE_DNS_SERVER is not configured",
                    level: 1
                });
            }
        }

        this.noAccessToResource = commonWordings.noAccessToResource;
        this.unexpectedError = commonWordings.unexpectedError;

        this.appSettingDnsOverrideVnetDns = {
            get(){
                return new CheckStepView({
                    title: "You have WEBSITE_DNS_SERVER configured in App Setting, the DNS setting in VNet won't be applied",
                    level: 1
                });
            }
        }

        this.onlyTwoVnetDnsWillBeApplied = {
            get(dnsSettings){
                 return new CheckStepView({
                    title: `Detected ${dnsSettings.length} VNet DNS settings, but only 2 of them ${dnsSettings.slice(0, 2).join(" and ")} will be applied`,
                    level: 1
                });
            }
        }

        this.dnsCheckResult = {
            get(status, subChecks) {
                var dnsCheckTitle = null;
                if (status == 0) {
                    dnsCheckTitle = "Dns setting is healthy";
                } else if (status == 1) {
                    dnsCheckTitle = "Dns setting needs attention";
                } else if (status == 2) {
                    dnsCheckTitle = "Dns setting is not healthy";
                } else {
                    throw new Error(`Unknown status ${status}`);
                }

                var view = new CheckStepView({
                    title: dnsCheckTitle,
                    level: status,
                    subChecks: subChecks
                });

                return view;
            }
        }

        this.cannotCheckWithoutKudu = {
            get(what){
                return new CheckStepView({
                    title: `Cannot validate ${what} without kudu access`,
                    level: 3
                });
            }
        }

        this.fallbackToAzureDnsConfigured = {
            get(){
                return new CheckStepView({
                    title: "WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is set to 1, Azure default DNS 168.63.129.16 will be applied as fallback",
                    level: 3
                });
            }
        }

        this.configuredDns = {
            get(dnsSettings, source, fallbackToAzureDns){
                var defaultDns = {title: "168.63.129.16(Azure Default DNS)", level:3};
                if(dnsSettings != null && dnsSettings.length > 0){
                    var subChecks = dnsSettings.map(d => new CheckStepView({title:`${d} (${source})`, level:3}));
                    if(fallbackToAzureDns){
                        subChecks.push(defaultDns);
                    }
                    return new CheckStepView({
                        title: "Custom DNS setting detected, following DNS will be used for name resolving",
                        level: 3,
                        subChecks: subChecks
                    });
                }else{
                    return new CheckStepView({
                        title: "No custom DNS is configured, default Azure DNS will be applied",
                        level: 3,
                        subChecks: [defaultDns]
                    });
                }
            }
        }

    }
}