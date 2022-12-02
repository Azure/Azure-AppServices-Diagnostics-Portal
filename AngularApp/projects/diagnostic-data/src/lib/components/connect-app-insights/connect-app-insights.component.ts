import { Component, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import {
  DIAGNOSTIC_DATA_CONFIG,
  DiagnosticDataConfig
} from '../../config/diagnostic-data-config';
import { DiagnosticData } from '../../models/detector';

@Component({
  selector: 'connect-app-insights',
  templateUrl: './connect-app-insights.component.html',
  styleUrls: ['./connect-app-insights.component.scss']
})
export class ConnectAppInsightsComponent extends DataRenderBaseComponent {
  isPublic: boolean;
  resourceId: string;

  constructor(
    protected telemetryService: TelemetryService,
    @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig
  ) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    if (data.table.rows.length > 0) {
      this.resourceId = data.table.rows[0][0];
    }
  }
}
