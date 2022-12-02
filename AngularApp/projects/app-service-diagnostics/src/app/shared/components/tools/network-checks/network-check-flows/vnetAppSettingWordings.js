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
export class VnetAppSettingWordings {
  constructor() {
    var commonWordings = new CommonWordings();

    this.alwaysFallbackDns = {
      get(value) {
        var msg =
          "Azure public DNS <b>WON'T</b> be applied if you have custom DNS set up in App Settings or VNet";
        if (value === true) {
          return new CheckStepView({
            title:
              'WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is set to 1, Azure public DNS 168.63.129.16 will be applied',
            level: 3
          });
        } else if (value == null) {
          return new CheckStepView({
            title: 'WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is not set, ' + msg,
            level: 3
          });
        } else {
          return new CheckStepView({
            title:
              'WEBSITE_ALWAYS_FALLBACK_TO_PUBLIC_DNS is set to 0 (or an invalid value), ' +
              msg,
            level: 3
          });
        }
      }
    };

    this.vnetRouteAll = {
      get(value) {
        var msg =
          '<b>ONLY</b> traffic to <a href="https://en.wikipedia.org/wiki/Private_network#Private_IPv4_addresses"' +
          ' target="_blank">RFC1918 private addresses</a> will be sent to VNet, traffic to other public addresses will be sent via public internet';
        if (value === true) {
          return new CheckStepView({
            title:
              'VNet Route All is enabled, traffic to any IP address will be sent to VNet',
            level: 3
          });
        } else if (value == null) {
          return new CheckStepView({
            title: 'VNet Route All is not enabled, ' + msg,
            level: 3
          });
        } else {
          return new CheckStepView({
            title: 'VNet Route All is disabled, ' + msg,
            level: 3
          });
        }
      }
    };

    this.vnetRelatedBehaviors = {
      get(subChecks) {
        return new CheckStepView({
          title:
            "App Service's VNet related behaviors will be changed by following App Settings",
          level: 3,
          subChecks: subChecks
        });
      }
    };
  }
}
