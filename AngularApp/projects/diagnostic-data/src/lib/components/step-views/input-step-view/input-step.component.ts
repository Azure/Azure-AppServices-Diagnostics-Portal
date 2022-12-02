import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { InputStepView, StepViewContainer } from '../step-view-lib';

@Component({
  selector: 'input-step',
  templateUrl: './input-step.component.html',
  styleUrls: ['./input-step.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InputStepComponent implements OnInit {
  @Input() viewModel: StepViewContainer;
  inputStepView: InputStepView;

  constructor(private _telemetryService: TelemetryService) {}

  ngOnInit(): void {
    this.inputStepView = <InputStepView>this.viewModel.stepView;
  }

  expand() {
    this.inputStepView.collapsed = false;
  }
}
