import {
  Component,
  Injector,
  Output,
  EventEmitter,
  OnInit,
  AfterViewInit,
  Optional
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { MessageProcessor } from '../../message-processor.service';
import { TextMessage } from '../../models/message';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { ButtonMessageComponent } from '../../common/button-message/button-message.component';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';

@Component({
  templateUrl: 'feedback.component.html'
})
export class FeedbackComponent extends ButtonMessageComponent {
  showComponent: boolean;
  feedbackMessage: string;

  constructor(
    protected _injector: Injector,
    private _msgProcessor: MessageProcessor,
    protected _logger: BotLoggingService,
    @Optional() protected _chatState?: CategoryChatStateService
  ) {
    super(_injector, _logger, _chatState);
    this.showComponent = true;
    this.feedbackMessage = '';
  }

  ngOnInit(): void {
    super.ngOnInit();
    const submit = this._injector.get('submitButtonName', 'Submit');
    this.buttonList.push({
      title: submit,
      next_key: '',
      type: ButtonActionType.Continue
    });
  }

  ngAfterViewInit(): void {
    this.onViewUpdate.emit();
  }

  onClick(item: any) {
    if (item.title === 'Submit') {
      this.onSubmit();
    } else {
      super.onClick(item);
    }
  }

  onSubmit(): void {
    if (this.feedbackMessage !== '') {
      this.showComponent = false;
      this._logger.LogFeedbackMessage(
        this.context,
        this.feedbackMessage,
        this.category
      );
      this.onComplete.emit({
        status: true,
        data: {
          feedbackMessage: this.feedbackMessage
        }
      });
    }
  }
}
