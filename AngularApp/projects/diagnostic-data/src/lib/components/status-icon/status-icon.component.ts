import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HealthStatus } from '../../models/detector';
import { StatusStyles } from '../../models/styles';
import { LoadingStatus } from '../../models/loading';

@Component({
  selector: 'status-icon',
  templateUrl: './status-icon.component.html',
  styleUrls: ['./status-icon.component.scss']
})
export class StatusIconComponent implements OnChanges {

  @Input() status: HealthStatus;
  @Input() loading: LoadingStatus = LoadingStatus.Success;
  @Input() size: number = 16;

  LoadingStatus = LoadingStatus;

  statusColor: string;
  statusIcon: string;

  constructor() { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['status'] && this.status !== null) {
      this.statusColor = StatusStyles.getColorByStatus(this.status);
      this.statusIcon = StatusStyles.getIconByStatus(this.status);
    }
  }

}
