import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { INameValuePair } from '../namevaluepair';
import { SolutionProperties } from './solutionproperties';

export interface IResourceParameters {
  stdLogFile: string;
  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
}

export abstract class SolutionUIModelBase {
  private hasBeenExpanded = false;

  constructor(
    public rank: number,
    public properties: SolutionProperties,
    protected _logger: AvailabilityLoggingService
  ) {}

  execute(): void {
    this.run();
  }

  protected abstract run(): void;

  logExpandSolutionEvent(opened: boolean): void {
    if (!this.hasBeenExpanded && opened) {
      this._logger.LogSolutionExpanded(
        this.properties.title,
        this.rank.toString()
      );
      this.hasBeenExpanded = true;
    }
  }

  extractParams(parameters: Array<INameValuePair>): IResourceParameters {
    return {
      stdLogFile: parameters.find((p) => p.name.toLowerCase() === 'stdlogfile')
        .value,
      subscriptionId: parameters.find(
        (p) => p.name.toLowerCase() === 'subscriptionid'
      ).value,
      resourceGroup: parameters.find(
        (p) => p.name.toLowerCase() === 'resourcegroup'
      ).value,
      siteName: parameters.find((p) => p.name.toLowerCase() === 'sitename')
        .value
    };
  }
}
