import { Component, OnInit } from '@angular/core';
import { ResourceService } from '../../shared-v2/services/resource.service';
import { WebSitesService } from '../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../shared/models/site';
import { Location } from '@angular/common';
import { ABTestingService } from '../../shared/services/abtesting.service';

@Component({
  selector: 'diag-chat-home',
  templateUrl: './diag-chat-home.component.html',
  styleUrls: ['./diag-chat-home.component.scss']
})
export class DiagChatHomeComponent implements OnInit {
  isWindowsOrLinuxApp: boolean = false;
  isConversationalDiagnosticEnabledByAppSetting: boolean = false;
  constructor(private _resourceService: ResourceService, private _location: Location, private abTestingService: ABTestingService) { }

  ngOnInit(): void {
    this.isWindowsOrLinuxApp = this.checkIsWindowsOrLinuxApp();
    this.abTestingService.checkIfEnabledByAppSetting().subscribe((enabled) => {
      this.isConversationalDiagnosticEnabledByAppSetting = enabled;
    });
  }

  private checkIsWindowsOrLinuxApp(): boolean {
    let webSiteService = this._resourceService as WebSitesService;
    return this._resourceService && this._resourceService instanceof WebSitesService
      && (webSiteService.platform === OperatingSystem.windows || webSiteService.platform === OperatingSystem.linux);
  }

  navigateToLastPage() {
    this._location.back();
  }

}
