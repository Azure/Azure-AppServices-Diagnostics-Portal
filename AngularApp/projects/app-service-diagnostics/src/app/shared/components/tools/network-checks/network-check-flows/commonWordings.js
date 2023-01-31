import { DropdownStepView, InfoStepView, StepFlow, StepFlowManager, CheckStepView, StepViewContainer,InputStepView, PromiseCompletionSource, TelemetryService } from 'diagnostic-data';
export class CommonWordings{
    constructor(){
        this.kuduNotAccessible = {
            get(kuduUrl){
                return new InfoStepView({
                    infoType: 1,
                    title: "Recommendations",
                    markdown: "[Kudu](https://docs.microsoft.com/en-us/azure/app-service/resources-kudu) is not accessible. Possible reasons can be:\r\n\r\n" +
                        "- Timeout, please click refresh button and retry\r\n\r\n" +
                        "- Kudu extension is not working properly due to invalid App Settings, e.g. invalid WEBSITE_CONTENTAZUREFILECONNECTIONSTRING. In this case, " + 
                        "your app may not be working properly as well. Please fix the problem to enable the check that depends on Kudu.  \r\n\r\n" +
                        `- Kudu extension is not working properly for unknown reason, please check if you can access Kudu by [${kuduUrl}](${kuduUrl}). \r\n\r\n`+
                        "The diagnostic results will be incomplete without Kudu access."
                });
            }
        }

        this.noAccessToResource = {
            get(resourceUri, resourceType, portalDomain){
                if(resourceUri.startsWith("/")){
                    resourceUri = resourceUri.substr(1);
                }
                var views = [
                    new CheckStepView({
                        title: `No permission to ${resourceType}, diagnostics flow terminated`,
                        level: 2
                    }),

                    new InfoStepView({
                        infoType: 1,
                        title: `Recommendations: Get access to ${resourceType}`,
                        markdown: `Get access to ${resourceType} [${resourceUri}](${portalDomain}/#@/resource/${resourceUri})`
                    })
                ];

                return views;
            }
        }

        this.unexpectedError = {
            get(){
                return new CheckStepView({
                    title: "Unexpected error, please retry.",
                    level: 2
                });
            }
        }

        this.connectivityCheckUnsupported = {
            get(){
                return new InfoStepView({
                        infoType: 1,
                        title: `Connectivity checks don't support Linux or Container based App yet.`,
                        markdown: `If you have set up VNet integration successfully, but connectivity to resource in the VNet is still failing, follow the troubleshooting steps below to diagnose the problem.
- If your app is trying to connect to a resource over its private endpoint, you should check if Azure DNS has the private DNS zone that is associated with this private link.
- Once DNS resolution is working and the app is able to resolve the remote endpoint correctly, check if there are any outbound NSG rules on the VNet that could block connectivity. 
- Firewall rules configured on destination resource (function binding) could be blocking access. Refer to this [troubleshooting guide](https://docs.microsoft.com/azure/azure-functions/functions-networking-options#debug-access-to-virtual-network-hosted-resources) to further debug the issue.
- There were authentication issues and the credentials involved have expired or are invalid.  Enable logging and check application logs for errors.`
                });
            }
        }
    }
}
