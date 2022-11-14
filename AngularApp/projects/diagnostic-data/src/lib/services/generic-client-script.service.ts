import { Injectable, ViewContainerRef } from '@angular/core';
import { DiagnosticData } from '../models/detector';

@Injectable()
export class GenericClientScriptService {
  public process(viewContainerRef: ViewContainerRef, data: DiagnosticData) {
    return null;
  }
}
