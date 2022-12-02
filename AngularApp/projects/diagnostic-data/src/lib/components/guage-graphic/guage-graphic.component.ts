import { Component, Input, OnInit } from '@angular/core';
import { GuageGraphic, GuageSize } from '../../models/guage';
import { HealthStatus } from '../../models/detector';

@Component({
  selector: 'guage-graphic',
  templateUrl: './guage-graphic.component.html',
  styleUrls: ['./guage-graphic.component.scss']
})
export class GuageGraphicComponent implements OnInit {
  public isCritical(colorClass: HealthStatus): boolean {
    return colorClass === HealthStatus.Critical;
  }

  public isWarning(colorClass: HealthStatus): boolean {
    return colorClass === HealthStatus.Warning;
  }

  public isSuccess(colorClass: HealthStatus): boolean {
    return colorClass === HealthStatus.Success;
  }

  public isInfo(colorClass: HealthStatus): boolean {
    return colorClass === HealthStatus.Info;
  }

  public isNone(colorClass: HealthStatus): boolean {
    return colorClass === HealthStatus.None;
  }

  @Input() guageGraphic: GuageGraphic;

  constructor() {}

  ngOnInit() {}
}
