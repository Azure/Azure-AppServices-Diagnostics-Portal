import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
    templateUrl: 'java-threaddump-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class JavaThreadDumpToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect a Java Thread dump';
    description: string = 'If your Java app is performing slow or not responding at all, you can collect a jStack log to identify the state of threads running the java.exe';

    thingsToKnowBefore: string[] = [
        'Collecting a jStack log will freeze the process until the jStack log is collected so process cannot serve any requests during the time jStack is running.',
        'jStack logs are collected for all the Java process (java.exe) running on the instance.',
        'jStack takes a few seconds to run but if there are many threads, it can take slightly longer to collect this data.',
        'Your App will not be restarted as a result of collecting the jStack logs.'
    ];

    constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService) {
        super(_siteServiceLocal, _webSiteServiceLocal);
    }
    ngOnInit(): void {
        this.diagnoserName = 'JAVA Thread Dump';
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }
}
