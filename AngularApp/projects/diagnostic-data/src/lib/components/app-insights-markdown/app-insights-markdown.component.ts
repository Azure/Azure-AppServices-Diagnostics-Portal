import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TelemetryService } from './../../services/telemetry/telemetry.service';
import { Component, Inject } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticService } from '../../services/diagnostic.service';
import {
  DataTableResponseColumn,
  DataTableResponseObject,
  DiagnosticData,
  Rendering,
  RenderingType,
  TimeSeriesRendering,
  TimeSeriesType
} from '../../models/detector';
import { FeatureNavigationService } from '../../services/feature-navigation.service';
import {
  DIAGNOSTIC_DATA_CONFIG,
  DiagnosticDataConfig
} from '../../config/diagnostic-data-config';
import { AppInsightsQueryService } from '../../services/appinsights.service';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {
  AppInsightData,
  AppInsightQueryMetadata,
  BladeInfo
} from '../../models/app-insights';

@Component({
  selector: 'app-insights-markdown',
  templateUrl: './app-insights-markdown.component.html',
  styleUrls: ['./app-insights-markdown.component.scss'],
  animations: [
    trigger('loadingAnimation', [
      state(
        'shown',
        style({
          opacity: 1
        })
      ),
      state(
        'hidden',
        style({
          opacity: 0
        })
      ),
      transition('* => *', animate('.5s'))
    ])
  ]
})
export class AppInsightsMarkdownComponent extends DataRenderBaseComponent {
  renderingProperties: Rendering;
  isPublic: boolean;
  isAppInsightsEnabled: boolean = false;
  appInsightQueryMetaDataList: AppInsightQueryMetadata[] = [];
  appInsightDataList: AppInsightData[] = [];
  diagnosticDataSet: DiagnosticData[] = [];
  loadingAppInsightsResource: boolean = true;
  loadingAppInsightsQueryData: boolean = true;
  showSectionHeader: boolean = false;

  constructor(
    public _appInsightsService: AppInsightsQueryService,
    private _diagnosticService: DiagnosticService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    protected telemetryService: TelemetryService,
    private _navigator: FeatureNavigationService,
    @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig
  ) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;

    if (this.isPublic) {
      this._appInsightsService
        .CheckIfAppInsightsEnabled()
        .subscribe((isAppinsightsEnabled) => {
          this.isAppInsightsEnabled = isAppinsightsEnabled;
          this.loadingAppInsightsResource = false;
        });
    }
  }

  public getMetaDataMarkdown(metaData: AppInsightQueryMetadata) {
    let str =
      "<p style='font-weight:bold'>Ask the customer to run the following queries in the Application Insights Analytics:</p>";
    str += '<pre>' + metaData.query + '</pre>';
    return str;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;

    data.table.rows.map((row) => {
      this.appInsightQueryMetaDataList.push(<AppInsightQueryMetadata>{
        title: row[0],
        description: row[1],
        query: row[2],
        poralBladeInfo: row[3],
        renderingProperties: row[4],
        dataTable: row[5]
      });
    });

    if (this.appInsightQueryMetaDataList !== []) {
      this.appInsightQueryMetaDataList.forEach((appInsightData) => {
        if (appInsightData.dataTable !== null) {
          this.loadingAppInsightsResource = false;
          this.loadingAppInsightsQueryData = false;
          this.isAppInsightsEnabled = true;

          this.appInsightDataList.push(<AppInsightData>{
            title: appInsightData.title,
            description: appInsightData.description,
            renderingProperties: appInsightData.renderingProperties,
            poralBladeInfo: appInsightData.poralBladeInfo,
            diagnosticData: <DiagnosticData>{
              table: appInsightData.dataTable,
              renderingProperties: appInsightData.renderingProperties
            }
          });
        } else {
          if (this.isPublic) {
            this._appInsightsService.loadAppInsightsResourceObservable.subscribe(
              (loadStatus) => {
                if (loadStatus === true) {
                  this.loadingAppInsightsResource = false;
                  this.appInsightQueryMetaDataList.forEach((appInsightData) => {
                    this._appInsightsService
                      .ExecuteQuerywithPostMethod(appInsightData.query)
                      .subscribe((data) => {
                        if (data && data['Tables']) {
                          let rows = data['Tables'][0]['Rows'];
                          let columns = data['Tables'][0]['Columns'];
                          let dataColumns: DataTableResponseColumn[] = [];
                          columns.forEach((column) => {
                            dataColumns.push(<DataTableResponseColumn>{
                              columnName: column.ColumnName,
                              dataType: column.DataType,
                              columnType: column.ColumnType
                            });
                          });

                          this.appInsightDataList.push(<AppInsightData>{
                            title: appInsightData.title,
                            description: appInsightData.description,
                            renderingProperties:
                              appInsightData.renderingProperties,
                            poralBladeInfo: appInsightData.poralBladeInfo,
                            diagnosticData: <DiagnosticData>{
                              table: <DataTableResponseObject>{
                                columns: dataColumns,
                                rows: rows
                              },
                              renderingProperties:
                                appInsightData.renderingProperties
                            }
                          });
                        }

                        this.loadingAppInsightsQueryData = false;
                      });
                  });
                }
              }
            );
          }
        }
      });
    }
  }
}
