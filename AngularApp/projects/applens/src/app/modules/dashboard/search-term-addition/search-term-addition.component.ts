import { Component, Input, OnInit } from '@angular/core';
import { RecommendedUtterance } from '../../../../../../diagnostic-data/src/public_api';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';

@Component({
  selector: 'search-term-addition',
  templateUrl: './search-term-addition.component.html',
  styleUrls: ['./search-term-addition.component.scss']
})
export class SearchTermAdditionComponent implements OnInit {
  @Input() allUtterances: any[];
  @Input() recommendedUtterances: RecommendedUtterance[];
  @Input() utteranceInput: string;
  @Input() detectorId: string;

  displayError: boolean = false;

  constructor(private _telemetryService: TelemetryService) {}

  ngOnInit() {
    this._telemetryService.logPageView(
      TelemetryEventNames.SearchTermAdditionLoaded,
      {}
    );
  }

  ngAfterViewInit() {}

  addUtterance(utterance: RecommendedUtterance) {
    var index = this.allUtterances.indexOf(utterance.sampleUtterance);
    if (index < 0) {
      this.allUtterances.unshift(utterance.sampleUtterance);
      this._telemetryService.logEvent(
        TelemetryEventNames.AuthorSelectSearchTerm,
        {
          detectorId: this.detectorId,
          text: utterance.sampleUtterance.text,
          ts: Math.floor(new Date().getTime() / 1000).toString()
        }
      );
      var idx = this.recommendedUtterances.indexOf(utterance);
      if (idx >= 0) {
        this.recommendedUtterances.splice(idx, 1);
      }
    }
  }

  createUtterance() {
    if (this.utteranceInput.length < 5) {
      this.displayError = true;
      return;
    }
    this.displayError = false;
    this.allUtterances.unshift({
      text: this.utteranceInput.valueOf(),
      links: []
    });
    this._telemetryService.logEvent(
      TelemetryEventNames.AuthorCreateSearchTerm,
      {
        detectorId: this.detectorId,
        text: this.utteranceInput,
        ts: Math.floor(new Date().getTime() / 1000).toString()
      }
    );
    this.utteranceInput = '';
  }

  removeUtterance(utterance: any) {
    var index = this.allUtterances.indexOf(utterance);
    this._telemetryService.logEvent(
      TelemetryEventNames.AuthorRemoveSearchTerm,
      {
        detectorId: this.detectorId,
        text: utterance.text,
        ts: Math.floor(new Date().getTime() / 1000).toString()
      }
    );
    this.allUtterances.splice(index, 1);
  }
}
