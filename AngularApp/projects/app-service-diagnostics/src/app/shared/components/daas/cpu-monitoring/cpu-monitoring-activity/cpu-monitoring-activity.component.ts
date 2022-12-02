import {
  Component,
  OnInit,
  Input,
  OnChanges,
  SimpleChange
} from '@angular/core';
import { SiteDaasInfo } from '../../../../models/solution-metadata';
import { ActiveMonitoringSession } from '../../../../models/daas';

@Component({
  selector: 'cpu-monitoring-activity',
  templateUrl: './cpu-monitoring-activity.component.html',
  styleUrls: ['./cpu-monitoring-activity.component.scss']
})
export class CpuMonitoringActivityComponent implements OnInit, OnChanges {
  constructor() {}

  @Input() scmPath: string;
  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() activeMonitoringSession: ActiveMonitoringSession;

  highlightPhrases: string[] = ['threshold', 'dump', 'killed'];

  ngOnInit() {}

  ngOnChanges() {}

  formatInstanceLogs(logs: string) {
    let logsArray = logs.split('\r\n');

    for (let index = 0; index < logsArray.length; index++) {
      if (
        this.highlightPhrases.some(function (v) {
          return logsArray[index].indexOf(v) >= 0;
        })
      ) {
        logsArray[index] = '<strong>' + logsArray[index] + '</strong>';
      }
    }
    return logsArray.join('\r\n');
  }
}
