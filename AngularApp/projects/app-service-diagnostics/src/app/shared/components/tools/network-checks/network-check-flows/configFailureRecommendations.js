import {
  DropdownStepView,
  InfoStepView,
  StepFlow,
  StepFlowManager,
  CheckStepView,
  StepViewContainer,
  InputStepView,
  ButtonStepView,
  PromiseCompletionSource,
  TelemetryService
} from 'diagnostic-data';
export class ConfigFailureRecommendations {
  constructor() {
    this.VnetNotSupported = {
      Get(aspName, sku) {
        return new InfoStepView({
          infoType: 1,
          title: 'Your App Service Plan does not support VNet integration',
          markdown:
            `Your App Service Plan **${aspName}** is in **${sku}** SKU. Not all instances in Standard SKU support VNet integration. \r\n\r\n` +
            'To enable VNet integration with Standard SKU, please try creating your app in Premium V3 plan then scaling down to Standard. Check the limitations in ' +
            '[Regional VNet Integration](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet#regional-vnet-integration) for more details.'
        });
      }
    };
  }
}
