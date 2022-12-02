import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';

@Component({
  selector: 'star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent {
  @Input() isModal: boolean;
  @Input() ratingEventProperties: any;
  @Output() submit: EventEmitter<boolean> = new EventEmitter<boolean>();

  showThanksMessage: boolean = false;
  rating: number = 0;
  comments: string = 'Start your rating.';
  feedbackText: string;

  hideWholeForm: boolean;

  constructor(protected telemetryService: TelemetryService) {}

  setStar(data: any, comments?: any) {
    this.rating = data;
    this.comments = comments;
  }

  public feedbackMessageSubmitted() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: this.feedbackText
    };

    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);
    this.showThanksMessage = true;
    this.submit.emit(this.showThanksMessage);
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
