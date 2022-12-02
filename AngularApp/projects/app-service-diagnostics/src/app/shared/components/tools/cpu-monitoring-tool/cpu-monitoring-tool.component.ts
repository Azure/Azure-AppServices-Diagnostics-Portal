import { Component, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';

@Component({
  selector: 'cpu-monitoring-tool',
  templateUrl: './cpu-monitoring-tool.component.html',
  styleUrls: [
    './cpu-monitoring-tool.component.scss',
    '../styles/daasstyles.scss'
  ]
})
export class CpuMonitoringToolComponent implements OnInit {
  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  title: string = 'Proactive CPU Monitoring';
  description: string =
    'Proactive CPU Monitoring provides you with an easy way to take an action when your app or any child process for your app is consuming high CPU resources. The triggers allow you to define CPU thresholds at which you want the actions to be taken. This feature also helps in mitigating the issue by killing the process consuming high CPU.  Please note that these mitigations should only be considered a temporary workaround until you find the real cause for the issue causing the unexpected behavior.';

  constructor(private _siteService: SiteService) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe((site) => {
      this.siteToBeDiagnosed = site;
    });
  }

  ngOnInit() {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(
      (hostname) => hostname.indexOf('.scm.') > 0
    );
  }
}
