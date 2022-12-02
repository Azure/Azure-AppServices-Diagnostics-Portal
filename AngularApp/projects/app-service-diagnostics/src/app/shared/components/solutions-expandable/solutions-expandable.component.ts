import { Component, Input, OnInit } from '@angular/core';
import { SupportBladeDefinitions } from '../../models/portal';
import { SolutionUIModelBase } from '../../models/solution-ui-model/solution-ui-model-base';
import { SolutionMetadata } from '../../models/solution-ui-model/solutionproperties';
import { ActionType } from '../../models/enumerations';
import { ReplaySubject } from 'rxjs';
import { PortalActionService } from '../../services/portal-action.service';
import { WindowService } from '../../../startup/services/window.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';

@Component({
  selector: 'solutions-expandable',
  templateUrl: 'solutions-expandable.component.html',
  styleUrls: ['solutions-expandable.component.scss']
})
export class SolutionsExpandableComponent implements OnInit {
  private _solutionModelSubject: ReplaySubject<SolutionUIModelBase[]> =
    new ReplaySubject<SolutionUIModelBase[]>(1);

  @Input() set solutionModel(model: SolutionUIModelBase[]) {
    this._solutionModelSubject.next(model);
  }

  allSolutionsUIModels: SolutionUIModelBase[];

  @Input() title: string;

  constructor(
    private _portalActionService: PortalActionService,
    private _windowService: WindowService,
    private _logger: AvailabilityLoggingService
  ) {}

  ngOnInit(): void {
    this._solutionModelSubject.subscribe((solutions: SolutionUIModelBase[]) => {
      this.allSolutionsUIModels = solutions;
    });
  }

  getBlogHtmlText(metaData: SolutionMetadata): string {
    const messageSplit = metaData.message.split('*');
    const linkText = messageSplit[1];
    const aElement =
      '<a (click)="openBlogUrl(' + metaData.og_Url + ')">' + linkText + '</a>';
    const fullHtml = messageSplit[0] + aElement + messageSplit[2];
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
