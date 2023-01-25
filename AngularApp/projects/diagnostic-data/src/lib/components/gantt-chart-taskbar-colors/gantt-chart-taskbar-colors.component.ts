import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'gantt-chart-taskbar-colors',
  templateUrl: './gantt-chart-taskbar-colors.component.html',
  styleUrls: ['./gantt-chart-taskbar-colors.component.scss'],
})
export class GanttChartTaskbarColorsComponent implements OnInit {
  customColorData: any[];
  @Input() graphOptions: any;
  @Input() formattedGanttChartData: any[];

  ngOnInit(): void {
    if (this.formattedGanttChartData.length > 0) {
      this.customColorData = this._getCustomColorData(this.formattedGanttChartData);
    }
  }

  private _getCustomColorData(data: any[]) {
    const { customColorColumnName, customColorDescriptionColumnName } =
      this.graphOptions?.taskBar || {};

    const colorData = [],
      colorCodesAndDescription = new Map();
    data.forEach((value) => {
      const colorDescription = value[customColorDescriptionColumnName];
      const colorCode = value[customColorColumnName];

      if (!colorCodesAndDescription.has(colorCode)) {
        colorData.push({
          colorCode,
          colorDescription,
        });
        colorCodesAndDescription.set(colorCode, colorDescription);
      }
    });
    return colorData;
  }
}
