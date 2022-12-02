import {
  Component,
  Inject,
  Input,
  OnInit,
  Pipe,
  PipeTransform,
  ViewEncapsulation
} from '@angular/core';
import { RenderingType } from '../../../models/detector';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { InfoStepView, StepViewContainer } from '../step-view-lib';

@Component({
  selector: 'info-step',
  templateUrl: './info-step.component.html',
  styleUrls: ['./info-step.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InfoStepComponent implements OnInit {
  @Input() viewModel: StepViewContainer;
  infoStepView: InfoStepView;
  DataRenderingType = RenderingType.StepViews;
  constructor(private _telemetryService: TelemetryService) {}

  ngOnInit(): void {
    this.infoStepView = <InfoStepView>this.viewModel.stepView;
  }
}
