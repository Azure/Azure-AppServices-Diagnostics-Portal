import { Injectable } from '@angular/core';
import { DataProviderMetadata, DetectorResponse } from '../models/detector';
import { BehaviorSubject } from 'rxjs';
import { QueryResponse } from '../models/compiler-response';

@Injectable({
  providedIn: 'root'
})
export class QueryResponseService {

  queryResponse: QueryResponse<DetectorResponse> = undefined;
  private qrObservable: BehaviorSubject<QueryResponse<DetectorResponse>> = new BehaviorSubject<QueryResponse<DetectorResponse>>(this.queryResponse);
  private dataSourcesDictionary: {key: string, value: DataProviderMetadata[]}[] = [];
  
  constructor() { }

  public addQueryResponse(qr: QueryResponse<DetectorResponse>){
    this.queryResponse = qr;
    this.qrObservable.next(this.queryResponse);
  }

  public appendDataSources(qr: QueryResponse<DetectorResponse>, key: string){
    let newKey = this.generateDatasourceKey();
    this.dataSourcesDictionary.push({key: newKey, value: qr.invocationOutput.dataProvidersMetadata});
    if (!!key && key != '') this.removeDataSources(key);
    qr.invocationOutput.dataProvidersMetadata.forEach((dp, index) => {
      dp.propertyBag.forEach(q => {
        this.queryResponse.invocationOutput.dataProvidersMetadata[index].propertyBag.push(q);
      });
    });

    this.qrObservable.next(this.queryResponse);
    return newKey;
  }

  public clearQueryResponse() {
    this.queryResponse = undefined;
    this.qrObservable.next(this.queryResponse);
  }

  public getQueryResponse() {
    return this.qrObservable;
  }

  private generateDatasourceKey() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
        v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private removeDataSources(key: string){
    let valueToRemove = this.dataSourcesDictionary.find(x => x.key == key);
    valueToRemove.value.forEach((v, index) => {
      v.propertyBag.forEach(q => {
        let position = this.queryResponse.invocationOutput.dataProvidersMetadata[index].propertyBag.findIndex(i => i.value == q.value);
        if (position != -1) this.queryResponse.invocationOutput.dataProvidersMetadata[index].propertyBag.splice(position, 1);
      });
    });
  }
}
