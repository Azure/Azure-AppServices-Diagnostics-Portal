import { Component, OnInit, Input } from '@angular/core';
import { DataProviderMetadata, DetectorResponse, QueryResponseService } from 'diagnostic-data';
import { ActivatedRoute, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorControlService } from 'diagnostic-data';

@Component({
  selector: 'tab-data-sources',
  templateUrl: './tab-data-sources.component.html',
  styleUrls: ['./tab-data-sources.component.scss']
})
export class TabDataSourcesComponent {

  constructor(private _route: ActivatedRoute, private _diagnosticApiService: ApplensDiagnosticService, private _detectorControlService: DetectorControlService, private _queryResponseService: QueryResponseService) {
  }

  @Input() onboardingMode: boolean = false;
  @Input() detectorResponse: DetectorResponse;

  detector: string;
  error: any;
  loadingDetector: boolean = true;
  dataProviderMetadata: DataProviderMetadata[] = [];
  providerColors = [{ name: "Kusto", color: "#2f2c69", text: "Run in Kusto Web Explorer" },
  { name: "MDM", color: "#095fb0", text: "Jarvis link" },
  { name: "AppInsights", color: "#68217a", text: "AppInights Log Analytics Documentation" },
  { name: "AzureSupportCenter", color: "#0078d7", text: "Azure Support Center link" }
  ];

  ngOnInit() {

    this._queryResponseService.getQueryResponse().subscribe(x => {
      this.detectorResponse = x.invocationOutput;
      this.dataProviderMetadata = this.getDataProviderMetadata(this.detectorResponse);
    });

    if (!this.onboardingMode) {
      this._route.params.subscribe((params: Params) => {
        this.getDetectorResponse();
      });

      this._route.queryParams.subscribe((queryParams: Params) => {
        this.getDetectorResponse();
      });
    }
    else {
      this.dataProviderMetadata = this.getDataProviderMetadata(this.detectorResponse);
      this.loadingDetector = false;
    }
  }

  getDetectorResponse() {
    this.detectorResponse = null;

    if (this._route.snapshot.params['detector']) {
      this.detector = this._route.snapshot.params['detector'];
    }
    else {
      this.detector = this._route.parent.snapshot.params['detector'];
    }
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });
    this._diagnosticApiService.getDetector(this.detector, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, this._detectorControlService.shouldRefresh, this._detectorControlService.isInternalView, additionalQueryString)
      .subscribe((response: DetectorResponse) => {
        this.loadingDetector = false;
        this.detectorResponse = response;
        this.dataProviderMetadata = this.getDataProviderMetadata(response);
      }, (error: any) => {
        this.error = error;
      });
  }

  getDataProviderMetadata(response: DetectorResponse): DataProviderMetadata[] {
    let metadata: DataProviderMetadata[] = [];
    response.dataProvidersMetadata.forEach(element => {
      if (this.hasMetadata(element)) {
        let idx = metadata.findIndex(x => x.providerName.toLowerCase() === element.providerName.toLowerCase());
        if (idx > -1) {
          element.propertyBag.forEach(bag => {
            if (bag.key != null && bag.key.length > 0) {
              if (metadata[idx].propertyBag.findIndex(e => e.value.text != null && e.value.text === bag.value.text) === -1) {
                metadata[idx].propertyBag.push(bag);
              }
            }
          });
        } else {
          metadata.push(element);
        }
      }
    });

    return metadata;
  }

  hasMetadata(providerMetadata: DataProviderMetadata): boolean {
    return providerMetadata.propertyBag.length > 0 && providerMetadata.propertyBag.findIndex(x => x.key.length > 0) > -1;
  }

  getImageForProvider(providerName: string) {
    return `assets/img/${providerName.toLowerCase()}.png`;
  }

  getColorForProvider(providerName: string) {
    let idx = this.providerColors.findIndex(x => x.name.toLowerCase() === providerName.toLowerCase());
    if (idx > -1) {
      return this.providerColors[idx].color
    } else {
      return "lightgray";
    }
  }

  getProviderText(providerName: string) {
    let idx = this.providerColors.findIndex(x => x.name.toLowerCase() === providerName.toLowerCase());
    if (idx > -1) {
      return this.providerColors[idx].text
    } else {
      return "Link";
    }
  }
}
