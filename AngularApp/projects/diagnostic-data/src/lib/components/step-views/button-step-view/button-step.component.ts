
import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { ButtonStepView, StepViewContainer } from '../step-view-lib';

@Component({
  selector: 'button-step',
  templateUrl: './button-step.component.html',
  styleUrls: ['./button-step.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ButtonStepComponent implements OnInit {
  @Input() viewModel: StepViewContainer;
  buttonStepView: ButtonStepView;


  constructor(private _telemetryService: TelemetryService) {
  }

  ngOnInit() {
    this.buttonStepView = <ButtonStepView>this.viewModel.stepView;
  }

  onClick(){
    this.buttonStepView.hidden = true;
    this.buttonStepView.callback();
  }

}


