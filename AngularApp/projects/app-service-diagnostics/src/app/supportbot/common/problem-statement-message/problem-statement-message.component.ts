import {
  Component,
  Injector,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { Message } from '../../models/message';
import { BehaviorSubject } from 'rxjs';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';

@Component({
  templateUrl: 'problem-statement-message.component.html'
})
export class ProblemStatementMessageComponent
  implements AfterViewInit, IChatMessageComponent
{
  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  detectorResponse: IDetectorResponse;

  constructor(
    private injector: Injector,
    private _logger: BotLoggingService,
    private _route: ActivatedRoute,
    private _appAnalysisService: AppAnalysisService
  ) {}

  ngAfterViewInit(): void {
    (<BehaviorSubject<IDetectorResponse>>(
      this.injector.get('response')
    )).subscribe((detectorResponse) => {
      this.detectorResponse = detectorResponse;

      this.onViewUpdate.emit();

      this.onComplete.emit({
        status: true
      });
    });
  }
}

export class ProblemStatementMessage extends Message {
  constructor(
    response: BehaviorSubject<IDetectorResponse>,
    messageDelayInMs: number = 500
  ) {
    //TODO: add solution data
    super(
      ProblemStatementMessageComponent,
      { response: response },
      messageDelayInMs
    );
  }
}
