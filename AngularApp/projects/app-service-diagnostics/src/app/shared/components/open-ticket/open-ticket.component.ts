import { Component } from '@angular/core';
import { PortalService } from '../../../startup/services/portal.service';

@Component({
  selector: 'open-ticket',
  templateUrl: 'open-ticket.component.html'
})
export class OpenTicketComponent {
  constructor(private _portalService: PortalService) {}

  openSupportTicketBlade(): void {}
}
