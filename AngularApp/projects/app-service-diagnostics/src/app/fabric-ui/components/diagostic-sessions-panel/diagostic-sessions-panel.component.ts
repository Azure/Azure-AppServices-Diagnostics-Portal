import { Component, OnInit } from '@angular/core';
import { PanelType } from 'office-ui-fabric-react';
import { Globals } from '../../../globals';
import { SiteDaasInfo } from '../../../shared/models/solution-metadata';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { SiteService } from '../../../shared/services/site.service';

@Component({
  selector: 'diagostic-sessions-panel',
  templateUrl: './diagostic-sessions-panel.component.html',
  styleUrls: ['./diagostic-sessions-panel.component.scss']
})
export class DiagosticSessionsPanelComponent implements OnInit {
  siteToBeDiagnosed: SiteDaasInfo;
  scmPath: string;
  type: PanelType = PanelType.custom;
  width: string = '850px';

  constructor(
    public webSiteService: WebSitesService,
    private _siteService: SiteService,
    public globals: Globals
  ) {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe((site) => {
      this.siteToBeDiagnosed = site;
    });

    this.scmPath = this.webSiteService.resource
      ? this.webSiteService.resource.properties.enabledHostNames.find(
          (hostname) => hostname.indexOf('.scm.') > 0
        )
      : '';
  }

  ngOnInit() {}

  dismissedHandler() {
    this.globals.openSessionPanel = false;
  }
}
