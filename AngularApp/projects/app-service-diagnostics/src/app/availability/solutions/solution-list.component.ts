import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { IAbnormalTimePeriod } from '../../shared/models/appanalysisresponse';
import { ISolution } from '../../shared/models/solution';
import { SupportBladeDefinitions } from '../../shared/models/portal';
import { SolutionUIModelBase } from '../../shared/models/solution-ui-model/solution-ui-model-base';
import { SolutionMetadata } from '../../shared/models/solution-ui-model/solutionproperties';
import { SolutionFactory } from '../../shared/models/solution-ui-model/solutionfactory';
import { ActionType } from '../../shared/models/enumerations';
import { SiteService } from '../../shared/services/site.service';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { WindowService } from '../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../shared/services/logging/availability.logging.service';

@Component({
  selector: 'solution-list',
  templateUrl: 'solution-list.component.html',
  styleUrls: ['solution-list.component.scss']
})
export class SolutionListComponent implements OnChanges {
  @Input() abnormalTimePeriod: IAbnormalTimePeriod;
  @Input() openedFromTicketFlow: boolean;

  quickSolutionsUIModels: SolutionUIModelBase[];
  deepInvestigationUIModels: SolutionUIModelBase[];
  allSolutionsUIModels: SolutionUIModelBase[];

  constructor(
    private _siteService: SiteService,
    private _portalActionService: PortalActionService,
    private _windowService: WindowService,
    private _logger: AvailabilityLoggingService
  ) {
    this.quickSolutionsUIModels = [];
    this.deepInvestigationUIModels = [];
    this.allSolutionsUIModels = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['abnormalTimePeriod']) {
      this.quickSolutionsUIModels = [];
      this.deepInvestigationUIModels = [];
      this.allSolutionsUIModels = [];

      let self = this;
      let quickSolutions: ISolution[] =
        this.abnormalTimePeriod.solutions.filter(function (item) {
          return (
            item.type.toString().toLowerCase() === 'quicksolution' ||
            item.type.toString().toLowerCase() === 'bestpractices'
          );
        });

      let rank = 0;
      quickSolutions.forEach((item: ISolution) => {
        let uiModel = SolutionFactory.getSolutionById(
          rank,
          item.id,
          item.data,
          self._siteService,
          self._portalActionService,
          self._logger
        );
        if (uiModel) {
          self.allSolutionsUIModels.push(uiModel);
          rank++;
        }
      });

      let deepInvestigations: ISolution[] =
        this.abnormalTimePeriod.solutions.filter(function (item) {
          return item.type.toString().toLowerCase() === 'deepinvestigation';
        });

      deepInvestigations.forEach((item: ISolution) => {
        let uiModel = SolutionFactory.getSolutionById(
          rank,
          item.id,
          item.data,
          self._siteService,
          self._portalActionService,
          self._logger
        );
        if (uiModel) {
          self.allSolutionsUIModels.push(uiModel);
          rank++;
        }
      });
    }
  }

  getBlogHtmlText(metaData: SolutionMetadata): string {
    let messageSplit = metaData.message.split('*');
    let linkText = messageSplit[1];
    let aElement =
      '<a (click)="openBlogUrl(' + metaData.og_Url + ')">' + linkText + '</a>';
    let fullHtml = messageSplit[0] + aElement + messageSplit[2];
    return fullHtml;
  }

  openPulseBlade() {
    this._logger.LogClickEvent('Pulse', 'InlineAction');
    this._portalActionService.openSupportIFrame(SupportBladeDefinitions.Pulse);
  }

  openBlogUrl(blogEntry: any, solution: SolutionUIModelBase): void {
    this._logger.LogClickEvent(blogEntry.message, 'solution');

    let type = 'other';
    if (solution.properties.actionType === ActionType.Inline) {
      type = 'inline';
    } else if (solution.properties.actionType === ActionType.Blade) {
      type = 'openblade';
    }

    this._logger.LogSolutionTried(
      solution.properties.title,
      solution.rank.toString(),
      type,
      'Open Blog Link'
    );
    this._windowService.window.open(blogEntry.og_Url);
  }
}
