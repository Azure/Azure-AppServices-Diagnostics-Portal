import { Component, Input, SimpleChanges } from '@angular/core';
import { AvailabilityLoggingService } from '../../../../shared/services/logging/availability.logging.service';

@Component({
  selector: 'solution-feedback',
  templateUrl: 'solution-feedback.component.html',
  styleUrls: ['../../../styles/solutions.scss']
})
export class SolutionFeedbackComponent {
  constructor(private _logger: AvailabilityLoggingService) {}

  feedbackGiven: boolean = false;
  hideWholeForm: boolean = false;

  @Input() solutionName: string;

  feedbackButtonClicked(helpful: boolean) {
    this._logger.LogSolutionFeedback(this.solutionName, helpful);
    this.feedbackGiven = true;

    setTimeout(() => {
      this.hideWholeForm = true;
    }, 5000);
  }
}
