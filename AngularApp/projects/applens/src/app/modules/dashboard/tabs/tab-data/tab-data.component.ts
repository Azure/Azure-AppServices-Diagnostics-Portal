import { DetectorResponse } from 'diagnostic-data';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorControlService } from 'diagnostic-data';

@Component({
  selector: 'tab-data',
  templateUrl: './tab-data.component.html',
  styleUrls: ['./tab-data.component.scss']
})
export class TabDataComponent implements OnInit {

  constructor(private _route: ActivatedRoute, private _diagnosticApiService: ApplensDiagnosticService, private detectorControlService: DetectorControlService) { }

  detectorResponse: DetectorResponse;

  detector: string;

  error: any;

  analysisMode:boolean = false;

  ngOnInit() {

    this._route.params.subscribe((params: Params) => {
      this.refresh();
    });
    // If route query params contains detectorQueryParams, setting the values in shared service so it is accessible in all components
    this._route.queryParams.subscribe((queryParams: Params) => {
      if(queryParams.detectorQueryParams != undefined) {
        this.detectorControlService.setDetectorQueryParams(queryParams.detectorQueryParams);
      } else {
        this.detectorControlService.setDetectorQueryParams("");
      }

      this.analysisMode = this._route.snapshot.data['analysisMode'];
    })
  }

  refresh() {
    if(this._route.snapshot.params["drilldownDetectorName"]) {
      this.detector = this._route.snapshot.params["drilldownDetectorName"];
    }else {
      this.detector = this._route.snapshot.params['detector'];
    }
  }

}
