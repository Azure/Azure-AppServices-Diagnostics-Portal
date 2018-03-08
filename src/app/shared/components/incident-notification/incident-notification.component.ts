import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppAnalysisService } from '../../services/appanalysis.service';
import { SiteService } from '../../services/site.service';
import { IncidentNotification } from '../../models/icm-incident';
import { ServiceIncidentService } from '../../services/service-incident.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
    selector: 'incident-notification',
    templateUrl: 'incident-notification.component.html',
    styleUrls: ['incident-notification.component.css']
})
export class IncidentNotificationComponent {

    closed: boolean = false;

    resourceId: string;

    constructor(public incidentService: ServiceIncidentService, private _router: Router, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(info => { this.resourceId = info.resourceId.toLowerCase().replace('/providers/microsoft.web', '') });
    }

    openIncidentView() {
        this.closed = true;

        this._router.navigate([ `${this.resourceId}/diagnostics/incidents`]);
    }

}
