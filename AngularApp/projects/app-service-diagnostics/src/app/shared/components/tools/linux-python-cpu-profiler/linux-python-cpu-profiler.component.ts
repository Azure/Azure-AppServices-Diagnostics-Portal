import { Component, OnInit } from '@angular/core';
import { SiteService } from '../../../services/site.service';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
  selector: 'linux-python-cpu-profiler',
  templateUrl: './linux-python-cpu-profiler.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class LinuxPythonCpuProfilerComponent extends DaasBaseComponent implements OnInit {
  title: string = 'Collect Python profiler trace';
  description: string = 'If your app is responding slowly, you can collect a python profiler trace to identify the root cause';
  thingsToKnowBefore: string[] = [
    'The trace file helps in diagnosing performance issues in your python app.',
    'Your web app is not restarted while collecting the trace.'
  ];
  diagnoserNameLookup: string;
  allLinuxInstancesOnAnt98: boolean = true;

  constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService) {
    super(_siteServiceLocal, _webSiteServiceLocal);
  }

  ngOnInit(): void {
    this.diagnoserName = 'CpuProfile';
    this.diagnoserNameLookup = this.diagnoserName;
    this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }
}
