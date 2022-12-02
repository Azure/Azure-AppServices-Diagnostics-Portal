import { Component, OnInit } from '@angular/core';
import { ServiceIncidentService } from '../../services/service-incident.service';
import { IncidentStatus } from '../../models/icm-incident';

@Component({
  selector: 'incident-summary',
  templateUrl: './incident-summary.component.html',
  styleUrls: ['./incident-summary.component.scss']
})
export class IncidentSummaryComponent implements OnInit {
  IncidentStatus = IncidentStatus;

  constructor(public incidentService: ServiceIncidentService) {}

  ngOnInit() {}
}
