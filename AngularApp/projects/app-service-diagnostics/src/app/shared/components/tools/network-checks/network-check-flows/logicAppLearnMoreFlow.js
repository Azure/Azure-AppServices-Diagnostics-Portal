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
export var logicAppLearnMoreFlow = {
  title: 'Learn to create VNet integration in Logic Apps',
  async func(siteInfo, diagProvider, flowMgr) {
    var markdown = `
Standard logic apps are built on top of Azure functions. You can configure VNet integration for a logic app using the same steps as configuring VNet integration for Azure functions.

#### Get started
[Set up outbound traffic using VNet integration](https://docs.microsoft.com/en-us/azure/logic-apps/secure-single-tenant-workflow-virtual-network-private-endpoint?WT.mc_id=Portal-Microsoft_Azure_Support#set-up-outbound-traffic-using-vnet-integration)

#### Troubleshoot an issue
If you are experiencing VNet integration problems, we suggest running automated checks to diagnose the issue
- Click the dropdown above and select an option based on your situation then follow the instructions


#### Resources
[Integrate your app with an Azure virtual network](https://docs.microsoft.com/en-us/azure/app-service/overview-vnet-integration?WT.mc_id=Portal-Microsoft_Azure_Support)`;

    flowMgr.addView(
      new InfoStepView({
        infoType: 1,
        title: 'Learn to create VNet integration in Logic Apps',
        markdown: markdown
      })
    );
  }
};
