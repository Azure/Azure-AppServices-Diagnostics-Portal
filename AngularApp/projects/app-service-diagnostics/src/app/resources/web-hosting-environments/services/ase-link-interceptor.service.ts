import { Injectable } from '@angular/core';
import { LinkInterceptorService } from '../../../shared-v2/services/link-interceptor.service';
import { DiagnosticService } from 'diagnostic-data';
import { AseCategoryService } from './ase-category.service';

@Injectable()
export class AseLinkInterceptorService extends LinkInterceptorService {

  constructor(private _diagnosticServicePrivate: DiagnosticService, private _categoryServicePrivate: AseCategoryService) {
    super(_diagnosticServicePrivate, _categoryServicePrivate);
  }
}
