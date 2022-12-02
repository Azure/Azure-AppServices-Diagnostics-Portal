import { Injectable } from '@angular/core';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { of, Observable } from 'rxjs';

@Injectable()
export class WebHostingEnvironmentsService extends ResourceService {
  public get searchSuffix(): string {
    return 'App Service Environment';
  }

  public get azureServiceName(): string {
    return 'ASE';
  }

  public getPesId(): Observable<string> {
    return of('16533');
  }

  public getSapProductId(): Observable<string> {
    return of('2fd37acf-7616-eae7-546b-1a78a16d11b5');
  }
}
