import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'autohealing-startup-time',
  templateUrl: './autohealing-startup-time.component.html',
  styleUrls: ['../autohealing.component.scss']
})
export class AutohealingStartupTimeComponent implements OnInit {
  constructor() {}

  editMode: boolean = false;

  @Input() minProcessExecutionTime: number;
  @Output() minProcessExecutionTimeChange: EventEmitter<number> =
    new EventEmitter<number>();

  localMinProcessExecutionTime: number;

  configureMinProcessExecutionTime() {
    this.editMode = true;
  }

  ngOnInit(): void {
    if (this.minProcessExecutionTime) {
      this.localMinProcessExecutionTime = this.minProcessExecutionTime;
    } else {
      this.localMinProcessExecutionTime = 0;
    }
  }

  saveConfig() {
    this.minProcessExecutionTime = this.localMinProcessExecutionTime;
    this.editMode = false;
    this.minProcessExecutionTimeChange.emit(this.minProcessExecutionTime);
  }

  isValid(): boolean {
    if (
      this.localMinProcessExecutionTime != null &&
      this.localMinProcessExecutionTime != this.minProcessExecutionTime &&
      this.localMinProcessExecutionTime <= 7200
    ) {
      return true;
    } else {
      return false;
    }
  }
}
