import { Component, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {
  DiagnosticData,
  Rendering,
  RenderingType
} from '../../models/detector';

@Component({
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent extends DataRenderBaseComponent {
  DataRenderingType = RenderingType.DataSummary;

  renderingProperties: Rendering;

  email: string;

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    this.email = this.diagnosticData.table.rows[0][0];
  }
}
