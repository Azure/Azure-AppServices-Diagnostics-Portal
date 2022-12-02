import { Injectable } from '@angular/core';
import { ArmService } from './arm.service';
import { Observable } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class SubscriptionPropertiesService {
  constructor(private ArmService: ArmService) {}

  getSubscriptionProperties(
    subscriptionId: string
  ): Observable<HttpResponse<any>> {
    return this.ArmService.getResourceFullResponse<any>(
      `/subscriptions/${subscriptionId}`,
      false,
      '2019-06-01'
    );
  }
}
