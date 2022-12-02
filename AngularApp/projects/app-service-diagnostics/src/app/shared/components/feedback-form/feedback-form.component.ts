import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { LoggingService } from '../../services/logging/logging.service';

@Component({
  selector: 'feedback-form',
  templateUrl: 'feedback-form.component.html'
})
export class FeedbackFormComponent {
  showTextBox: boolean;
  yesSelected: boolean;
  noSelected: boolean;
  showMessageBox: boolean = false;
  showThanksMessage: boolean = false;

  feedbackText: string;

  hideWholeForm: boolean = false;

  @Input() source: string;

  constructor(private _logger: LoggingService) {}

  feedbackButtonClicked(helpful: boolean) {
    this.yesSelected = helpful;
    this.noSelected = !helpful;
    this._logger.LogFeedback(this.source, helpful);
    if (this.yesSelected) {
      this.showThanksMessage = true;
    } else {
      this.showMessageBox = true;
    }
  }

  feedbackMessageSubmitted() {
    this._logger.LogFeedbackMessage(this.source, this.feedbackText);
    this.showMessageBox = false;
    this.showThanksMessage = true;

    setTimeout(() => {
      this.hideWholeForm = true;
    }, 2000);
  }
}
