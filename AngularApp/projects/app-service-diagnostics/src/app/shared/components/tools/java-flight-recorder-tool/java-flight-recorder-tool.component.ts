import { Component, OnInit } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { DaasBaseComponent } from '../daas-base/daas-base.component';
import { WebSitesService } from '../../../../resources/web-sites/services/web-sites.service';

@Component({
  selector: 'java-flight-recorder-tool',
  templateUrl: './java-flight-recorder-tool.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class JavaFlightRecorderToolComponent extends DaasBaseComponent implements OnInit {

  title: string = 'Collect a JAVA Flight Recorder Trace';
  description: string = 'If your app is down or performing slow, you can collect a JFR trace to identify the root cause of the issue.';
  couldNotFindSite: boolean = false;

  refreshSessions: boolean = false;

  constructor(private _siteServiceLocal: SiteService, private _webSiteServiceLocal: WebSitesService) {
    super(_siteServiceLocal, _webSiteServiceLocal);
  }

  ngOnInit(): void {
    this.scmPath = this._siteServiceLocal.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }
}
