import { Component, Input } from '@angular/core';
import { KeystoneInsight } from '../../models/keystone';

import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {
  DiagnosticData,
  HealthStatus,
  InsightsRendering,
  Rendering,
  RenderingType
} from '../../models/detector';
import { Insight, InsightUtils } from '../../models/insight';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { Solution } from '../solution/solution';

@Component({
  selector: 'keystone-insight',
  templateUrl: './keystone-insight.component.html',
  styleUrls: ['./keystone-insight.component.scss']
})
export class KeystoneInsightComponent extends DataRenderBaseComponent {
  @Input() isRecommended: boolean = true;
  keystoneInsight: KeystoneInsight;
  keystoneInsightStatus = HealthStatus;
  renderingProperties: Rendering;
  solutionTitleImageSrc: string =
    '../../../../assets/img/case-submission-flow/Help-and-Support.svg';
  keystoneSolution: Solution;

  constructor(protected telemetryService: TelemetryService) {
    super(telemetryService);
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <InsightsRendering>data.renderingProperties;
    this.parseKeystoneInsight(data);
  }

  public parseKeystoneInsight(diagnosticData: DiagnosticData) {
    const data = diagnosticData.table;

    if (!!data && !!data.rows && data.rows.length > 0 && !!data.rows[0][0]) {
      const keystoneInsightJsonStr = data.rows[0][0];
      this.keystoneInsight = JSON.parse(keystoneInsightJsonStr);
      this.keystoneSolution =
        !!this.keystoneInsight && !!this.keystoneInsight.Solution
          ? this.keystoneInsight.Solution
          : null;
      this.keystoneInsightStatus =
        !!this.keystoneInsight && !!this.keystoneInsightStatus
          ? this.keystoneInsightStatus
          : null;

      this.telemetryService.logEvent('KeystoneInsightLoaded', {
        Status: String(this.keystoneInsightStatus),
        Title: this.keystoneInsight.Title,
        KeystoneInsightDetails: keystoneInsightJsonStr
      });
    }
  }
}
