import { HttpClient, HttpResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { SiteService } from '../../../services/site.service';
import { AvailabilityLoggingService } from '../../../services/logging/availability.logging.service';
import { SiteInfoMetaData } from '../../../models/site';
import { ServerFarmDataService } from '../../../services/server-farm-data.service';
import { UriElementsService } from '../../../services/urielements.service';
import { Observable, Subscription, interval } from 'rxjs';
import { ArmService } from '../../../services/arm.service';
import { NetworkTraceResult } from '../../../models/network-trace';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'network-trace-tool.component.html',
  styleUrls: ['../styles/daasstyles.scss']
})
export class NetworkTraceToolComponent implements OnInit {
  title: string = 'Collect a Network Trace';
  description: string =
    'If your app is facing issues while connecting to a remote server, you can use this tool to collect a network trace on the instance(s) serving the Web App.';
  NetworkTraceStatus = NetworkTraceStatus;
  scmPath: string;
  duration: number = 60;

  siteToBeDiagnosed: SiteInfoMetaData;
  files: any[] = [];
  armOperationStatus: string = '';
  subscriptionOperationStatus: Subscription;
  subscriptionTimer: Subscription;
  errorMessage: string = '';
  durationRemaining: number;
  status: NetworkTraceStatus = NetworkTraceStatus.Initial;
  traceLocation: string = 'd:\\home\\logfiles\\networktrace';

  checkingValidity: boolean = true;
  networkTraceDisabled: boolean = false;
  traceDisabledReason: NetworkTraceDisabledReason;
  NetworkTraceDisabledReasonType = NetworkTraceDisabledReason;

  constructor(
    private _http: HttpClient,
    private _siteService: SiteService,
    private _uriElementsService: UriElementsService,
    private _armClient: ArmService,
    private _serverFarmService: ServerFarmDataService,
    private _loggerLocal: AvailabilityLoggingService
  ) {
    this._siteService.currentSiteMetaData.subscribe((siteInfo) => {
      if (siteInfo) {
        this.siteToBeDiagnosed = siteInfo;
      }
    });
  }
  ngOnInit(): void {
    this.scmPath = this._siteService.currentSiteStatic.enabledHostNames.find(
      (hostname) => hostname.indexOf('.scm.') > 0
    );

    this._serverFarmService.hasServerFarmAccess.subscribe((hasAccess) => {
      if (hasAccess != null) {
        if (!hasAccess) {
          this.checkingValidity = false;
          this.networkTraceDisabled = true;
          this.traceDisabledReason =
            NetworkTraceDisabledReason.NoPermsOnAppServicePlan;
          return;
        } else {
          this._serverFarmService.siteServerFarm.subscribe(
            (serverFarm) => {
              if (serverFarm) {
                this.checkingValidity = false;
                // Specifically not checking for Isolated as Network Trace tool is not working on ASE currently
                if (
                  serverFarm.sku.tier === 'Standard' ||
                  serverFarm.sku.tier === 'Basic' ||
                  serverFarm.sku.tier.indexOf('Isolated') > -1 ||
                  serverFarm.sku.tier.indexOf('Premium') > -1
                ) {
                  this._siteService
                    .getSiteAppSettings(
                      this.siteToBeDiagnosed.subscriptionId,
                      this.siteToBeDiagnosed.resourceGroupName,
                      this.siteToBeDiagnosed.siteName,
                      this.siteToBeDiagnosed.slot
                    )
                    .subscribe((settingsResponse) => {
                      if (settingsResponse && settingsResponse.properties) {
                        if (
                          settingsResponse.properties[
                            'WEBSITE_LOCAL_CACHE_OPTION'
                          ]
                        ) {
                          const localCacheEnabled =
                            settingsResponse.properties[
                              'WEBSITE_LOCAL_CACHE_OPTION'
                            ] == 'Always';
                          if (localCacheEnabled) {
                            this.traceLocation =
                              'd:\\home\\logfiles\\{InstanceId}\\networktrace';
                          }
                        }
                      }
                    });
                } else {
                  this.networkTraceDisabled = true;
                  this.traceDisabledReason =
                    NetworkTraceDisabledReason.AppNotOnDedicatedTier;
                  return;
                }
              }
            },
            (error) => {
              this.checkingValidity = false;
              this.networkTraceDisabled = true;
              this.errorMessage = error.code + ':' + error.message;
            }
          );
        }
      }
    });
  }

  collectNetworkTrace() {
    this.status = NetworkTraceStatus.Starting;
    this._loggerLocal.LogClickEvent('Collect Network Trace', 'DiagnosticTools');
    const resourceUri: string =
      this._uriElementsService.getNetworkTraceUrl(this.siteToBeDiagnosed) +
      '?durationInSeconds=' +
      this.duration;
    this._armClient.postResourceFullResponse(resourceUri, null, true).subscribe(
      (result: HttpResponse<{}>) => {
        if (result.headers.get('Location') != null) {
          this.status = NetworkTraceStatus.Started;
          this.armOperationStatus = result.headers.get('Location');
          this.durationRemaining = this.duration;
          interval(5000)
            .pipe(takeWhile(() => this.durationRemaining > 0))
            .subscribe(() => {
              this.durationRemaining = this.durationRemaining - 5;
              if (this.durationRemaining <= 0) {
                this.subscriptionOperationStatus = interval(15000).subscribe(
                  (res) => {
                    this.checkNetworkTraceOperationStatus();
                  }
                );
              }
            });
        }
      },
      (error) => {
        if (
          error.status != null &&
          (error.status === 400 || error.status === 403 || error.status === 409)
        ) {
          const errorMsg = this.getErrorMessage(error);
          if (
            errorMsg
              .toLowerCase()
              .indexOf('OperationName: CaptureNetworkTrace'.toLowerCase()) >
              -1 ||
            errorMsg
              .toLowerCase()
              .indexOf('OperationName: NetworkTrace'.toLowerCase()) > -1
          ) {
            this.status = NetworkTraceStatus.AlreadyRunning;
          } else {
            this.errorMessage = errorMsg;
          }
        } else {
          this.errorMessage = JSON.stringify(error);
        }
      }
    );
  }

  getErrorMessage(error: any): string {
    let actualError: string = '';
    if (error.text().length > 0) {
      try {
        const errorData = JSON.parse(error.text());
        if (errorData.Message) {
          actualError = error.status + ' - ' + errorData.Message;
        } else {
          actualError = error.status + ' - ' + error.text();
        }
      } catch (err) {
        actualError = error.text();
      }
    }
    return actualError;
  }

  checkNetworkTraceOperationStatus() {
    if (this.armOperationStatus !== '') {
      this._armClient
        .getResourceFullUrl(this.armOperationStatus, true)
        .subscribe((resp: NetworkTraceResult[]) => {
          if (resp != null) {
            this.status = NetworkTraceStatus.Completed;
            this.subscriptionOperationStatus.unsubscribe();
            resp.forEach((element) => {
              if (element.status.toLowerCase() === 'Succeeded'.toLowerCase()) {
                if (element.path !== '') {
                  this.files.push({
                    name: element.path,
                    url: this.getHttpPathFromFileName(element.path)
                  });
                }
              }
            });
          }
        });
    }
  }

  getHttpPathFromFileName(fileName: string) {
    let result = fileName.replace(/D:\\home/gi, 'api/vfs');
    result = result.replace(/\\/, '/');
    result = `https://${this.scmPath}/${result}`;
    return result;
  }

  makeArmCall<S>(
    resourceUri: string,
    isPostRequest: boolean = true,
    fullUrlPassed: boolean = false,
    body?: S,
    apiVersion?: string
  ): Observable<Response | {}> {
    let url: string = `${this._armClient.armUrl}${resourceUri}${
      resourceUri.indexOf('?') >= 0 ? '&' : '?'
    }api-version=${
      !!apiVersion ? apiVersion : this._armClient.websiteApiVersion
    }`;
    if (fullUrlPassed) {
      url = resourceUri;
    }
    let bodyString: string = '';
    if (body) {
      bodyString = JSON.stringify(body);
    }
    if (isPostRequest) {
      return this._http.post<S>(url, bodyString, {
        headers: this._armClient.getHeaders()
      });
    } else {
      return this._http.get<S>(url, { headers: this._armClient.getHeaders() });
    }
  }
}

enum NetworkTraceStatus {
  Initial,
  Starting,
  Started,
  InProgress,
  AlreadyRunning,
  Completed
}

enum NetworkTraceDisabledReason {
  AppNotOnDedicatedTier,
  NoPermsOnAppServicePlan
}
