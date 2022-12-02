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
export class SubnetDeletionWordings {
  constructor() {
    this.subnetIsLocked = {
      get(locks, lockUri) {
        return new InfoStepView({
          infoType: 1,
          title: 'Recommendations: remove the lock',
          markdown:
            `Subnet is locked by ${locks.length} lock(s): ${locks
              .map((l) => l.name)
              .join(', ')}. \r\n\r\n` +
            `You cannot delete a subnet if it's locked. Please remove them [here](${lockUri}) to unblock subnet deletion`
        });
      }
    };

    this.subnetIsNotUsedByAppService = {
      get() {
        return new InfoStepView({
          infoType: 1,
          title: 'Subnet is used by another Azure service',
          markdown: `Subnet is not locked nor used by AppService. But it was used by another Azure service thus it cannot be deleted.`
        });
      }
    };

    this.subnetIsNotUsed = {
      get() {
        return new InfoStepView({
          infoType: 1,
          title: 'No problem detected',
          markdown: `Subnet is not locked nor used by any Azure service thus it can be safely deleted. If deletion continues to fail, please contact Azure Network team via support.`
        });
      }
    };

    this.subnetIsInUse = {
      get(apps) {
        return new InfoStepView({
          infoType: 1,
          title: 'Subnet is in use',
          markdown:
            `Subnet is used by following app(s): ${apps
              .map((app) => app.name)
              .join(', ')}. \r\n\r\n` +
            "Subnet cannot be deleted when it's in use. Please disconnect the VNet integration before deleting the subnet."
        });
      }
    };

    this.subnetIsInUseBySites = {
      get(sites, portalDomain) {
        var table =
          '| App(Slot) | ResourceId |\r\n' +
          '| - | - |\r\n' +
          sites
            .map(
              (site) =>
                `| [${site.site_name}(${site.slot_name})](${portalDomain}/#resource/subscriptions/${site.subscription_name}` +
                `/resourceGroups/${site.resource_group_name}/providers/Microsoft.Web/sites/${site.site_name}` +
                `${
                  site.slot_name === 'Production'
                    ? ''
                    : `/slots/${site.slot_name}`
                }/networkingHub)` +
                `| /${site.subscription_name}/${site.resource_group_name}/sites/${site.site_name}/${site.slot_name} |`
            )
            .join('\r\n');
        var views = [
          new CheckStepView({
            title: `Subnet is integrated with ${sites.length} app(s)`,
            level: 2,
            subChecks: null
          }),
          new InfoStepView({
            infoType: 1,
            title: 'Problem detected: Subnet is used by the following apps',
            markdown:
              table +
              '\r\n\r\n Please disconnect the VNet integration from the apps above and retry VNet/Subnet.\r\n\r\n' +
              'To disconnect the VNet, click the App name above to navigate to Networking -> VNet Integration and click on disconnect. '
          })
        ];
        return views;
      }
    };

    this.noPermission = {
      get(uri) {
        var views = [];
        views.push(
          new CheckStepView({
            title: `You don't have permission to read serverfarm ${asp}`,
            level: 1
          })
        );
        views.push(
          InfoStepView({
            infoType: 1,
            title: 'Have no permission',
            markdown: `Check is terminated because you don't have permission to access **${uri}**. Please grant the permission, refresh the page and run this check again.`
          })
        );
        return views;
      }
    };

    this.orphanSalDetected = {
      get(uri) {
        uri = uri.replaceAll('/', '&#8203;/');
        var views = [
          new CheckStepView({
            title: `Unused Service Association Link detected`,
            level: 2
          }),
          new InfoStepView({
            infoType: 1,
            title: 'Problem detected: unused Service Association Link',
            markdown:
              'This unused Service Association Link has just been flagged by our system and will be deleted in the next 3-5 business days to resolve your issue. Please try deleting the VNet/subnet again after this time.\r\n\r\n' +
              `If you need it deleted immediately, please file a support request and include the resource id below:\r\n\r\n  **${uri}**`
          })
        ];

        return views;
      }
    };
  }
}
