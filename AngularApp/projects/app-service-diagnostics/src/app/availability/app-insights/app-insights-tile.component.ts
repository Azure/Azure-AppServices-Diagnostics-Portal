import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StartupInfo } from '../../shared/models/portal';
import { AppInsightsService } from '../../shared/services/appinsights/appinsights.service';
import { PortalActionService } from '../../shared/services/portal-action.service';
import { LoggingService } from '../../shared/services/logging/logging.service';

@Component({
  selector: 'app-insights-tile',
  templateUrl: 'app-insights-tile.component.html',
  styleUrls: ['app-insights-tile.component.scss']
})
export class AppInsightsTileComponent {
  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
  slotName: string;

  constructor(
    public appInsightsService: AppInsightsService,
    public portalActionService: PortalActionService,
    private logger: LoggingService
  ) {}

  OpenAppInsights() {
    this.portalActionService.openAppInsightsBlade();
    this.logger.LogClickEvent('Application Insights Blade', 'Support Home');
  }
}
