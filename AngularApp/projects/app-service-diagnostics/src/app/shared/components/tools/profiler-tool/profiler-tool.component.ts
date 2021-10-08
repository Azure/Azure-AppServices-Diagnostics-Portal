import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';
import { DaasBaseComponent } from '../daas-base/daas-base.component';

@Component({
    templateUrl: 'profiler-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class ProfilerToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect a Profiler Trace';
    description: string = 'If your app is down or performing slow, you can collect a profiling trace to identify the root cause of the issue. Profiling is light weight and is designed for production scenarios.';

    thingsToKnowBefore: string[] = [
        'Once the profiler trace is started, reproduce the issue by browsing to the web app.',
        'The profiler trace will automatically stop after 60 seconds.',
        'If thread report option is enabled, then raw stack traces of threads inside the process will be collected as well.',
        'With thread report option, your App may be paused for a few seconds till all the threads are dumped.',
        'Your web app will not be restarted as a result of running the profiler.',
        'A profiler trace will help to identify issues in an ASP.NET or ASP.NET Core application.',
    ];

    constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService) {
        super(_siteServiceLocal, _webSiteServiceLocal);
    }

    ngOnInit(): void {
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }
}
