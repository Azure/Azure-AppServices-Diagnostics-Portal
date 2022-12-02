import {
  DropdownStepView,
  InfoStepView,
  StepFlow,
  StepFlowManager,
  CheckStepView,
  StepViewContainer,
  InputStepView,
  PromiseCompletionSource,
  TelemetryService
} from 'diagnostic-data';
import { CommonWordings } from './commonWordings.js';
export class NameResolvingAndIpWordings {
  constructor() {
    var commonWordings = new CommonWordings();

    this.ipAnalysis = {
      get(hostname, ipResults) {
        var markdown =
          (hostname == null
            ? ''
            : `Your host name **${hostname}** is resolved to following IP addresses\r\n\r\n`) +
          '| IP |Is private?|Route to VNet?|\r\n' +
          '| -- | --------- | ------------ |\r\n';
        markdown += ipResults
          .map((result) => `|${result.join('|')}|`)
          .join('\r\n');

        var view = new InfoStepView({
          infoType: 1,
          title: `Ip analysis`,
          markdown: markdown
        });
        return view;
      }
    };

    this.failedToResolveHostname = {
      get(hostname) {
        var views = [
          new CheckStepView({
            title: `Failed to resolve hostname ${hostname}, please retry`,
            level: 2
          })
        ];
        return views;
      }
    };

    this.hostNotFound = {
      get(hostname) {
        var views = [
          new CheckStepView({
            title: `Hostname ${hostname} not found`,
            level: 2
          }),
          new InfoStepView({
            infoType: 1,
            title: 'Issue detected: Hostname cannot be resolved',
            markdown:
              `DNS server cannot resolve the hostname **${hostname}**, possible reasons can be:\r\n` +
              `-  hostname **${hostname}** does not exist, please double check if the hostname is correct\r\n\r\n` +
              `-  Your custom DNS server was used for resolving hostname, but there is no DNS entry on the server for **${hostname}**, please check your DNS server.\r\n\r\n` +
              '-  If your target endpoint is an Azure service with Private Endpoint enabled, please check its Private Endpoint DNS Zone settings.\r\n\r\n'
          })
        ];
        return views;
      }
    };

    this.allIpRouteToVnet = {
      get(hostname) {
        var view = new CheckStepView({
          title: `Traffic to ${hostname} is routing to VNet`,
          level: 0
        });
      }
    };

    this.allIpNotRouteToVnet = {
      get(hostname) {
        var views = [
          new CheckStepView({
            title: `Traffic to ${hostname} is not routing to VNet`,
            level: 2
          }),
          new InfoStepView({
            infoType: 1,
            title: 'Issue detected: traffic is not routing to VNet',
            markdown:
              "The table above shows that all traffic is routing to public internet instead of VNet. This is because traffic to public IP address won't be routed to VNet by default. " +
              'Enable **"Route All"** on VNet integration config page to change this behavior.\r\n' +
              'If this behavior is expected, then this means VNet is not involved in the connection issue between your app and target server and you may want to check at server side for further investigation.'
          })
        ];
        return views;
      }
    };

    this.notAllIpRouteToVnet = {
      get(hostname) {
        var views = [
          new CheckStepView({
            title: `Not all traffic to ${hostname} is routing to VNet`,
            level: 2
          }),
          new InfoStepView({
            infoType: 1,
            title: 'Issue detected: some traffic is not routing to VNet',
            markdown:
              'The table above shows that not all traffic is routed to VNet. This indicates that your DNS configuration ' +
              'is problematic so that the routing behavior will change intermittently. Please fix the DNS entry on your DNS server or in private DNS zone, ' +
              'or enable **"Route All"** on VNet integration config page to force routing all traffic to VNet.'
          })
        ];
        return views;
      }
    };
  }
}
