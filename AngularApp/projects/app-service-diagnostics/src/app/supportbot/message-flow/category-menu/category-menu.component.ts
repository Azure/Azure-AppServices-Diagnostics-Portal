import {
  Component,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter,
  Injector
} from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { DetectorMetaData, DetectorControlService } from 'diagnostic-data';
import { Message, TextMessage } from '../../models/message';
import { DiagnosticService } from 'diagnostic-data';
import { MessageSender } from '../../models/message-enums';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { FeatureService } from '../../../shared-v2/services/feature.service';
import { Feature } from '../../../shared-v2/models/features';
import { Tile } from '../../../shared/components/tile-list/tile-list.component';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { PortalActionService } from '../../../shared/services/portal-action.service';

@Component({
  selector: 'category-menu',
  templateUrl: './category-menu.component.html',
  styleUrls: ['./category-menu.component.scss']
})
export class CategoryMenuComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  //Input
  takeFeatureAction: boolean;
  features: Feature[];

  featureSelected: boolean = false;
  message: TextMessage;

  tiles: Tile[];

  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  constructor(
    private _injector: Injector,
    private _diagnosticService: DiagnosticService,
    private _featureService: FeatureService,
    private _chatState: CategoryChatStateService,
    private _detectorControlService: DetectorControlService,
    private _logger: LoggingV2Service,
    private portalActionService: PortalActionService
  ) {}

  ngOnInit() {
    this.takeFeatureAction = this._injector.get('takeFeatureAction');
    this.features = this._featureService.getFeaturesForCategory(
      this._chatState.category
    );

    this.tiles = this.features.map(
      (feature) =>
        <Tile>{
          title: feature.name,
          action: () => this.select(feature)
        }
    );

    if (!this.takeFeatureAction) {
      this.features.forEach((detector) => {
        // Make request for each detector
        this._diagnosticService
          .getDetector(
            detector.id,
            this._detectorControlService.startTimeString,
            this._detectorControlService.endTimeString
          )
          .subscribe();
      });
    }
  }

  ngAfterViewInit() {
    this.onViewUpdate.emit();
  }

  select(detector: Feature) {
    this._logger.LogTopLevelDetector(
      detector.id,
      detector.name,
      detector.category
    );
    this._logger.LogClickEvent(
      'TopLevelDetectorSelected',
      detector.id,
      detector.category
    );
    if (this.takeFeatureAction) {
      detector.clickAction();
    } else {
      if (detector.id === 'appchanges') {
        this.portalActionService.openChangeAnalysisBlade();
        return;
      }
      this._chatState.selectedFeature = detector;
      this.message = new TextMessage(
        `I am interested in ${detector.name}`,
        MessageSender.User
      );
      this.featureSelected = true;
    }

    this.onComplete.emit({ status: true, data: {} });
  }
}

export class CategoryMenuMessage extends Message {
  constructor(
    takeFeatureAction: boolean = false,
    messageDelayInMs: number = 1000
  ) {
    super(
      CategoryMenuComponent,
      { takeFeatureAction: takeFeatureAction },
      messageDelayInMs
    );
  }
}
