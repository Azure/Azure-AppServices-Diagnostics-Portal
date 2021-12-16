import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
    templateUrl: 'memorydump-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class MemoryDumpToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect a Memory dump';
    description: string = 'If your app is performing slow or not responding at all, you can collect a memory dump to identify the root cause of the issue.';
    thingsToKnowBefore: string[] = [
        'While collecting the memory dump, a clone of your app\'s process is created so the impact on the site availability is negligible.',
        'Dumps are collected for the worker process (w3wp.exe) and child processes of the worker process.',
        'Size of the memory dump is directly proportional to the process size, so processes consuming more memory will take longer to be dumped.',
        'Your App will not be restarted as a result of collecting the memory dump.'
    ];
    diagnoserNameLookup: string;

    constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService) {
        super(_siteServiceLocal, _webSiteServiceLocal);
    }

    ngOnInit(): void {
        this.diagnoserName = this.isWindowsApp && !this.isBetaSubscription? 'Memory Dump' : 'MemoryDump';
        this.diagnoserNameLookup = this.diagnoserName;
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }
}
