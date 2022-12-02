import * as momentNs from 'moment';
import { ReplaySubject } from 'rxjs';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DiagnosticData, RenderingType } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { CompilationProperties } from '../../models/compilation-properties';
import {
  XAxisSelection,
  xAxisPlotBand,
  zoomBehaviors
} from '../../models/time-series';
export interface DataRenderer {
  diagnosticDataInput: DiagnosticData;
}

@Component({
  templateUrl: './data-render-base.component.html'
})
export class DataRenderBaseComponent implements OnInit, DataRenderer {
  diagnosticData: DiagnosticData;
  protected DataRenderingType: RenderingType;
  private _diagnosticDataSubject: ReplaySubject<DiagnosticData> =
    new ReplaySubject<DiagnosticData>(1);

  @Input() set diagnosticDataInput(detector: DiagnosticData) {
    this._diagnosticDataSubject.next(detector);
  }
  @Input() startTime: momentNs.Moment;
  @Input() endTime: momentNs.Moment;
  @Input() detectorEventProperties: any;
  @Input() developmentMode: boolean = false;
  @Input() executionScript: string;
  @Input() detector: string = '';
  @Input() compilationPackage: CompilationProperties;
  @Input() isAnalysisView: boolean = false;
  private _xAxisPlotBands: xAxisPlotBand[] = null;
  @Input() public set xAxisPlotBands(value: xAxisPlotBand[]) {
    this._xAxisPlotBands = [];
    this._xAxisPlotBands = value;
  }
  public get xAxisPlotBands() {
    return this._xAxisPlotBands;
  }
  private _zoomBehavior: zoomBehaviors = zoomBehaviors.Zoom;
  @Input() public set zoomBehavior(value: zoomBehaviors) {
    this._zoomBehavior = value;
  }
  public get zoomBehavior() {
    return this._zoomBehavior;
  }

  @Output() XAxisSelection: EventEmitter<XAxisSelection> =
    new EventEmitter<XAxisSelection>();
  public onXAxisSelection(event: XAxisSelection) {
    this.XAxisSelection.emit(event);
  }

  constructor(protected telemetryService: TelemetryService) {}

  ngOnInit() {
    this._diagnosticDataSubject.subscribe((data: DiagnosticData) => {
      this.processData(data);
    });
  }

  protected processData(data: DiagnosticData) {
    if (data) {
      this.diagnosticData = data;
    }
  }

  protected logEvent(
    eventMessage: string,
    eventProperties?: any,
    measurements?: any
  ) {
    if (this.detectorEventProperties) {
      for (const id of Object.keys(this.detectorEventProperties)) {
        if (this.detectorEventProperties.hasOwnProperty(id)) {
          eventProperties[id] = String(this.detectorEventProperties[id]);
        }
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }
}
