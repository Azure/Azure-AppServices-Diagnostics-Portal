import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { PIIUtilities } from '../../utilities/pii-utilities';

@Component({
  selector: 'feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss']
})
export class FeedbackComponent implements OnInit {
  @Input() ratingEventProperties: any;
  @Input() showThanksMessage: boolean = false;
  @Input() showFeedbackForm: boolean = true;
  @Output() showFeedbackFormChange: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  @Output() submit: EventEmitter<boolean> = new EventEmitter<boolean>();

  rating: number = 0;
  defaultComments: string = '';
  comments: string = this.defaultComments;
  feedbackText: string;

  hideWholeForm: boolean;
  showTextBox: boolean;
  yesSelected: boolean;
  noSelected: boolean;

  constructor(protected telemetryService: TelemetryService) {}

  ngOnInit() {}

  @Input() source: string;

  cancelButtonClicked() {
    this.showFeedbackForm = false;
    this.showFeedbackFormChange.emit(this.showFeedbackForm);
    this.showThanksMessage = false;
  }

  setStar(data: any, comments?: any) {
    this.rating = data;
    this.comments = comments;
  }

  public feedbackMessageSubmitted() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: PIIUtilities.removePII(this.feedbackText)
    };

    this.showThanksMessage = true;
    this.showFeedbackForm = false;
    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);
    this.submit.emit(this.showThanksMessage);
    this.rating = 0;
    this.comments = this.defaultComments;
    this.feedbackText = '';
    this.showFeedbackFormChange.emit(this.showFeedbackForm);

    setTimeout(() => {
      this.showThanksMessage = false;
    }, 2000);
  }

  protected logEvent(
    eventMessage: string,
    eventProperties?: any,
    measurements?: any
  ) {
    for (const id of Object.keys(this.ratingEventProperties)) {
      if (this.ratingEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.ratingEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }
}
