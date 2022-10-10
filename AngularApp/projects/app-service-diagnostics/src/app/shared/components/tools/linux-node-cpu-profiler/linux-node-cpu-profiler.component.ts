import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteService } from '../../../services/site.service';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
  selector: 'linux-node-cpu-profiler',
  templateUrl: './linux-node-cpu-profiler.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class LinuxNodeCpuProfilerComponent extends DaasBaseComponent implements OnInit {
  title: string = 'Collect Node Profiler Trace';
  description: string = 'If your app is respondingly slowly, collect a profiler trace to identify the root cause.';
  thingsToKnowBefore: string[] = [
    'The trace file helps in diagnosing performance issues in your Node app.',
    'The trace is collected using Node V8 inspector.'
  ];
  diagnoserNameLookup: string;
  allLinuxInstancesOnAnt98: boolean = true;

  constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService,
    private _activatedRoute: ActivatedRoute) {
    super(_siteServiceLocal, _webSiteServiceLocal);
  }

  ngOnInit(): void {
    this.diagnoserName = 'CpuProfile';
    this.diagnoserNameLookup = this.diagnoserName;
    this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }
}
