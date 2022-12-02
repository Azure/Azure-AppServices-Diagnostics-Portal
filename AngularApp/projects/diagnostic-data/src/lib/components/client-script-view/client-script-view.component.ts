import {
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewContainerRef,
  ViewEncapsulation
} from '@angular/core';
import { MarkdownService } from 'ngx-markdown';
import { DiagnosticData } from '../../models/detector';
import { DynamicInsight, Insight } from '../../models/insight';
import { GenericClientScriptService } from '../../services/generic-client-script.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DynamicInsightV4Component } from '../dynamic-insight-v4/dynamic-insight-v4.component';

@Component({
  selector: 'client-script-view',
  templateUrl: './client-script-view.component.html',
  styleUrls: ['./client-script-view.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ClientScriptViewComponent extends DataRenderBaseComponent {
  componentName: string;
  @ViewChild('clientScriptViewContainer', {
    read: ViewContainerRef,
    static: true
  })
  clientScriptViewContainer: ViewContainerRef;

  constructor(
    private _clientScriptService: GenericClientScriptService,
    private _telemetryService: TelemetryService
  ) {
    super(_telemetryService);
  }

  protected processData(data: DiagnosticData) {
    this._clientScriptService.process(this.clientScriptViewContainer, data);
  }
}
