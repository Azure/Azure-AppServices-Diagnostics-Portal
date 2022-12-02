import { SolutionUIModelBase } from './solution-ui-model-base';
import {
  SolutionProperties,
  SubAction,
  SolutionMetadata
} from './solutionproperties';
import { SolutionType, ActionType, ActionStatus } from '../enumerations';
import { INameValuePair } from '../namevaluepair';
import { SupportBladeDefinitions, BladeOptions } from '../portal';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { PortalActionService } from '../../services/portal-action.service';

export abstract class OpenBladeSolutionUIModel extends SolutionUIModelBase {
  constructor(
    rank: number,
    properties: SolutionProperties,
    _logger: AvailabilityLoggingService,
    private _portalActionService: PortalActionService
  ) {
    super(rank, properties, _logger);
  }

  run(): void {}

  logOpenBlade(blade: string) {
    this._logger.LogSolutionTried(
      this.properties.title,
      this.rank.toString(),
      'openblade',
      blade
    );
  }
}

export class OpenScaleUpBlade extends OpenBladeSolutionUIModel {
  constructor(
    rank: number,
    parameters: INameValuePair[][],
    _logger: AvailabilityLoggingService,
    private portalActionService: PortalActionService
  ) {
    super(rank, new SolutionProperties(), _logger, portalActionService);

    this.properties.id = 3;
    this.properties.title = 'Scale Up App Service Plan';
    this.properties.description =
      'Scale up your app service plan to next tier.';
    this.properties.type = SolutionType.QuickSolution;
    this.properties.actionType = ActionType.Blade;
    this.properties.actionText = 'Open Scale Up App Service Plan';

    this.properties.additionalData = [];

    const metaDataItem = new SolutionMetadata();
    metaDataItem.type = 'blog';
    metaDataItem.message = 'Learn about *App Service Pricing*';
    metaDataItem.og_Url = 'https://goo.gl/CvnNxh';
    metaDataItem.og_Title = 'Pricing - App Service | Microsoft Azure';
    metaDataItem.og_Description =
      'See pricing details for App Service. Create web and mobile apps for any platform and any device.';
    metaDataItem.og_ImageUrl =
      'https://azure.microsoft.com/svghandler/app-service?width=80&height=80';

    this.properties.additionalData.push(metaDataItem);
  }

  run(): void {
    this.logOpenBlade(BladeOptions.scaleUp);
    this.portalActionService.openBladeScaleUpBlade();
  }
}

export class OpenScaleOutBlade extends OpenBladeSolutionUIModel {
  constructor(
    rank: number,
    parameters: INameValuePair[][],
    _logger: AvailabilityLoggingService,
    private portalActionService: PortalActionService
  ) {
    super(rank, new SolutionProperties(), _logger, portalActionService);

    this.properties.id = 4;
    this.properties.title = 'Scale Out App Service Plan';
    this.properties.description =
      'Scale out your app service plan to add more instances.';
    this.properties.type = SolutionType.QuickSolution;
    this.properties.actionType = ActionType.Blade;
    this.properties.actionText = 'Open Scale Out App Service Plan';
  }

  run(): void {
    this.logOpenBlade(BladeOptions.scaleOut);
    this.portalActionService.openBladeScaleOutBlade();
  }
}

export class OpenApplicationEventLogs extends OpenBladeSolutionUIModel {
  constructor(
    rank: number,
    parameters: INameValuePair[][],
    _logger: AvailabilityLoggingService,
    private portalActionService: PortalActionService
  ) {
    super(rank, new SolutionProperties(), _logger, portalActionService);

    this.properties.id = 8;
    this.properties.title = 'Open Application Event Logs';
    this.properties.description =
      'Check application event logs for any errors.';
    this.properties.type = SolutionType.DeepInvestigation;
    this.properties.actionType = ActionType.Blade;
    this.properties.actionText = 'Open Application Event Logs';
  }

  run(): void {
    this.logOpenBlade(BladeOptions.eventviewer);
    this.portalActionService.openSupportIFrame(
      SupportBladeDefinitions.EventViewer
    );
  }
}

export class RunDaas extends OpenBladeSolutionUIModel {
  constructor(
    rank: number,
    parameters: INameValuePair[][],
    _logger: AvailabilityLoggingService,
    private portalActionService: PortalActionService
  ) {
    super(rank, new SolutionProperties(), _logger, portalActionService);

    this.properties.id = 100;
    this.properties.title = 'Run a Diagnostics as a Service (DaaS) Session';
    this.properties.description =
      'DaaS collects your application process memory dumps, http logs and event logs and runs an analysis';

    this.properties.type = SolutionType.DeepInvestigation;
    this.properties.actionType = ActionType.Blade;
    this.properties.actionText = 'Open DaaS';

    const metaDataItem = new SolutionMetadata();
    metaDataItem.type = 'blog';
    metaDataItem.message = 'Learn more about *DaaS*.';
    metaDataItem.og_Url = 'https://goo.gl/nAz560';
    metaDataItem.og_Title =
      'DaaS – Diagnostics as a Service for Azure Web Sites';
    metaDataItem.og_Description =
      'DaaS – Diagnostics as a Service for Azure Web Sites. A feature that allows you to quickly root cause application specific issues.';
    metaDataItem.og_ImageUrl =
      'https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png';

    this.properties.additionalData.push(metaDataItem);
  }

  run(): void {
    this.logOpenBlade(BladeOptions.diagnostics);
    this.portalActionService.openSupportIFrame(SupportBladeDefinitions.DaaS);
  }
}

export class OpenAppInsights extends OpenBladeSolutionUIModel {
  constructor(
    rank: number,
    parameters: INameValuePair[][],
    _logger: AvailabilityLoggingService,
    private portalActionService: PortalActionService
  ) {
    super(rank, new SolutionProperties(), _logger, portalActionService);

    this.properties.id = 101;
    this.properties.title = 'Enable and Check Application Insights Logs.';
    this.properties.description =
      'You can check application insights for your app to see application errors.';
    this.properties.type = SolutionType.DeepInvestigation;
    this.properties.actionType = ActionType.Blade;
    this.properties.actionText = 'Open Application Insights';

    const metaDataItem = new SolutionMetadata();
    metaDataItem.type = 'blog';
    metaDataItem.message =
      'Learn how to use *Application Insights* for your app.';
    metaDataItem.og_Url = 'https://goo.gl/TGFdjm';
    metaDataItem.og_Title = 'What is Azure Application Insights?';
    metaDataItem.og_Description =
      'Application Performance Management and usage tracking of your live web application.  Detect, triage and diagnose problems, understand how people use your app.';
    metaDataItem.og_ImageUrl =
      'https://docs.microsoft.com/_themes/docs.theme/master/en-us/_themes/images/microsoft-header.png';

    this.properties.additionalData.push(metaDataItem);
  }

  run(): void {
    this.logOpenBlade(BladeOptions.applicationInsights);
    this.portalActionService.openAppInsightsBlade();
  }
}
