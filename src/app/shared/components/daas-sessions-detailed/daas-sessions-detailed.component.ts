import { Component, OnInit } from '@angular/core';
import { SiteService } from '../../services/site.service';
import { AvailabilityLoggingService } from '../../services/logging/availability.logging.service';
import { ServerFarmDataService } from '../../services/server-farm-data.service';
import { MetaDataHelper } from '../../utilities/metaDataHelper';
import { SiteDaasInfo } from '../../models/solution-metadata';

@Component({
  selector: 'daas-sessions-detailed',
  templateUrl: './daas-sessions-detailed.component.html',
  styleUrls: ['./daas-sessions-detailed.component.css']
})
export class DaasSessionsDetailedComponent implements OnInit {

  siteToBeDiagnosed:SiteDaasInfo;
  scmPath:string = "";
  couldNotFindSite :  boolean = false;

  constructor(private _siteService: SiteService, private _logger: AvailabilityLoggingService, private _serverFarmService: ServerFarmDataService) {
  }

  ngOnInit(): void {

      this._siteService.currentSiteMetaData.subscribe(siteInfo => {
        if (siteInfo) {
            
            let siteInfoMetaData = siteInfo;
            this.siteToBeDiagnosed = new SiteDaasInfo();
            
            this.siteToBeDiagnosed.subscriptionId = siteInfo.subscriptionId;
            this.siteToBeDiagnosed.resourceGroupName =siteInfo.resourceGroupName;
            this.siteToBeDiagnosed.siteName = siteInfo.siteName;
            this.siteToBeDiagnosed.slot =siteInfo.slot;
            this.siteToBeDiagnosed.instances = [];

        }
    });

    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(hostname => hostname.indexOf('.scm.') > 0);
  }

}
