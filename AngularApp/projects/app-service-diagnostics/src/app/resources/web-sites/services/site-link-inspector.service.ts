import { Injectable } from '@angular/core';
import { SitesCategoryService } from './sites-category.service';
import { DiagnosticService } from 'diagnostic-data';
import { LinkInterceptorService } from '../../../shared-v2/services/link-interceptor.service';

@Injectable()
export class SiteLinkInspectorService extends LinkInterceptorService {

  constructor(private _diagnosticServicePrivate: DiagnosticService, private _categoryServicePrivate: SitesCategoryService) {
    super(_diagnosticServicePrivate, _categoryServicePrivate);
  }
}
