import { Component, Input, OnInit } from '@angular/core';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { SiteService } from '../../../services/site.service';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
    templateUrl: 'java-memorydump-tool.component.html',
    styleUrls: ['../styles/daasstyles.scss']
})
export class JavaMemoryDumpToolComponent extends DaasBaseComponent implements OnInit {

    title: string = 'Collect a Java Memory dump';
    description: string = 'If your Java app is consuming lot of memory, you can collect a Java Memory dump to identify the types responsible for high memory consumption.';

    thingsToKnowBefore: string[] = [
        'Java memory dumps are collected using the jMap utility.',
        'Collecting a jMap memory dump will freeze the process until the memory dump is collected so process cannot serve any requests during this time.',
        'jMap takes a significantly long time (in matter of minutes) to dump the JVM heap and this time can go significantly high if the memory consumption is high.',
        'Memory dumps are collected for all the Java process (java.exe) running on the instance.',
        'Your App will not be restarted as a result of collecting the Java Memory dump'
    ];

    constructor(private _siteServiceLocal: SiteService, private _websiteServiceLocal: WebSitesService) {
        super(_siteServiceLocal, _websiteServiceLocal);
    }
    ngOnInit(): void {
        this.diagnoserName = 'JAVA Memory Dump';
        this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
    }
}
