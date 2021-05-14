import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';
import { Observable } from 'rxjs';
import { QueryResponse } from 'diagnostic-data';
import { Package } from '../../../shared/models/package';
import { filter } from 'rxjs-compat/operator/filter';
import { map } from 'rxjs/operators';

@Injectable()
export class ApplensDiagnosticService {
  public resourceId:string = "";
  constructor(private _diagnosticApi: DiagnosticApiService, private _resourceService: ResourceService) {
    this.resourceId = this._resourceService.getCurrentResourceId(true);
    if(!this.resourceId.startsWith("/")) this.resourceId = "/" + this.resourceId;
  }

  getDetector(detector: string, startTime: string, endTime: string, refresh: boolean = false, internalView: boolean = true, formQueryParams?: string,overrideResourceUri?: string): Observable<DetectorResponse> {
    let resourceId = overrideResourceUri ? overrideResourceUri : this._resourceService.getCurrentResourceId(true);
    if(!resourceId.startsWith('/')) resourceId = '/' + resourceId;

    let versionPrefix = this._resourceService.versionPrefix;
    if(versionPrefix.endsWith('/')) versionPrefix = versionPrefix.substring(versionPrefix.length - 1);
    return this._diagnosticApi.getDetector(
      versionPrefix,
      resourceId,
      detector,
      startTime,
      endTime,
      null,
      refresh,
      internalView,
      formQueryParams);
  }

  getSystemInvoker(detector: string, systemInvokerId: string = '', dataSource: string, timeRange: string): Observable<DetectorResponse> {
    return this._diagnosticApi.getSystemInvoker(
      this._resourceService.getCurrentResourceId(true),
      detector,
      systemInvokerId,
      dataSource,
      timeRange,
      null);
  }

  getDetectors(overrideResourceUri:string = "",internalClient: boolean = true,query?: string): Observable<DetectorMetaData[]> {
    var queryParams: any[] = null;

    let resourceId = overrideResourceUri ? overrideResourceUri : this._resourceService.getCurrentResourceId(true);
    if(!resourceId.startsWith('/')) resourceId = '/' + resourceId;

    let versionPrefix = this._resourceService.versionPrefix;
    if(versionPrefix.endsWith('/')) versionPrefix = versionPrefix.substring(0,versionPrefix.length - 1);
    if (query != null)
      queryParams = [{ "key": "text", "value": encodeURIComponent(query) }];
      return this._diagnosticApi.getDetectors(
        versionPrefix,
        resourceId,
        null,
        queryParams,
        internalClient);
  }

  getDetectorsSearch(query: string, internalClient: boolean = true): Observable<DetectorMetaData[]> {
    var queryParams: any[] = null;
    if (query != null)
      queryParams = [{ "key": "text", "value": encodeURIComponent(query) }];
      return this._diagnosticApi.getDetectors(
        this._resourceService.versionPrefix,
        this._resourceService.getCurrentResourceId(true),
        null,
        queryParams,
        internalClient);
  }

  getDetectorMetaDataById(id:string):Observable<DetectorMetaData> {
    return this.getDetectors().pipe(map(datas => {
      return datas.find(d => d.id === id);
    }));
  }

  getUsers(body: any): Observable<any> {
    return this._diagnosticApi.getUsers(body);
  }

  getSupportTopics(pesId: any): Observable<any> {
    return this._diagnosticApi.getSupportTopics(pesId);
  }

  getSearchEnabledForProductId(): Observable<any> {
    let pesId = this._resourceService.pesId;
    return this._diagnosticApi.get(`api/github/search/isEnabledForProductId/${pesId}`, true);
  }

  getSelfHelpContent(pesId: string = "14748", supportTopicId: string = "32581605", path: string = "microsoft.web"): Observable<any> {
    return this._diagnosticApi.getSelfHelpContent(pesId, supportTopicId, path);
  }

  getGists(): Observable<DetectorMetaData[]> {
    return this._diagnosticApi.getGists(
      this._resourceService.versionPrefix,
      this._resourceService.getCurrentResourceId(true),
      null);
  }


  getUserPhoto(userId: string = ""): Observable<any> {
    return this._diagnosticApi.getUserPhoto(userId);
  }

  getUserInfo(userId: string = ""): Observable<any> {
    return this._diagnosticApi.getUserInfo(userId);
  }

  getHasTestersAccess(): Observable<any> {
    return this._diagnosticApi.getHasTestersAccess();
  }

  getCompilerResponse(body: any, isSystemInvoker: boolean, detectorId: string = '', startTime: string = '', endTime: string = '', dataSource: string = '', timeRange: string = '', additionalParams: any, publishingDetectorId:string): Observable<QueryResponse<DetectorResponse>> {
    if (isSystemInvoker === false)
    {
      return this._diagnosticApi.getCompilerResponse(
        this._resourceService.versionPrefix,
        this._resourceService.getCurrentResourceId(true),
        body,
        startTime,
        endTime,
        additionalParams, publishingDetectorId);
    }
    else
    {
      return this._diagnosticApi.getSystemCompilerResponse(
        this._resourceService.getCurrentResourceId(true),
        body,
        detectorId,
        dataSource,
        timeRange,
        additionalParams);
    }
  }

  prepareLocalDevelopment(body: any, detectorId: string = '', startTime: string = '', endTime: string = '', dataSource: string = '', timeRange: string = ''): Observable<string> {
    detectorId = detectorId === '' ? 'newdetector' : detectorId;
    return this._diagnosticApi.getLocalDevelopmentResponse(
      detectorId.toLowerCase(),
      this._resourceService.versionPrefix,
      '/'+this._resourceService.getCurrentResourceId(true),
      body,
      startTime,
      endTime);
  }

  verfifyPublishingDetectorAccess(resourceType: string, detectorCode: string, isOriginalCodeMarkedPublic: boolean) : Observable<any> {
    return this._diagnosticApi.verfifyPublishingDetectorAccess(resourceType, detectorCode, isOriginalCodeMarkedPublic);
  }

  publishDetector(emailRecipients: string, pkg: Package, resourceType: string, isOriginalCodeMarkedPublic: boolean) : Observable<any> {
    return this._diagnosticApi.publishPackage(
      this._resourceService.getCurrentResourceId(true),
      emailRecipients,
      pkg,
      resourceType,
      isOriginalCodeMarkedPublic
    );
  }

  createOrUpdateKustoMappings(body: string) : Observable<any> {
    return this._diagnosticApi.createOrUpdateKustoMappings(this._resourceService.getCurrentResourceId(true), body);
  }

  getKustoMappings() : Observable<any> {
    return this._diagnosticApi.getKustoMappings(this._resourceService.getCurrentResourceId(true));
  }
}
