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
export class VnetIntegrationWordings {
  constructor() {
    var commonWordings = new CommonWordings();

    var makeBreakable = (uri) => {
      return uri.replaceAll('/', '<wbr/>/');
    };

    this.vnetIntegrationResult = {
      get(integrationCheckStatus, subChecks) {
        var integrationCheckTitle = null;
        if (integrationCheckStatus == 0) {
          integrationCheckTitle = 'VNet integration is healthy';
        } else if (integrationCheckStatus == 1) {
          integrationCheckTitle = 'VNet integration needs attention';
        } else if (integrationCheckStatus == 2) {
          integrationCheckTitle = 'VNet integration is not healthy';
        } else {
          throw new Error(
            `Unknown integrationStatus ${integrationCheckStatus}`
          );
        }

        var integrationCheck = new CheckStepView({
          title: integrationCheckTitle,
          level: integrationCheckStatus,
          subChecks: subChecks
        });

        return integrationCheck;
      }
    };

    this.swiftConfigured = {
      get() {
        return new CheckStepView({
          title: 'Regional VNet integration configuration is detected',
          level: 0
        });
      }
    };

    this.gatewayConfigured = {
      get() {
        return new CheckStepView({
          title: 'Gateway VNet integration configuration is detected',
          level: 0
        });
      }
    };

    this.gatewayVnetValid = {
      get(vnetUri) {
        vnetUri = makeBreakable(vnetUri);
        return new CheckStepView({
          title: `VNet ${vnetUri} is healthy`,
          level: 0
        });
      }
    };

    this.gatewayVnetNotFound = {
      get(subChecks, vnetId) {
        subChecks.push(
          new CheckStepView({
            title: 'Vnet does not exist',
            level: 2
          })
        );

        var view = new InfoStepView({
          infoType: 1,
          title: `Issue found: Subnet does not exist`,
          markdown:
            `The app is integrated with a nonexistent Vnet **${vnetId}**. \r\n\r\n` +
            `Please re-configure the VNet integration with a valid Vnet.`
        });

        return view;
      }
    };

    this.swiftInvalidSubnet = {
      get(subChecks) {
        subChecks.push(
          new CheckStepView({
            title: 'Invalid SubnetResourceId format',
            level: 2
          })
        );

        var msg = '<table>';
        msg +=
          '<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>';
        msg +=
          '<tr><td><b>Cause</b></td><td>SubnetResourceId is not in right format.</td></tr>';
        msg +=
          '<tr><td><b>Recommended Action</b></td><td>Please review the ARM template and make sure SubnetResourceId should be in this format: <b>/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}<br/>/providers/Microsoft.Network/virtualNetworks/{vnetName}/subnets/{subnetName}</b>.</td></tr>';
        msg += '</table>';

        var view = new InfoStepView({
          infoType: 1,
          title: 'Issue detected: SubnetResourceId format',
          markdown: msg
        });

        return view;
      }
    };

    this.wrongArmTemplate = {
      get(subChecks) {
        subChecks.push(
          new CheckStepView({
            title: 'swiftSupported property is not True',
            level: 2
          })
        );

        msg = '<table>';
        msg +=
          '<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>';
        msg +=
          '<tr><td><b>Cause</b></td><td>swiftSupported property is set to False.</td></tr>';
        msg +=
          '<tr><td><b>Recommended Action</b></td><td>Please review the ARM template and set swiftSupported property to True.</td></tr>';
        msg += '</table>';

        var view = new InfoStepView({
          infoType: 1,
          title: 'Issue found: IsSwift property is not True',
          markdown: msg
        });

        return view;
      }
    };

    this.subnetExists = {
      get(subnetId) {
        subnetId = makeBreakable(subnetId);
        var view = new CheckStepView({
          title: `Subnet ${subnetId} is valid`,
          level: 0
        });
        return view;
      }
    };

    this.subnetNotFound = {
      get(subChecks, subnetId) {
        subnetId = subnetId.replaceAll('/', '&#8203;/');
        subChecks.push(
          new CheckStepView({
            title: `Subnet ${subnetId} does not exist`,
            level: 2
          })
        );

        var view = new InfoStepView({
          infoType: 1,
          title: `Issue found: Subnet does not exist`,
          markdown:
            `The app is integrated with a nonexistent Subnet **${subnetId}**. \r\n\r\n` +
            `Please re-configure the VNet integration with a valid Subnet.`
        });

        return view;
      }
    };

    this.subnetSalValid = {
      get() {
        var view = new CheckStepView({
          title: 'Subnet has a valid AppServiceLink Service Association Link',
          level: 0
        });
        return view;
      }
    };

    this.subnetWrongSalOwner = {
      get() {
        var view = new CheckStepView({
          title:
            'Subnet has a Service Association Link owned by different AppService Plan',
          level: 1
        });
        return view;
      }
    };

    this.subnetSalMissing = {
      get(subnetName, subChecks) {
        subChecks.push(
          new CheckStepView({
            title:
              "Subnet doesn't have an AppServiceLink Service Association Link",
            level: 1
          })
        );

        subnetName = makeBreakable(subnetName);

        var msg = `<table>`;
        msg += `<tr><td><b>VNet Integration Status</b></td><td>Failed</td></tr>`;
        msg += `<tr><td><b>Cause</b></td><td>Service Association Link is missing on the subnet <b>${subnetName}</b> </td></tr>`;
        msg += `<tr><td><b>Recommended Action</b></td><td>Please disconnect all the apps that are connected to subnet <b>${subnetName}</b> and connect again to generate service association link.</td></tr>`;
        msg += `</table>`;

        var stepView = new InfoStepView({
          infoType: 1,
          title: 'Issue found: Service Association Link not initialized',
          markdown: msg
        });
        return stepView;
      }
    };

    this.subnetDelegationResult = {
      get(isDelegated) {
        var view = new CheckStepView({
          title:
            'Subnet is' +
            (isDelegated ? '' : ' not') +
            ' delegated to Microsoft.Web/serverFarms',
          level: isDelegated ? 0 : 2
        });
        return view;
      }
    };

    this.subnetSizeIsGood = {
      get(mask) {
        var view = new CheckStepView({
          title: `Subnet mask = ${mask} is healthy`,
          level: 0
        });
        return view;
      }
    };

    this.subnetSizeIsNotGood = {
      get(subnetId, mask, sku, recommend, subChecks) {
        subChecks.push(
          new CheckStepView({
            title: `Subnet mask = ${mask} is not optimal, recommend mask value is ${recommend}`,
            level: 1
          })
        );

        subnetId = makeBreakable(subnetId);

        var addressSpaceSize = Math.pow(2, 32 - recommend);

        var msg = `- Subnet ${subnetId} is using a mask doesn't meet the minimum requirement of <b>/${recommend}</b>. Please increase size of the subnet.<br/>`;
        msg += `<br/><table><tr><th>Subnet Mask</th><th>App Service Plan SKU</th><th>Recommended Subnet Mask</th><th>Available Addresses</th></tr>`;
        msg += `<tr><td>/${mask}</td><td>${sku}</td><td><b>/${recommend}</b></td><td>${addressSpaceSize}-5 = <b>${
          addressSpaceSize - 5
        }</b> Addresses</td></tr>`;
        msg += `<tr><td colspan='5'><i>Note: Azure reserves 5 IP addresses within each subnet.</i></td></tr></table>\r\n\r\n`;
        msg += `<u>Steps to increase the subnet size:</u>\r\n`;
        msg += `- In this App Service Plan, disconnect all the Web Apps that are currently using Regional VNET integration. This would cause Apps to lose connectivity to VNet resource, so please plan this change accordingly.\r\n`;
        msg += `- Increase the subnet size as per the recommendations.\r\n`;
        msg += `- Reconnect the webapps to the same subnet.\r\n`;
        msg += `<br/>`;

        var view = new InfoStepView({
          infoType: 1,
          title: `Suboptimal configuration found: Subnet size`,
          markdown: msg
        });

        return view;
      }
    };

    this.noAccessToResource = commonWordings.noAccessToResource;

    this.swiftAspExceedsLimitation = {
      get(uniqueAspSubnets, limitation, serverFarmName, subChecks) {
        subChecks.push(
          new CheckStepView({
            title: `AppService Plan connects to more than ${limitation} different subnets`,
            level: 1
          })
        );

        var view = new InfoStepView({
          infoType: 1,
          title: `Recommendation: AppService Plan should at most connect to ${limitation} different subnets`,
          markdown: `Please disconnect the VNet integration and connect to the same subnet instead. Exceeding the limitation can lead to unexpected behaviors.`
        });

        return view;
      }
    };

    this.swiftAspUnderLimitation = {
      get(subnets, limitation) {
        var view = new CheckStepView({
          title: `AppService Plan connects to ${subnets.length} different subnets (limitation is ${limitation})`,
          level: 0
        });
        return view;
      }
    };

    this.swiftPrivateIpNotAssigned = {
      get(count, subChecks) {
        subChecks.push(
          new CheckStepView({
            title: `${count} instance(s) failed to get private IP assigned`,
            level: 2
          })
        );

        var msg = `<b>Recommendations: </b>`;
        msg += `<li>Check if the subnet size is as per recommendations to allocate IPs to all instances..`;
        msg += `<li>If VNet integration was performed in the last 5 minutes, then wait for 10 minutes and run this diagnostic again.`;
        msg += `<li>Disconnect all apps in the app service plan and perform the VNet integration again.`;

        var view = new InfoStepView({
          infoType: 1,
          title: `Issue found: Instances failed to get private IP address`,
          markdown: msg
        });

        return view;
      }
    };

    this.swiftPrivateIpAssigned = {
      get(count, subChecks) {
        var view = new CheckStepView({
          title: `Private IP allocated for all ${count} instances`,
          level: 0
        });
        return view;
      }
    };

    this.noVnetIntegration = {
      get() {
        var views = [
          new CheckStepView({
            title: 'App is not configured for VNet Integration',
            level: 2
          }),

          new InfoStepView({
            infoType: 1,
            title: 'Issue found: App is not configured for VNet Integration',
            markdown:
              'Please configure the VNet integration for your app. Check [Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet) for more information.'
          })
        ];

        return views;
      }
    };

    this.subnetCheckResult = {
      get(subnetStatus, subnetSubChecks) {
        var subnetCheckTitle = null;
        if (subnetStatus == 0) {
          subnetCheckTitle = 'Subnet configuration is healthy';
        } else if (subnetStatus == 1) {
          subnetCheckTitle = 'Subnet configuration needs attention';
        } else {
          subnetCheckTitle = 'Subnet configuration is unhealthy';
        }
        var subnetCheck = new CheckStepView({
          title: subnetCheckTitle,
          level: subnetStatus,
          subChecks: subnetSubChecks
        });

        return subnetCheck;
      }
    };

    this.workerVnetConnectionIsGood = {
      get() {
        var view = new CheckStepView({
          title: 'Connection between App Service worker(s) and VNet is healthy',
          level: 0
        });
        return view;
      }
    };

    this.workerVnetConnectionIsBad = {
      get() {
        var view = new CheckStepView({
          title: 'One or more App Service worker(s) failed to connect to VNet',
          level: 2
        });
        return view;
      }
    };

    this.cannotCheckWorkerVnetConnection = {
      get() {
        var view = new CheckStepView({
          title:
            'Cannot check connection between App Service worker(s) and VNet, please retry',
          level: 3
        });
        return view;
      }
    };
  }
}
