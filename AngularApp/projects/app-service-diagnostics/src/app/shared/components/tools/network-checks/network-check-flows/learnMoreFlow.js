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
export var learnMoreFlow = {
  title: 'Learn more about VNet integration',
  async func(siteInfo, diagProvider, flowMgr) {
    flowMgr.addView(
      new InfoStepView({
        infoType: 1,
        title: 'Learn more about VNet integration',
        markdown:
          '- To learn about the basic concepts of Azure Virtual Networks, please visit [What is Azure Virtual Network](https://docs.microsoft.com/en-us/azure/virtual-network/virtual-networks-overview) \r\n\r\n' +
          '- Visit [Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet)' +
          ' to learn about the App Service VNet Integration feature\r\n\r\n' +
          `- Click [here](${diagProvider.portalDomain}/#@/resource${siteInfo.resourceUri}/networking) to configure VNet integration for your app`
      })
    );
  }
};
