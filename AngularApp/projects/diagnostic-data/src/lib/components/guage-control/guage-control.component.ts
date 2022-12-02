import { Component, Input, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import {
  DataTableResponseObject,
  DiagnosticData,
  HealthStatus,
  Rendering
} from '../../models/detector';
import {
  GuageControl,
  GuageElement,
  GuageGraphic,
  GuageRenderDirection,
  GuageSize
} from '../../models/guage';

@Component({
  selector: 'guage-control',
  templateUrl: './guage-control.component.html',
  styleUrls: ['./guage-control.component.scss']
})
export class GuageControlComponent extends DataRenderBaseComponent {
  InsightStatus = HealthStatus;
  guage: GuageControl;
  renderingProperties: Rendering;

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = data.renderingProperties;
    this.parseData(data.table);
  }

  public isVertical(renderDirection: GuageRenderDirection): boolean {
    return renderDirection === GuageRenderDirection.Vertical;
  }

  public isHorizontal(renderDirection: GuageRenderDirection): boolean {
    return renderDirection === GuageRenderDirection.Horizontal;
  }

  private parseData(table: DataTableResponseObject) {
    //Parse the incoming data from the detector backend to create the Guages Array and then initiaze the guage object
    const renderDirectionColumn = 0;
    const sizeColumn = 1;
    const fillColorColumn = 2;
    const percentFilledColumn = 3;
    const displayValueColumn = 4;
    const labelColumn = 5;
    const descriptionColumn = 6;

    if (!(table.rows === undefined || table.rows.length < 1)) {
      this.guage = new GuageControl();
      this.guage.renderDirection = table.rows[0][renderDirectionColumn];
      this.guage.guages = [];

      var currFillColor: HealthStatus;
      for (let i: number = 0; i < table.rows.length; i++) {
        const row = table.rows[i];

        switch (row[fillColorColumn]) {
          case this.InsightStatus.Critical:
            currFillColor = HealthStatus.Critical;
            break;
          case this.InsightStatus.Warning:
            currFillColor = HealthStatus.Warning;
            break;
          case this.InsightStatus.Success:
            currFillColor = HealthStatus.Success;
            break;
          default:
            currFillColor = HealthStatus.Info;
            break;
        }

        this.guage.guages[i] = new GuageElement(
          new GuageGraphic(
            currFillColor,
            row[percentFilledColumn],
            row[displayValueColumn],
            row[labelColumn],
            row[sizeColumn]
          ),
          row[descriptionColumn]
        );
      }
    }
  }
}
