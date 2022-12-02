import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { FormatHelper } from '../../utilities/formattingHelper';

@Component({
  selector: 'timespan',
  templateUrl: './timespan.component.html',
  styleUrls: ['./timespan.component.scss']
})
export class TimespanComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    if (this.timeSpan && this.timeSpan !== '') {
      this.Seconds = FormatHelper.timespanToSeconds(this.timeSpan);
    }
  }

  @Input() timeSpan: string;
  @Input() placeholder: string;
  @Input() allowZeroValue: boolean;
  @Input() ControlId: string;

  @Input() label: string;

  @Output() timeSpanChange = new EventEmitter<string>();

  Seconds: number;

  updateTimeSpan(val) {
    this.Seconds = val;
    const timeSpan = FormatHelper.secondsToTimespan(this.Seconds);
    this.timeSpanChange.emit(timeSpan);
  }
}
