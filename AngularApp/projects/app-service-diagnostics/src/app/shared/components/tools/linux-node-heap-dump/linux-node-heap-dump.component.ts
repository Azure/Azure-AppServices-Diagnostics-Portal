import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SiteService } from '../../../services/site.service';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
  selector: 'linux-node-heap-dump',
  templateUrl: './linux-node-heap-dump.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class LinuxNodeHeapDumpComponent extends DaasBaseComponent implements OnInit {
  title: string = 'Collect Node Heap Dump';
  description: string = 'If your app is consuming memory or running slow, you can collect a heap dump to identify the root cause';
  thingsToKnowBefore: string[] = [
    'Node heap dump helps you diagnosing memory issues in your Node app',
    'The heap dump is collected using Node V8 inspector.'
  ];
  diagnoserNameLookup: string;
  allLinuxInstancesOnAnt98: boolean = true;

  constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService,
    private _activatedRoute: ActivatedRoute) {
    super(_siteServiceLocal, _webSiteServiceLocal);
  }

  ngOnInit(): void {
    this.diagnoserName = 'HeapDump';
    this.diagnoserNameLookup = this.diagnoserName;
    this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }
}
