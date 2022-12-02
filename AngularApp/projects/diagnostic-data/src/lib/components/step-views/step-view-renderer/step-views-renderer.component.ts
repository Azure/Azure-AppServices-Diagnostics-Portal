import {
  Component,
  Inject,
  Input,
  OnInit,
  Pipe,
  PipeTransform,
  ViewEncapsulation
} from '@angular/core';
import { DiagnosticData } from '../../../models/detector';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../../data-render-base/data-render-base.component';
import { StepViewContainer, StepViewType } from '../step-view-lib';

@Component({
  selector: 'step-views-renderer',
  templateUrl: './step-views-renderer.component.html',
  styleUrls: ['./step-views-renderer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class StepViewsRendererComponent
  extends DataRenderBaseComponent
  implements OnInit
{
  stepViews: StepViewContainer[] = [];
  constructor(private _telemetryService: TelemetryService) {
    super(_telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    var json = data.table.rows[0][0];
    var stepViews = JSON.parse(json);
    this.stepViews = stepViews.map((s) => {
      if (s.type == StepViewType.check) {
        s['expandByDefault'] = true;
      }
      return new StepViewContainer(s);
    });
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
